"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * アンケートデータをCSV形式でエクスポート
 * @returns CSV文字列
 */
export async function exportSurveyDataToCsv() {
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

		// アンケートデータを取得
		const { data: surveys, error: fetchError } = await supabase
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
				created_at
			`)
			.order("created_at", { ascending: false });

		if (fetchError) {
			console.error("アンケートデータ取得エラー:", fetchError);
			return {
				success: false,
				error: "データ取得に失敗しました",
			};
		}

		// CSVヘッダー
		const headers = [
			"ID",
			"ユーザーID",
			"トリガー",
			"満足度",
			"NPSスコア",
			"操作性_入力簡単化",
			"操作性_UI改善",
			"操作性_高速化",
			"操作性_その他",
			"機能_音声入力",
			"機能_写真添付",
			"機能_Excel連携",
			"機能_印刷レイアウト",
			"機能_その他",
			"追加フィードバック",
			"回答日時",
		];

		// CSVデータ行を生成
		const csvRows = surveys.map((survey) => [
			survey.id,
			survey.user_id,
			survey.survey_trigger === "pdf_export" ? "PDF出力後" : "1週間後",
			survey.overall_satisfaction,
			survey.nps_score,
			survey.usability_easier_input ? "○" : "",
			survey.usability_better_ui ? "○" : "",
			survey.usability_faster_performance ? "○" : "",
			survey.usability_other || "",
			survey.feature_voice_input ? "○" : "",
			survey.feature_photo_attachment ? "○" : "",
			survey.feature_excel_integration ? "○" : "",
			survey.feature_print_layout ? "○" : "",
			survey.feature_other || "",
			survey.additional_feedback || "",
			survey.created_at ? new Date(survey.created_at).toLocaleString("ja-JP") : "",
		]);

		// CSV文字列を生成（BOM付きでExcelでの文字化け防止）
		const csvContent = `\uFEFF${[headers, ...csvRows]
			.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
			.join("\n")}`;

		return {
			success: true,
			data: csvContent,
			filename: `survey_data_${new Date().toISOString().split("T")[0]}.csv`,
		};
	} catch (error) {
		console.error("CSVエクスポートエラー:", error);
		return {
			success: false,
			error: "予期しないエラーが発生しました",
		};
	}
}

/**
 * アンケート統計サマリーをCSV形式でエクスポート
 * @returns CSV文字列
 */
export async function exportSurveySummaryToCsv() {
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

		// アンケートデータを取得
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

		// 統計を計算
		const totalResponses = surveys.length;
		const averageSatisfaction =
			surveys.reduce((sum, s) => sum + s.overall_satisfaction, 0) / totalResponses;
		const averageNps = surveys.reduce((sum, s) => sum + s.nps_score, 0) / totalResponses;

		// NPS分類
		const promoters = surveys.filter((s) => s.nps_score >= 9).length;
		const passives = surveys.filter((s) => s.nps_score >= 7 && s.nps_score <= 8).length;
		const detractors = surveys.filter((s) => s.nps_score <= 6).length;
		const npsValue = ((promoters - detractors) / totalResponses) * 100;

		// 機能要望の集計
		const featureRequests = {
			voiceInput: surveys.filter((s) => s.feature_voice_input).length,
			photoAttachment: surveys.filter((s) => s.feature_photo_attachment).length,
			excelIntegration: surveys.filter((s) => s.feature_excel_integration).length,
			printLayout: surveys.filter((s) => s.feature_print_layout).length,
		};

		// 操作性改善要望の集計
		const usabilityRequests = {
			easierInput: surveys.filter((s) => s.usability_easier_input).length,
			betterUi: surveys.filter((s) => s.usability_better_ui).length,
			fasterPerformance: surveys.filter((s) => s.usability_faster_performance).length,
		};

		// サマリーデータを構築
		const summaryData = [
			["統計項目", "値", "詳細"],
			["総回答数", totalResponses, ""],
			["平均満足度", Math.round(averageSatisfaction * 100) / 100, "5点満点"],
			["平均NPS", Math.round(averageNps * 100) / 100, "10点満点"],
			["NPSスコア", Math.round(npsValue * 100) / 100, ""],
			["", "", ""],
			["NPS分類", "", ""],
			["推奨者 (9-10)", promoters, `${Math.round((promoters / totalResponses) * 100)}%`],
			["中立者 (7-8)", passives, `${Math.round((passives / totalResponses) * 100)}%`],
			["批判者 (0-6)", detractors, `${Math.round((detractors / totalResponses) * 100)}%`],
			["", "", ""],
			["機能要望", "", ""],
			[
				"音声入力機能",
				featureRequests.voiceInput,
				`${Math.round((featureRequests.voiceInput / totalResponses) * 100)}%`,
			],
			[
				"写真添付機能",
				featureRequests.photoAttachment,
				`${Math.round((featureRequests.photoAttachment / totalResponses) * 100)}%`,
			],
			[
				"Excel連携機能",
				featureRequests.excelIntegration,
				`${Math.round((featureRequests.excelIntegration / totalResponses) * 100)}%`,
			],
			[
				"印刷レイアウト選択",
				featureRequests.printLayout,
				`${Math.round((featureRequests.printLayout / totalResponses) * 100)}%`,
			],
			["", "", ""],
			["操作性改善要望", "", ""],
			[
				"入力簡単化",
				usabilityRequests.easierInput,
				`${Math.round((usabilityRequests.easierInput / totalResponses) * 100)}%`,
			],
			[
				"UI改善",
				usabilityRequests.betterUi,
				`${Math.round((usabilityRequests.betterUi / totalResponses) * 100)}%`,
			],
			[
				"高速化",
				usabilityRequests.fasterPerformance,
				`${Math.round((usabilityRequests.fasterPerformance / totalResponses) * 100)}%`,
			],
		];

		// CSV文字列を生成（BOM付きでExcelでの文字化け防止）
		const csvContent = `\uFEFF${summaryData
			.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
			.join("\n")}`;

		return {
			success: true,
			data: csvContent,
			filename: `survey_summary_${new Date().toISOString().split("T")[0]}.csv`,
		};
	} catch (error) {
		console.error("サマリーCSVエクスポートエラー:", error);
		return {
			success: false,
			error: "予期しないエラーが発生しました",
		};
	}
}
