/**
 * 管理者用2FA設定 Server Actions
 * 二要素認証の設定・検証・無効化を行う
 */

"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { logTwoFactorEventServerAction } from "@/lib/security/security-logger";
import {
	disableTwoFactor,
	isTwoFactorEnabled,
	saveTwoFactorSecret,
	verifyTwoFactorToken,
} from "@/lib/security/two-factor-auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 2FA設定を完了する
 */
export async function setupTwoFactorAuth(
	secret: string,
	verificationCode: string,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// 管理者かどうかを確認
		const { data: isAdmin } = await supabase.rpc("is_admin", {
			user_uid: user.id,
		});

		if (!isAdmin) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		// 既に2FAが設定済みかチェック
		const isAlreadyEnabled = await isTwoFactorEnabled(user.id);
		if (isAlreadyEnabled) {
			throw new KoudenError("二要素認証は既に設定済みです", ErrorCodes.ALREADY_EXISTS);
		}

		// 認証コードを検証
		const isValidToken = verifyTwoFactorToken(secret, verificationCode);

		if (!isValidToken) {
			// 失敗をログに記録
			await logTwoFactorEventServerAction("admin_2fa_failed", user.id, {
				reason: "invalid_token",
				attempted_code: `${verificationCode.slice(0, 2)}****`, // 最初の2桁のみ記録
			});

			throw new KoudenError("認証コードが正しくありません", ErrorCodes.VALIDATION_ERROR);
		}

		// 2FA設定を保存
		await saveTwoFactorSecret(user.id, secret);

		// 成功をログに記録
		await logTwoFactorEventServerAction("admin_2fa_setup", user.id, {
			setup_method: "totp",
			success: true,
		});

		// ページキャッシュを更新
		revalidatePath("/admin");
		revalidatePath("/admin/settings");

		logger.info({ userId: user.id }, "二要素認証が正常に設定されました");

		return null;
	}, "二要素認証の設定");
}

/**
 * 2FAを無効化する
 */
export async function disableTwoFactorAuth(): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// 管理者かどうかを確認
		const { data: isAdmin } = await supabase.rpc("is_admin", {
			user_uid: user.id,
		});

		if (!isAdmin) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		// 本番環境では2FA無効化を制限
		if (process.env.NODE_ENV === "production") {
			throw new KoudenError(
				"本番環境では二要素認証の無効化は制限されています",
				ErrorCodes.INVALID_OPERATION,
			);
		}

		// 2FAを無効化
		await disableTwoFactor(user.id);

		// ログに記録
		await logTwoFactorEventServerAction("admin_2fa_setup", user.id, {
			action: "disabled",
			success: true,
		});

		// ページキャッシュを更新
		revalidatePath("/admin");
		revalidatePath("/admin/settings");

		logger.info({ userId: user.id }, "二要素認証が無効化されました");

		return null;
	}, "二要素認証の無効化");
}

/**
 * 2FAログイン時の認証コード検証
 */
export async function verifyTwoFactorLogin(verificationCode: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// 管理者かどうかを確認
		const { data: isAdmin } = await supabase.rpc("is_admin", {
			user_uid: user.id,
		});

		if (!isAdmin) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		// 2FAシークレットを取得 (PGRST116 = 0 行 → 未設定、それ以外 = DB エラーとして上位へ)
		const { data: adminUser, error: adminError } = await supabase
			.from("admin_users")
			.select("two_factor_secret")
			.eq("user_id", user.id)
			.eq("two_factor_enabled", true)
			.maybeSingle();

		if (adminError) {
			// 真に DB 取得が失敗した場合は Supabase エラーを伝播させて
			// `withActionResult` 側で適切に分類させる
			throw adminError;
		}
		if (!adminUser?.two_factor_secret) {
			throw new KoudenError("二要素認証が設定されていません", ErrorCodes.NOT_FOUND);
		}

		// 認証コードを検証
		const isValidToken = verifyTwoFactorToken(adminUser.two_factor_secret, verificationCode);

		if (!isValidToken) {
			// 失敗をログに記録
			await logTwoFactorEventServerAction("admin_2fa_failed", user.id, {
				reason: "invalid_login_token",
				attempted_code: `${verificationCode.slice(0, 2)}****`,
			});

			throw new KoudenError("認証コードが正しくありません", ErrorCodes.VALIDATION_ERROR);
		}

		// 成功をログに記録
		await logTwoFactorEventServerAction("admin_2fa_verified", user.id, {
			login_success: true,
		});

		logger.info({ userId: user.id }, "認証が成功しました");

		return null;
	}, "二要素認証の検証");
}
