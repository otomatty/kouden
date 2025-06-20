/**
 * 管理者2FA必須化機能
 * 管理者アクセス時に2FAが設定されていない場合、強制的に設定ページにリダイレクトする機能を実装する
 */

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSecurityEvent } from "./security-logger";
import type { NextRequest } from "next/server";

export interface TwoFactorEnforcementResult {
	isEnforced: boolean;
	redirectUrl?: string;
	message?: string;
}

/**
 * 2FA が有効な管理者かチェック（データベース直接アクセス版）
 * speakeasyライブラリを使わずに、データベースから直接チェック
 */
async function isTwoFactorEnabledDirect(userId: string): Promise<boolean> {
	try {
		const supabase = createAdminClient();

		const { data, error } = await supabase
			.from("admin_users")
			.select("two_factor_enabled")
			.eq("user_id", userId)
			.single();

		return !error && data?.two_factor_enabled === true;
	} catch (error) {
		console.error("Failed to check 2FA status:", error);
		return false;
	}
}

/**
 * 管理者の2FA必須チェック
 * 2FAが未設定の場合はセットアップページにリダイレクト
 */
export async function enforceTwoFactorAuth(
	userId: string,
	currentPath: string,
	request?: NextRequest,
): Promise<TwoFactorEnforcementResult> {
	try {
		// 2FA設定ページ自体は除外
		const exemptPaths = [
			"/admin/settings/2fa",
			"/admin/settings/2fa/setup",
			"/admin/settings/2fa/verify",
			"/api/admin/2fa",
		];

		if (exemptPaths.some((path) => currentPath.startsWith(path))) {
			return { isEnforced: true };
		}

		// 2FAが有効かチェック（データベース直接アクセス）
		const twoFactorEnabled = await isTwoFactorEnabledDirect(userId);

		if (!twoFactorEnabled) {
			// セキュリティログに記録
			if (request) {
				await logSecurityEvent(
					{
						eventType: "unauthorized_access_attempt",
						userId,
						severity: "warning",
						details: {
							reason: "2fa_not_configured",
							attempted_path: currentPath,
							timestamp: new Date().toISOString(),
						},
					},
					request,
				);
			}

			return {
				isEnforced: false,
				redirectUrl: "/admin/settings/2fa/setup",
				message: "セキュリティ強化のため、二要素認証の設定が必要です。",
			};
		}

		return { isEnforced: true };
	} catch (error) {
		console.error("2FA enforcement check failed:", error);
		// エラー時は安全側に倒して設定ページにリダイレクト
		return {
			isEnforced: false,
			redirectUrl: "/admin/settings/2fa/setup",
			message: "認証状態の確認中にエラーが発生しました。",
		};
	}
}

/**
 * Server Action用の2FA必須チェック
 * 2FAが未設定の場合はエラーをthrow
 */
export async function requireTwoFactorAuth(userId: string): Promise<void> {
	const twoFactorEnabled = await isTwoFactorEnabledDirect(userId);

	if (!twoFactorEnabled) {
		throw new Error("二要素認証が設定されていません。設定を完了してください。");
	}
}

/**
 * Next.js middleware用の2FA必須チェック（廃止）
 * Edge Runtimeの制限により、middlewareでの2FAチェックは行わない
 * 代わりにページレベル（layout.tsx）で実行すること
 */

/**
 * 2FA設定完了後のリダイレクト先を決定
 */
export function getPostTwoFactorSetupRedirect(originalPath?: string): string {
	// 元々アクセスしようとしていたページがあれば、そこにリダイレクト
	if (originalPath && originalPath !== "/admin/settings/2fa/setup") {
		return originalPath;
	}

	// デフォルトは管理者ダッシュボード
	return "/admin";
}

/**
 * 2FA必須化のステータスを環境変数で制御
 */
export function isTwoFactorRequired(): boolean {
	// 本番環境では必須
	if (process.env.NODE_ENV === "production") {
		return true;
	}

	// 開発環境では環境変数で制御可能
	return process.env.FORCE_2FA === "true";
}

/**
 * 管理者に2FA設定を促すメッセージを生成
 */
export function getTwoFactorSetupMessage(isRequired: boolean): string {
	if (isRequired) {
		return "セキュリティ強化のため、二要素認証の設定が必須です。続行するには設定を完了してください。";
	}

	return "セキュリティ向上のため、二要素認証の設定を強く推奨します。";
}
