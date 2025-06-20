/**
 * ログイン試行制限システム
 * アカウントロック機能付き
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export interface LoginAttempt {
	id: string;
	user_id?: string;
	ip_address: string;
	attempt_count: number;
	last_attempt_at: string;
	locked_until?: string;
	created_at: string;
}

// 最大ログイン試行回数
const MAX_LOGIN_ATTEMPTS = 10;
// ロック時間（分）
const LOCK_DURATION_MINUTES = 30;

/**
 * ログイン試行を記録
 */
export async function recordLoginAttempt(
	request: NextRequest,
	userId?: string,
	success = false,
): Promise<void> {
	const supabase = createAdminClient();
	const ipAddress = getClientIP(request);

	if (!ipAddress) {
		console.warn("Could not determine IP address for login attempt");
		return;
	}

	if (success) {
		// 成功時は試行記録をクリア
		await clearLoginAttempts(ipAddress, userId);
		return;
	}

	// 失敗時は試行回数を増加
	const { data: existingAttempt } = await supabase
		.from("login_attempts")
		.select("*")
		.eq("ip_address", ipAddress)
		.eq("user_id", userId || "")
		.single();

	if (existingAttempt) {
		const newAttemptCount = existingAttempt.attempt_count + 1;
		const shouldLock = newAttemptCount >= MAX_LOGIN_ATTEMPTS;
		const lockedUntil = shouldLock
			? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000).toISOString()
			: null;

		await supabase
			.from("login_attempts")
			.update({
				attempt_count: newAttemptCount,
				last_attempt_at: new Date().toISOString(),
				locked_until: lockedUntil,
			})
			.eq("id", existingAttempt.id);
	} else {
		await supabase.from("login_attempts").insert({
			user_id: userId,
			ip_address: ipAddress,
			attempt_count: 1,
			last_attempt_at: new Date().toISOString(),
		});
	}
}

/**
 * アカウント/IPがロックされているかチェック
 */
export async function isAccountLocked(
	request: NextRequest,
	userId?: string,
): Promise<{ locked: boolean; remainingTime?: number }> {
	const supabase = createAdminClient();
	const ipAddress = getClientIP(request);

	if (!ipAddress) {
		return { locked: false };
	}

	const { data: attempt } = await supabase
		.from("login_attempts")
		.select("*")
		.eq("ip_address", ipAddress)
		.eq("user_id", userId || "")
		.single();

	if (!attempt?.locked_until) {
		return { locked: false };
	}

	const lockExpires = new Date(attempt.locked_until);
	const now = new Date();

	if (now < lockExpires) {
		const remainingTime = Math.ceil((lockExpires.getTime() - now.getTime()) / 60000);
		return { locked: true, remainingTime };
	}

	// ロック期限が過ぎている場合はクリア
	await clearLoginAttempts(ipAddress, userId);
	return { locked: false };
}

/**
 * ログイン試行記録をクリア
 */
async function clearLoginAttempts(ipAddress: string, userId?: string): Promise<void> {
	const supabase = createAdminClient();

	await supabase
		.from("login_attempts")
		.delete()
		.eq("ip_address", ipAddress)
		.eq("user_id", userId || "");
}

/**
 * 管理者用: 強制的にアカウントロックを解除
 */
export async function unlockAccount(userId: string): Promise<void> {
	const supabase = createAdminClient();

	await supabase.from("login_attempts").delete().eq("user_id", userId);
}

/**
 * リクエストからクライアントIPアドレスを取得
 */
function getClientIP(request: NextRequest): string | null {
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() || null;
	}

	const cfConnectingIP = request.headers.get("cf-connecting-ip");
	if (cfConnectingIP) {
		return cfConnectingIP;
	}

	const xRealIP = request.headers.get("x-real-ip");
	if (xRealIP) {
		return xRealIP;
	}

	return null;
}
