/**
 * 二要素認証システム
 * TOTP (Time-based One-Time Password) を使用
 */

import { createAdminClient } from "@/lib/supabase/admin";
import QRCode from "qrcode";
import speakeasy from "speakeasy";

export interface TwoFactorSetup {
	secret: string;
	qrCodeUrl: string;
	manualEntryKey: string;
}

/**
 * 管理者用の2FA設定を生成
 */
export async function generateTwoFactorSetup(userId: string): Promise<TwoFactorSetup> {
	const secret = speakeasy.generateSecret({
		name: `Kouden App Admin (${userId})`,
		issuer: "Kouden App",
		length: 32,
	});

	if (!(secret.otpauth_url && secret.base32)) {
		throw new Error("Failed to generate 2FA secret");
	}

	const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

	return {
		secret: secret.base32,
		qrCodeUrl,
		manualEntryKey: secret.base32,
	};
}

/**
 * 2FAトークンを検証
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
	return speakeasy.totp.verify({
		secret,
		encoding: "base32",
		token,
		window: 4, // 許容時間ウィンドウを拡大（30秒 × 4 = 120秒前後）
		step: 30, // 30秒ステップ（デフォルト）
	});
}

/**
 * 管理者の2FA設定を保存
 */
export async function saveTwoFactorSecret(userId: string, secret: string): Promise<void> {
	const supabase = createAdminClient();

	const { error } = await supabase
		.from("admin_users")
		.update({
			two_factor_secret: secret,
			two_factor_enabled: true,
			updated_at: new Date().toISOString(),
		})
		.eq("user_id", userId);

	if (error) {
		throw new Error(`Failed to save 2FA secret: ${error.message}`);
	}
}

/**
 * 管理者の2FA設定を取得
 */
export async function getTwoFactorSecret(userId: string): Promise<string | null> {
	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("admin_users")
		.select("two_factor_secret, two_factor_enabled")
		.eq("user_id", userId)
		.single();

	if (error || !data?.two_factor_enabled) {
		return null;
	}

	return data.two_factor_secret;
}

/**
 * 2FA が有効な管理者かチェック
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("admin_users")
		.select("two_factor_enabled")
		.eq("user_id", userId)
		.single();

	return !error && data?.two_factor_enabled === true;
}

/**
 * 2FA無効化
 */
export async function disableTwoFactor(userId: string): Promise<void> {
	const supabase = createAdminClient();

	const { error } = await supabase
		.from("admin_users")
		.update({
			two_factor_secret: null,
			two_factor_enabled: false,
			updated_at: new Date().toISOString(),
		})
		.eq("user_id", userId);

	if (error) {
		throw new Error(`Failed to disable 2FA: ${error.message}`);
	}
}
