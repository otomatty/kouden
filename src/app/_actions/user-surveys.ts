"use server";

import { createClient } from "@/lib/supabase/server";
import {
	userSurveySchema,
	type UserSurveyFormInput,
	type SurveyStatus,
	type SurveyTrigger,
} from "@/schemas/user-surveys";
import { revalidatePath } from "next/cache";

/**
 * ユーザーアンケート回答を作成
 * @param formData フォームから送信されたアンケートデータ
 * @param trigger アンケート表示のトリガー（pdf_export | one_week_usage）
 * @returns 成功/エラー結果
 */
export async function createUserSurvey(formData: UserSurveyFormInput, trigger: SurveyTrigger) {
	try {
		const supabase = await createClient();

		// 認証確認
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return {
				success: false,
				error: "認証が必要です。ログインしてからアンケートにお答えください。",
			};
		}

		// 既存回答の確認（1ユーザー1回のみ）
		const { data: existingSurvey, error: checkError } = await supabase
			.from("user_surveys")
			.select("id")
			.eq("user_id", user.id)
			.single();

		if (checkError && checkError.code !== "PGRST116") {
			console.error("既存アンケート確認エラー:", checkError);
			return {
				success: false,
				error: "アンケート状況の確認に失敗しました。時間を置いてお試しください。",
			};
		}

		if (existingSurvey) {
			return {
				success: false,
				error: "既にアンケートにご回答いただいております。貴重なご意見をありがとうございました。",
			};
		}

		// バリデーション
		const validatedData = userSurveySchema.parse({
			...formData,
			surveyTrigger: trigger,
			// nullable/optionalフィールドのデフォルト値設定
			usabilityOther: formData.usabilityOther || null,
			featureOther: formData.featureOther || null,
			additionalFeedback: formData.additionalFeedback || null,
		});

		// データベースに保存
		const { data: newSurvey, error: insertError } = await supabase
			.from("user_surveys")
			.insert({
				user_id: user.id,
				survey_trigger: validatedData.surveyTrigger,
				overall_satisfaction: validatedData.overallSatisfaction,
				nps_score: validatedData.npsScore,
				usability_easier_input: validatedData.usabilityEasierInput,
				usability_better_ui: validatedData.usabilityBetterUi,
				usability_faster_performance: validatedData.usabilityFasterPerformance,
				usability_other: validatedData.usabilityOther,
				feature_voice_input: validatedData.featureVoiceInput,
				feature_photo_attachment: validatedData.featurePhotoAttachment,
				feature_excel_integration: validatedData.featureExcelIntegration,
				feature_print_layout: validatedData.featurePrintLayout,
				feature_other: validatedData.featureOther,
				additional_feedback: validatedData.additionalFeedback,
			})
			.select()
			.single();

		if (insertError) {
			console.error("アンケート保存エラー:", insertError);
			return {
				success: false,
				error: "アンケートの保存に失敗しました。時間を置いてお試しください。",
			};
		}

		// 関連ページのキャッシュを更新
		revalidatePath("/");
		revalidatePath("/(protected)", "layout");

		return {
			success: true,
			data: newSurvey,
			message:
				"アンケートへのご回答、ありがとうございました。いただいたご意見は今後のサービス改善に活用させていただきます。",
		};
	} catch (error) {
		console.error("アンケート作成エラー:", error);

		// Zodバリデーションエラーの場合
		if (error instanceof Error && error.name === "ZodError") {
			return {
				success: false,
				error: "入力内容に不備があります。各項目を確認してください。",
			};
		}

		return {
			success: false,
			error: "予期しないエラーが発生しました。時間を置いてお試しください。",
		};
	}
}

/**
 * ユーザーのアンケート回答状況を取得
 * @param trigger 特定のトリガーのスキップ状況もチェックする場合に指定
 * @returns アンケート回答状況
 */
export async function getUserSurveyStatus(trigger?: SurveyTrigger): Promise<SurveyStatus> {
	try {
		const supabase = await createClient();

		// 認証確認
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return { hasAnswered: false };
		}

		// 既存回答の確認
		const { data: survey, error: fetchError } = await supabase
			.from("user_surveys")
			.select(`
				id,
				user_id,
				survey_trigger,
				overall_satisfaction,
				nps_score,
				usability_easier_input,
				usability_better_ui,
				usability_faster_performance,
				usability_other,
				feature_voice_input,
				feature_photo_attachment,
				feature_excel_integration,
				feature_print_layout,
				feature_other,
				additional_feedback,
				created_at,
				updated_at
			`)
			.eq("user_id", user.id)
			.single();

		if (fetchError && fetchError.code !== "PGRST116") {
			console.error("アンケート状況取得エラー:", fetchError);
			return { hasAnswered: false };
		}

		if (survey) {
			return {
				hasAnswered: true,
				surveyData: {
					id: survey.id,
					userId: survey.user_id,
					surveyTrigger: survey.survey_trigger as SurveyTrigger,
					overallSatisfaction: survey.overall_satisfaction,
					npsScore: survey.nps_score,
					usabilityEasierInput: survey.usability_easier_input ?? false,
					usabilityBetterUi: survey.usability_better_ui ?? false,
					usabilityFasterPerformance: survey.usability_faster_performance ?? false,
					usabilityOther: survey.usability_other,
					featureVoiceInput: survey.feature_voice_input ?? false,
					featurePhotoAttachment: survey.feature_photo_attachment ?? false,
					featureExcelIntegration: survey.feature_excel_integration ?? false,
					featurePrintLayout: survey.feature_print_layout ?? false,
					featureOther: survey.feature_other,
					additionalFeedback: survey.additional_feedback,
					createdAt: survey.created_at,
					updatedAt: survey.updated_at,
				},
			};
		}

		// 特定のトリガーが指定されている場合、スキップ状況もチェック
		if (trigger) {
			const isSkipped = await checkSurveySkipStatus(trigger);
			return { hasAnswered: false, isSkipped };
		}

		return { hasAnswered: false };
	} catch (error) {
		console.error("アンケート状況確認エラー:", error);
		return { hasAnswered: false };
	}
}

/**
 * ユーザーがオーナーとして作成した香典帳で1週間経過したものがあるかチェック
 * かつ、まだアンケートに未回答かつスキップしていないかチェック
 * @returns 1週間経過した香典帳があり、アンケート未回答・未スキップの場合true
 */
export async function checkOneWeekOwnershipSurvey(): Promise<boolean> {
	try {
		const supabase = await createClient();

		// 認証確認
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return false;
		}

		// 既にアンケートに回答済みかスキップ済みかチェック
		const surveyStatus = await getUserSurveyStatus("one_week_usage");
		if (surveyStatus.hasAnswered || surveyStatus.isSkipped) {
			return false;
		}

		// オーナーとして作成した香典帳で1週間経過したものがあるかチェック
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		const { data: koudens, error: fetchError } = await supabase
			.from("koudens")
			.select("id, created_at")
			.eq("owner_id", user.id)
			.lte("created_at", oneWeekAgo.toISOString())
			.limit(1);

		if (fetchError) {
			console.error("香典帳確認エラー:", fetchError);
			return false;
		}

		return koudens && koudens.length > 0;
	} catch (error) {
		console.error("1週間経過チェックエラー:", error);
		return false;
	}
}

/**
 * 管理者用: アンケート集計データを取得
 * @returns アンケート集計結果
 */
export async function getAdminSurveyAnalytics() {
	try {
		const supabase = await createClient();

		// 認証確認
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return {
				success: false,
				error: "認証が必要です",
			};
		}

		// 管理者権限チェック
		const { data: adminUser, error: adminError } = await supabase
			.from("admin_users")
			.select("role")
			.eq("user_id", user.id)
			.single();

		if (adminError || !adminUser || !["super_admin", "admin"].includes(adminUser.role)) {
			return {
				success: false,
				error: "管理者権限が必要です",
			};
		}

		// 全アンケートデータを取得
		const { data: surveys, error: fetchError } = await supabase
			.from("user_surveys")
			.select("*")
			.order("created_at", { ascending: false });

		if (fetchError) {
			console.error("アンケートデータ取得エラー:", fetchError);
			return {
				success: false,
				error: "データ取得に失敗しました",
			};
		}

		// 基本統計を計算
		const totalResponses = surveys.length;
		const averageSatisfaction =
			surveys.reduce((sum, s) => sum + s.overall_satisfaction, 0) / totalResponses;
		const averageNps = surveys.reduce((sum, s) => sum + s.nps_score, 0) / totalResponses;

		// NPS分類
		const promoters = surveys.filter((s) => s.nps_score >= 9).length;
		const passives = surveys.filter((s) => s.nps_score >= 7 && s.nps_score <= 8).length;
		const detractors = surveys.filter((s) => s.nps_score <= 6).length;
		const npsValue = ((promoters - detractors) / totalResponses) * 100;

		return {
			success: true,
			data: {
				totalResponses,
				averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
				averageNps: Math.round(averageNps * 100) / 100,
				npsValue: Math.round(npsValue * 100) / 100,
				npsBreakdown: { promoters, passives, detractors },
				rawData: surveys,
			},
		};
	} catch (error) {
		console.error("管理者アナリティクスエラー:", error);
		return {
			success: false,
			error: "予期しないエラーが発生しました",
		};
	}
}

/**
 * アンケートスキップ記録を作成
 * @param trigger アンケートトリガー種別
 * @returns 成功/エラー結果
 */
export async function createSurveySkip(trigger: SurveyTrigger) {
	try {
		const supabase = await createClient();

		// 認証確認
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return {
				success: false,
				error: "認証が必要です。ログインしてからお試しください。",
			};
		}

		// 有効期限内のスキップ記録があるかチェック
		const { data: existingSkip, error: checkError } = await supabase
			.from("user_survey_skips")
			.select("id, expires_at")
			.eq("user_id", user.id)
			.eq("survey_trigger", trigger)
			.gt("expires_at", new Date().toISOString())
			.single();

		if (checkError && checkError.code !== "PGRST116") {
			console.error("既存スキップ記録確認エラー:", checkError);
			return {
				success: false,
				error: "スキップ記録の確認に失敗しました。時間を置いてお試しください。",
			};
		}

		if (existingSkip) {
			return {
				success: true,
				message: "既にスキップ記録が存在します。",
			};
		}

		// スキップ記録を作成
		const { data: newSkip, error: insertError } = await supabase
			.from("user_survey_skips")
			.insert({
				user_id: user.id,
				survey_trigger: trigger,
			})
			.select()
			.single();

		if (insertError) {
			console.error("スキップ記録作成エラー:", insertError);
			return {
				success: false,
				error: "スキップ記録の作成に失敗しました。時間を置いてお試しください。",
			};
		}

		return {
			success: true,
			data: newSkip,
			message: "アンケートをスキップしました。1日後に再度表示される場合があります。",
		};
	} catch (error) {
		console.error("アンケートスキップエラー:", error);
		return {
			success: false,
			error: "予期しないエラーが発生しました。時間を置いてお試しください。",
		};
	}
}

/**
 * ユーザーのアンケートスキップ状況をチェック
 * @param trigger アンケートトリガー種別
 * @returns スキップ中の場合true
 */
export async function checkSurveySkipStatus(trigger: SurveyTrigger): Promise<boolean> {
	try {
		const supabase = await createClient();

		// 認証確認
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return false;
		}

		// 有効期限内のスキップ記録があるかチェック
		const { data: skipRecord, error: fetchError } = await supabase
			.from("user_survey_skips")
			.select("id, expires_at")
			.eq("user_id", user.id)
			.eq("survey_trigger", trigger)
			.gt("expires_at", new Date().toISOString())
			.single();

		if (fetchError && fetchError.code !== "PGRST116") {
			console.error("スキップ状況確認エラー:", fetchError);
			return false;
		}

		return !!skipRecord;
	} catch (error) {
		console.error("スキップ状況チェックエラー:", error);
		return false;
	}
}
