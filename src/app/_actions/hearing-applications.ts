"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
export async function submitHearingApplication(formData: FormData) {
	try {
		const supabase = await createClient();

		// ユーザー認証チェック
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			throw new Error("認証が必要です");
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
			throw new Error("既に申し込み済みです");
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

		if (insertError) {
			console.error("Database insert error:", insertError);
			throw new Error("申し込み保存に失敗しました");
		}

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

				await reserveSlot(reservationData);

				// Google Event IDを保存（カレンダー予約が成功した場合）
				await supabase
					.from("campaign_hearing_applications")
					.update({
						status: "confirmed",
					})
					.eq("id", application.id);
			} catch (calendarError) {
				console.error("カレンダー予約エラー:", calendarError);
				// カレンダー予約失敗してもデータベース保存は成功としてエラーにしない
				// ただし、ステータスは submitted のまま残す
			}
		}

		return {
			success: true,
			applicationId: application.id,
			message: "ヒアリング申し込みが完了しました",
		};
	} catch (error) {
		console.error("ヒアリング申し込みエラー:", error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: "入力データが不正です",
				details: error.errors,
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : "申し込み処理に失敗しました",
		};
	}
}

/**
 * ユーザーのヒアリング申し込み履歴を取得
 */
export async function getUserHearingApplications() {
	try {
		const supabase = await createClient();

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			throw new Error("認証が必要です");
		}

		const { data, error } = await supabase
			.from("campaign_hearing_applications")
			.select("*")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("申し込み履歴取得エラー:", error);
			throw new Error("申し込み履歴の取得に失敗しました");
		}

		return {
			success: true,
			applications: data,
		};
	} catch (error) {
		console.error("申し込み履歴取得エラー:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "申し込み履歴の取得に失敗しました",
		};
	}
}

/**
 * 管理者用：全てのヒアリング申し込みを取得
 */
export async function getAllHearingApplications() {
	try {
		const supabase = await createClient();

		// 管理者権限チェック
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			throw new Error("認証が必要です");
		}

		const { data: adminUser } = await supabase
			.from("admin_users")
			.select("id")
			.eq("user_id", user.id)
			.single();

		if (!adminUser) {
			throw new Error("管理者権限が必要です");
		}

		const { data, error } = await supabase
			.from("campaign_hearing_applications")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			console.error("申し込み一覧取得エラー:", error);
			throw new Error("申し込み一覧の取得に失敗しました");
		}

		return {
			success: true,
			applications: data,
		};
	} catch (error) {
		console.error("申し込み一覧取得エラー:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "申し込み一覧の取得に失敗しました",
		};
	}
}

/**
 * ヒアリング申し込みのステータスを更新
 */
export async function updateHearingApplicationStatus(
	applicationId: string,
	status: "submitted" | "confirmed" | "completed" | "cancelled",
) {
	try {
		const supabase = await createClient();

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			throw new Error("認証が必要です");
		}

		// 管理者権限チェック
		const { data: adminUser } = await supabase
			.from("admin_users")
			.select("id")
			.eq("user_id", user.id)
			.single();

		if (!adminUser) {
			throw new Error("管理者権限が必要です");
		}

		const { data, error } = await supabase
			.from("campaign_hearing_applications")
			.update({ status })
			.eq("id", applicationId)
			.select()
			.single();

		if (error) {
			console.error("ステータス更新エラー:", error);
			throw new Error("ステータスの更新に失敗しました");
		}

		revalidatePath("/admin");

		return {
			success: true,
			application: data,
		};
	} catch (error) {
		console.error("ステータス更新エラー:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "ステータスの更新に失敗しました",
		};
	}
}
