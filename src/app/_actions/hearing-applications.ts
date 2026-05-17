"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type HearingApplication = Database["public"]["Tables"]["campaign_hearing_applications"]["Row"];

/**
 * ヒアリング申し込みフォームのバリデーションスキーマ
 */
const hearingApplicationSchema = z.object({
	name: z.string().min(1, "お名前を入力してください"),
	email: z.string().email("有効なメールアドレスを入力してください"),
	phone: z.string().optional(),
	currentUsage: z.string().min(1, "利用状況を選択してください"),
	videoTool: z.string().min(1, "ビデオツールを選択してください"),
	feedback: z.string().optional(),
	selectedSlot: z.object({
		start: z.string(),
		end: z.string(),
	}),
});

/**
 * ヒアリング申し込みを登録する
 */
export async function submitHearingApplication(
	formData: FormData,
): Promise<ActionResult<{ applicationId: string; message: string }>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// ユーザー認証チェック
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// フォームデータの取得と検証
		const rawData = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			phone: (formData.get("phone") as string) || undefined,
			currentUsage: formData.get("currentUsage") as string,
			videoTool: formData.get("videoTool") as string,
			feedback: (formData.get("feedback") as string) || undefined,
			selectedSlot: JSON.parse(formData.get("selectedSlot") as string),
		};

		const validatedData = hearingApplicationSchema.parse(rawData);

		// 重複申し込みチェック
		const { data: existing } = await supabase
			.from("campaign_hearing_applications")
			.select("id")
			.eq("user_id", user.id)
			.eq("status", "submitted")
			.maybeSingle();

		if (existing) {
			throw new KoudenError("既に申し込み済みです", ErrorCodes.ALREADY_EXISTS);
		}

		// フォームデータにタイムスタンプを追加
		const applicationData = {
			...validatedData,
			submittedAt: new Date().toISOString(),
			userAgent: (formData.get("userAgent") as string) || undefined,
		};

		// データベースに保存
		const { data: application, error: insertError } = await supabase
			.from("campaign_hearing_applications")
			.insert({
				user_id: user.id,
				form_data: applicationData,
				status: "submitted",
			})
			.select()
			.single();

		if (insertError) throw insertError;

		// Googleカレンダー予約処理（既存の処理を流用）
		if (validatedData.selectedSlot) {
			try {
				const { reserveSlot } = await import("@/app/_actions/calendar");
				const reservationData = new FormData();
				reservationData.append("summary", `ヒアリング: ${validatedData.name}`);
				reservationData.append("email", validatedData.email);
				reservationData.append(
					"notes",
					`利用状況: ${validatedData.currentUsage}\n希望ビデオツール: ${validatedData.videoTool}\nフィードバック: ${validatedData.feedback || "なし"}\n電話: ${validatedData.phone || "未入力"}`,
				);
				reservationData.append("startDateTime", validatedData.selectedSlot.start);
				reservationData.append("endDateTime", validatedData.selectedSlot.end);

				const reservationResult = await reserveSlot(reservationData);
				if (!reservationResult.ok) {
					throw new Error(reservationResult.error.message);
				}

				// Google Event IDを保存（カレンダー予約が成功した場合）
				await supabase
					.from("campaign_hearing_applications")
					.update({
						status: "confirmed",
					})
					.eq("id", application.id);
			} catch (calendarError) {
				logger.error(
					{
						error: calendarError instanceof Error ? calendarError.message : String(calendarError),
						applicationId: application.id,
						userId: user.id,
					},
					"カレンダー予約エラー",
				);
				// カレンダー予約失敗してもデータベース保存は成功としてエラーにしない
				// ただし、ステータスは submitted のまま残す
			}
		}

		return {
			applicationId: application.id,
			message: "ヒアリング申し込みが完了しました",
		};
	}, "ヒアリング申し込みの登録");
}

/**
 * ユーザーのヒアリング申し込み履歴を取得
 */
export async function getUserHearingApplications(): Promise<ActionResult<HearingApplication[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase
			.from("campaign_hearing_applications")
			.select("*")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false });

		if (error) throw error;

		return data ?? [];
	}, "申し込み履歴の取得");
}

/**
 * 管理者用：全てのヒアリング申し込みを取得
 */
export async function getAllHearingApplications(): Promise<ActionResult<HearingApplication[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// 管理者権限チェック
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data: adminUser } = await supabase
			.from("admin_users")
			.select("id")
			.eq("user_id", user.id)
			.single();

		if (!adminUser) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		const { data, error } = await supabase
			.from("campaign_hearing_applications")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw error;

		return data ?? [];
	}, "申し込み一覧の取得");
}

/**
 * ヒアリング申し込みのステータスを更新
 */
export async function updateHearingApplicationStatus(
	applicationId: string,
	status: "submitted" | "confirmed" | "completed" | "cancelled",
): Promise<ActionResult<HearingApplication>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// 管理者権限チェック
		const { data: adminUser } = await supabase
			.from("admin_users")
			.select("id")
			.eq("user_id", user.id)
			.single();

		if (!adminUser) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		const { data, error } = await supabase
			.from("campaign_hearing_applications")
			.update({ status })
			.eq("id", applicationId)
			.select()
			.single();

		if (error) throw error;

		revalidatePath("/admin");

		return data;
	}, "ステータスの更新");
}
