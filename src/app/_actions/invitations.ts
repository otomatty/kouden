"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import ms from "ms";
import { z } from "zod";

const INVITATION_TOKEN_SCHEMA = z.string().uuid();

const createInvitationSchema = z.object({
	koudenId: z.string().uuid(),
	roleId: z.string().uuid(),
	maxUses: z.number().nullable().optional(),
	expiresIn: z.string().default("7d"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

// kouden_invitations テーブルの行型に kouden_data の具体的な型をマージする
// JSONB カラムの型は Supabase 生成型だと Json とかになるから、ここで上書きするの
type KoudenInvitationRowWithKoudenData =
	Database["public"]["Tables"]["kouden_invitations"]["Row"] & {
		kouden_data: { id: string; title: string; description?: string } | null;
	};

type InvitationDetail = KoudenInvitationRowWithKoudenData & {
	creator: { display_name: string | null } | null;
	isExistingMember: boolean;
};

export async function createShareInvitation(
	input: CreateInvitationInput,
): Promise<ActionResult<KoudenInvitationRowWithKoudenData>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { koudenId, roleId, maxUses, expiresIn } = createInvitationSchema.parse(input);

		// 香典帳の情報を取得
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.select("id, title, description")
			.eq("id", koudenId)
			.single();

		if (koudenError) throw koudenError;

		// 招待情報を作成
		const { data: invitation, error } = await supabase
			.from("kouden_invitations")
			.insert({
				kouden_id: koudenId,
				role_id: roleId,
				max_uses: maxUses,
				expires_at: new Date(Date.now() + (ms(expiresIn) as number)).toISOString(),
				created_by: user.id,
				kouden_data: kouden,
			})
			.select()
			.single<KoudenInvitationRowWithKoudenData>();

		if (error) throw error;

		return invitation;
	}, "招待リンクの作成");
}

export async function getInvitation(token: string): Promise<ActionResult<InvitationDetail>> {
	return withActionResult(async () => {
		// 入力検証: UUID 以外をDBに当てない
		const parsedToken = INVITATION_TOKEN_SCHEMA.safeParse(token);
		if (!parsedToken.success) {
			throw new KoudenError("招待情報が見つかりません", ErrorCodes.NOT_FOUND);
		}

		// セッション取得は通常クライアントで行う（auth.uid を取り出すため）
		const userClient = await createClient();
		const {
			data: { user },
		} = await userClient.auth.getUser();

		// 招待行のルックアップは admin client で実行する。
		// kouden_invitations への匿名 SELECT は RLS で禁止しているため、
		// トークン入力をサーバー側で検証してから service-role で取得する。
		const adminClient = createAdminClient();
		const query = adminClient
			.from("kouden_invitations")
			.select(`
				*,
				role:kouden_roles!kouden_invitations_role_id_fkey (
					id,
					name
				)
			`)
			.eq("invitation_token", parsedToken.data)
			.eq("status", "pending")
			.gt("expires_at", new Date().toISOString())
			.single();

		// NOTE: getInvitation の返り値も型を厳密にするなら修正が必要
		const { data: invitation, error: invitationError } = (await query) as {
			data: KoudenInvitationRowWithKoudenData | null;
			error: PostgrestError;
		};

		if (invitationError) {
			if (invitationError.code === "PGRST116") {
				throw new KoudenError("招待情報が見つかりません", ErrorCodes.NOT_FOUND);
			}
			throw invitationError;
		}

		if (!invitation) {
			throw new KoudenError("招待情報が見つかりません", ErrorCodes.NOT_FOUND);
		}

		// 作成者の情報を取得（profiles は誰でも閲覧可能なため通常クライアントでも可）
		const { data: creatorProfile, error: creatorError } = await adminClient
			.from("profiles")
			.select("display_name")
			.eq("id", invitation.created_by)
			.single();

		if (creatorError) {
			logger.warn(
				{
					error: creatorError.message,
					code: creatorError.code,
					creatorId: invitation.created_by,
				},
				"Failed to get creator profile",
			);
		}

		// ユーザーが既にメンバーかどうかをチェック
		let isExistingMember = false;
		if (user) {
			const { data: existingMember, error: memberCheckError } = await adminClient
				.from("kouden_members")
				.select("id")
				.eq("kouden_id", invitation.kouden_id)
				.eq("user_id", user.id)
				.single();

			if (memberCheckError && memberCheckError.code !== "PGRST116") {
				logger.warn(
					{
						error: memberCheckError.message,
						code: memberCheckError.code,
						userId: user.id,
						koudenId: invitation.kouden_id,
					},
					"Failed to check existing membership",
				);
			}

			isExistingMember = !!existingMember;
		}

		// 全ての情報を結合して返す
		const result: InvitationDetail = {
			...invitation,
			creator: creatorProfile || null,
			kouden_data: invitation.kouden_data,
			isExistingMember,
		};

		return result;
	}, "招待情報の取得");
}

/**
 * `accept_invitation_atomic` RPC が raise するメッセージトークンを
 * `KoudenError` にマップする。RPC 内で `select ... for update` により
 * 検証〜INSERT〜used_count 更新を 1 トランザクションで実行するため、
 * 既存のエラーコード (NOT_FOUND / ALREADY_EXISTS / INVALID_OPERATION) は
 * ここで再現する。マップに無いエラーは withActionResult 側で
 * KoudenError.fromSupabase により変換させる (null を返す)。
 */
function mapAcceptInvitationRpcError(rpcError: PostgrestError): KoudenError | null {
	switch (rpcError.message) {
		case "invitation_not_found":
			return new KoudenError("招待が見つかりません", ErrorCodes.NOT_FOUND);
		case "invitation_not_pending":
			return new KoudenError("この招待は既に使用されています", ErrorCodes.INVALID_OPERATION);
		case "invitation_expired":
			return new KoudenError("招待の有効期限が切れています", ErrorCodes.INVALID_OPERATION);
		case "invitation_max_uses_reached":
			return new KoudenError("招待の使用回数が上限に達しました", ErrorCodes.INVALID_OPERATION);
		case "already_member":
			return new KoudenError("すでにメンバーとして参加しています", ErrorCodes.ALREADY_EXISTS);
		default:
			return null;
	}
}

export async function acceptInvitation(token: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		// 入力検証: UUID 以外は弾く
		const parsedToken = INVITATION_TOKEN_SCHEMA.safeParse(token);
		if (!parsedToken.success) {
			throw new KoudenError("招待が見つかりません", ErrorCodes.NOT_FOUND);
		}

		// 認証チェックは必ず通常クライアントから（auth.uid()）
		const userClient = await createClient();
		const {
			data: { user },
		} = await userClient.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// 招待の検証・メンバー追加・used_count 更新は RPC でアトミックに行う。
		// 非アトミックに展開すると、max_uses 制限のある招待が並列受諾で上限超過
		// する競合が成立するため (issue #113)。
		//
		// service-role で呼び出す:
		// - kouden_invitations は RLS で匿名/他人からの SELECT を禁止している
		// - kouden_members への INSERT は所有者のみ許可するポリシーのため、招待
		//   経由の自分自身の追加もサーバー側で検証してから admin で実施する
		// RPC 内では auth.uid() が取れない (service-role セッション) ため、
		// 通常クライアントで検証した user.id を渡す。
		const supabase = createAdminClient();

		const { error: rpcError } = await supabase.rpc("accept_invitation_atomic", {
			p_token: parsedToken.data,
			p_user_id: user.id,
		});

		if (rpcError) {
			const mapped = mapAcceptInvitationRpcError(rpcError);
			if (mapped) {
				throw mapped;
			}
			// 想定外の DB エラー。詳細はログに残し、withActionResult で変換させる。
			logger.error(
				{
					error: rpcError.message,
					code: rpcError.code,
					token: parsedToken.data,
					userId: user.id,
				},
				"accept_invitation_atomic RPC failed",
			);
			throw rpcError;
		}

		return null;
	}, "招待の承認");
}
