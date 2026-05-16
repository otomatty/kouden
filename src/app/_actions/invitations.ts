"use server";

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

export async function createShareInvitation(
	input: CreateInvitationInput,
): Promise<KoudenInvitationRowWithKoudenData> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

		const { koudenId, roleId, maxUses, expiresIn } = createInvitationSchema.parse(input);

		// 香典帳の情報を取得
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.select("id, title, description")
			.eq("id", koudenId)
			.single();

		if (koudenError) {
			throw new Error("香典帳情報の取得に失敗しました");
		}

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

		if (error) {
			throw new Error("招待リンクの作成に失敗しました");
		}

		return invitation;
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				input,
			},
			"Error in createShareInvitation",
		);
		throw error;
	}
}

export async function getInvitation(token: string) {
	try {
		// 入力検証: UUID 以外をDBに当てない
		const parsedToken = INVITATION_TOKEN_SCHEMA.safeParse(token);
		if (!parsedToken.success) {
			throw new Error("招待情報が見つかりません");
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
			logger.error(
				{
					error: invitationError.message,
					code: invitationError.code,
				},
				"Database error in getInvitation",
			);
			if (invitationError.code === "PGRST116") {
				throw new Error("招待情報が見つかりません");
			}
			throw new Error("招待情報の取得に失敗しました");
		}

		if (!invitation) {
			logger.error({}, "No invitation found for token");
			throw new Error("招待情報が見つかりません");
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
		const result = {
			...invitation,
			creator: creatorProfile || null,
			kouden_data: invitation.kouden_data,
			isExistingMember,
		};

		return result;
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				token,
			},
			"Error in getInvitation",
		);
		throw error;
	}
}

export async function acceptInvitation(token: string) {
	try {
		// 入力検証: UUID 以外は弾く
		const parsedToken = INVITATION_TOKEN_SCHEMA.safeParse(token);
		if (!parsedToken.success) {
			throw new Error("招待が見つかりません");
		}

		// 認証チェックは必ず通常クライアントから（auth.uid()）
		const userClient = await createClient();
		const {
			data: { user },
		} = await userClient.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

		// 以降は service-role で操作する:
		// - kouden_invitations は RLS で匿名/他人からのSELECTを禁止しているため admin で参照
		// - kouden_members への INSERT は所有者のみ許可するポリシーに変更したため
		//   招待経由の自分自身の追加もサーバー側で検証してから admin で実施する
		const supabase = createAdminClient();

		// 1. 招待情報を取得
		const { data: invitation, error: invitationError } = await supabase
			.from("kouden_invitations")
			.select("*")
			.eq("invitation_token", parsedToken.data)
			.single();

		if (invitationError) {
			logger.error(
				{
					error: invitationError.message,
					code: invitationError.code,
				},
				"Failed to get invitation",
			);
			if (invitationError.code === "PGRST116") {
				throw new Error("招待が見つかりません");
			}
			throw new Error("招待情報の取得に失敗しました");
		}

		if (!invitation) {
			logger.error({}, "No invitation found for token");
			throw new Error("招待が見つかりません");
		}

		// 2. 招待の有効性チェック
		if (invitation.status !== "pending") {
			logger.warn(
				{
					invitationId: invitation.id,
					status: invitation.status,
				},
				"Invitation status is not pending",
			);
			throw new Error("この招待は既に使用されています");
		}

		const now = new Date();
		const expiresAt = new Date(invitation.expires_at);
		if (expiresAt < now) {
			logger.warn(
				{
					invitationId: invitation.id,
					expiresAt: expiresAt.toISOString(),
					now: now.toISOString(),
				},
				"Invitation expired",
			);
			throw new Error("招待の有効期限が切れています");
		}

		if (invitation.max_uses && invitation.used_count >= invitation.max_uses) {
			logger.warn(
				{
					invitationId: invitation.id,
					used_count: invitation.used_count,
					max_uses: invitation.max_uses,
				},
				"Invitation usage limit exceeded",
			);
			throw new Error("招待の使用回数が上限に達しました");
		}

		// 3. 既存メンバーチェック
		const { data: existingMember, error: memberCheckError } = await supabase
			.from("kouden_members")
			.select("id")
			.eq("kouden_id", invitation.kouden_id)
			.eq("user_id", user.id)
			.single();

		if (memberCheckError && memberCheckError.code !== "PGRST116") {
			logger.error(
				{
					error: memberCheckError.message,
					code: memberCheckError.code,
					userId: user.id,
					koudenId: invitation.kouden_id,
				},
				"Failed to check existing membership",
			);
			throw new Error("メンバーシップの確認に失敗しました");
		}

		if (existingMember) {
			logger.warn(
				{
					userId: user.id,
					koudenId: invitation.kouden_id,
				},
				"User is already a member",
			);
			throw new Error("すでにメンバーとして参加しています");
		}

		// 4. メンバー追加（招待の created_by を added_by として記録する）
		const { error: memberError } = await supabase.from("kouden_members").insert({
			kouden_id: invitation.kouden_id,
			user_id: user.id,
			role_id: invitation.role_id,
			invitation_id: invitation.id,
			added_by: invitation.created_by,
		});

		if (memberError) {
			logger.error(
				{
					error: memberError.message,
					code: memberError.code,
					userId: user.id,
					koudenId: invitation.kouden_id,
					invitationId: invitation.id,
				},
				"Failed to add member",
			);
			throw new Error("メンバーの追加に失敗しました");
		}

		// 5. 招待のステータスと使用回数を更新
		const { error: updateError } = await supabase
			.from("kouden_invitations")
			.update({
				status: "accepted",
				used_count: invitation.used_count + 1,
			})
			.eq("id", invitation.id);

		if (updateError) {
			logger.error(
				{
					error: updateError.message,
					code: updateError.code,
					invitationId: invitation.id,
				},
				"Failed to update invitation",
			);
			// メンバー追加は成功しているので、招待の更新失敗は警告レベル
			logger.warn(
				{
					invitationId: invitation.id,
					userId: user.id,
				},
				"Member was added but invitation update failed",
			);
		}

		return { success: true };
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				token,
			},
			"Error in acceptInvitation",
		);
		throw error;
	}
}
