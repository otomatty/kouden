/**
 * 管理者用2FA設定 Server Actions
 * 二要素認証の設定・検証・無効化を行う
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
	verifyTwoFactorToken,
	saveTwoFactorSecret,
	disableTwoFactor,
	isTwoFactorEnabled,
} from "@/lib/security/two-factor-auth";
import { logTwoFactorEventServerAction } from "@/lib/security/security-logger";
import { revalidatePath } from "next/cache";

export interface TwoFactorActionResult {
	success: boolean;
	error?: string;
	message?: string;
}

/**
 * 2FA設定を完了する
 */
export async function setupTwoFactorAuth(
	secret: string,
	verificationCode: string,
): Promise<TwoFactorActionResult> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "認証が必要です" };
		}

		// 管理者かどうかを確認
		const { data: isAdmin } = await supabase.rpc("is_admin", {
			user_uid: user.id,
		});

		if (!isAdmin) {
			return { success: false, error: "管理者権限が必要です" };
		}

		// 既に2FAが設定済みかチェック
		const isAlreadyEnabled = await isTwoFactorEnabled(user.id);
		if (isAlreadyEnabled) {
			return { success: false, error: "二要素認証は既に設定済みです" };
		}

		// 認証コードを検証
		const isValidToken = verifyTwoFactorToken(secret, verificationCode);

		if (!isValidToken) {
			// 失敗をログに記録
			await logTwoFactorEventServerAction("admin_2fa_failed", user.id, {
				reason: "invalid_token",
				attempted_code: `${verificationCode.slice(0, 2)}****`, // 最初の2桁のみ記録
			});

			return { success: false, error: "認証コードが正しくありません" };
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

		return {
			success: true,
			message: "二要素認証が正常に設定されました",
		};
	} catch (error) {
		console.error("2FA setup error:", error);
		return {
			success: false,
			error: "設定中にエラーが発生しました",
		};
	}
}

/**
 * 2FAを無効化する
 */
export async function disableTwoFactorAuth(): Promise<TwoFactorActionResult> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "認証が必要です" };
		}

		// 管理者かどうかを確認
		const { data: isAdmin } = await supabase.rpc("is_admin", {
			user_uid: user.id,
		});

		if (!isAdmin) {
			return { success: false, error: "管理者権限が必要です" };
		}

		// 本番環境では2FA無効化を制限
		if (process.env.NODE_ENV === "production") {
			return {
				success: false,
				error: "本番環境では二要素認証の無効化は制限されています",
			};
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

		return {
			success: true,
			message: "二要素認証が無効化されました",
		};
	} catch (error) {
		console.error("2FA disable error:", error);
		return {
			success: false,
			error: "無効化中にエラーが発生しました",
		};
	}
}

/**
 * 2FAログイン時の認証コード検証
 */
export async function verifyTwoFactorLogin(
	verificationCode: string,
): Promise<TwoFactorActionResult> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "認証が必要です" };
		}

		// 管理者かどうかを確認
		const { data: isAdmin } = await supabase.rpc("is_admin", {
			user_uid: user.id,
		});

		if (!isAdmin) {
			return { success: false, error: "管理者権限が必要です" };
		}

		// 2FAシークレットを取得
		const { data: adminUser, error: adminError } = await supabase
			.from("admin_users")
			.select("two_factor_secret")
			.eq("user_id", user.id)
			.eq("two_factor_enabled", true)
			.single();

		if (adminError || !adminUser?.two_factor_secret) {
			return { success: false, error: "二要素認証が設定されていません" };
		}

		// 認証コードを検証
		const isValidToken = verifyTwoFactorToken(adminUser.two_factor_secret, verificationCode);

		if (!isValidToken) {
			// 失敗をログに記録
			await logTwoFactorEventServerAction("admin_2fa_failed", user.id, {
				reason: "invalid_login_token",
				attempted_code: `${verificationCode.slice(0, 2)}****`,
			});

			return { success: false, error: "認証コードが正しくありません" };
		}

		// 成功をログに記録
		await logTwoFactorEventServerAction("admin_2fa_verified", user.id, {
			login_success: true,
		});

		return {
			success: true,
			message: "認証が成功しました",
		};
	} catch (error) {
		console.error("2FA verification error:", error);
		return {
			success: false,
			error: "認証中にエラーが発生しました",
		};
	}
}
