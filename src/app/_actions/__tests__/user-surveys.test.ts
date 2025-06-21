/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
	createUserSurvey,
	getUserSurveyStatus,
	checkOneWeekOwnershipSurvey,
	getAdminSurveyAnalytics,
} from "../user-surveys";
import type { UserSurveyFormInput } from "@/schemas/user-surveys";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

describe("user-surveys server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	// biome-ignore lint/suspicious/noExplicitAny: using any for auth mock
	let authMock: any;

	const mockUser = {
		id: "test-user-id",
		email: "test@example.com",
	};

	const mockSurveyData: UserSurveyFormInput = {
		overallSatisfaction: 4,
		npsScore: 8,
		usabilityEasierInput: true,
		usabilityBetterUi: false,
		usabilityFasterPerformance: true,
		usabilityOther: "テスト要望",
		featureVoiceInput: false,
		featurePhotoAttachment: true,
		featureExcelIntegration: true,
		featurePrintLayout: false,
		featureOther: "新機能要望",
		additionalFeedback: "全体的に良いアプリです",
	};

	const mockDbSurvey = {
		id: "survey-id",
		user_id: "test-user-id",
		survey_trigger: "pdf_export",
		overall_satisfaction: 4,
		nps_score: 8,
		usability_easier_input: true,
		usability_better_ui: false,
		usability_faster_performance: true,
		usability_other: "テスト要望",
		feature_voice_input: false,
		feature_photo_attachment: true,
		feature_excel_integration: true,
		feature_print_layout: false,
		feature_other: "新機能要望",
		additional_feedback: "全体的に良いアプリです",
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
	};

	beforeEach(() => {
		authMock = {
			getUser: vi.fn(),
		};

		supabaseMock = {
			auth: authMock,
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			lte: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			single: vi.fn(),
		};

		// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
		(createClient as any).mockResolvedValue(supabaseMock);
	});

	describe("createUserSurvey", () => {
		it("成功時にアンケートを作成し、成功メッセージを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
			supabaseMock.single
				.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // 既存チェック
				.mockResolvedValueOnce({ data: mockDbSurvey, error: null }); // 作成

			// Act
			const result = await createUserSurvey(mockSurveyData, "pdf_export");

			// Assert
			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockDbSurvey);
			expect(result.message).toContain("ありがとうございました");
		});

		it("未認証ユーザーの場合にエラーを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: null }, error: null });

			// Act
			const result = await createUserSurvey(mockSurveyData, "pdf_export");

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain("認証が必要です");
		});

		it("既に回答済みの場合にエラーを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
			supabaseMock.single.mockResolvedValue({ data: mockDbSurvey, error: null });

			// Act
			const result = await createUserSurvey(mockSurveyData, "pdf_export");

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain("既にアンケートにご回答いただいております");
		});

		it("データベースエラー時にエラーを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
			supabaseMock.single
				.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // 既存チェック
				.mockResolvedValueOnce({ data: null, error: new Error("DB Error") }); // 作成失敗

			// Act
			const result = await createUserSurvey(mockSurveyData, "pdf_export");

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain("アンケートの保存に失敗しました");
		});
	});

	describe("getUserSurveyStatus", () => {
		it("回答済みの場合に詳細なデータを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
			supabaseMock.single.mockResolvedValue({ data: mockDbSurvey, error: null });

			// Act
			const result = await getUserSurveyStatus();

			// Assert
			expect(result.hasAnswered).toBe(true);
			expect(result.surveyData).toBeDefined();
			expect(result.surveyData?.overallSatisfaction).toBe(4);
			expect(result.surveyData?.npsScore).toBe(8);
		});

		it("未回答の場合にhasAnswered=falseを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
			supabaseMock.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

			// Act
			const result = await getUserSurveyStatus();

			// Assert
			expect(result.hasAnswered).toBe(false);
			expect(result.surveyData).toBeUndefined();
		});

		it("未認証の場合にhasAnswered=falseを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: null }, error: null });

			// Act
			const result = await getUserSurveyStatus();

			// Assert
			expect(result.hasAnswered).toBe(false);
		});
	});

	describe("checkOneWeekOwnershipSurvey", () => {
		it("1週間経過した香典帳があり未回答の場合にtrueを返す", async () => {
			// Arrange
			authMock.getUser
				.mockResolvedValueOnce({ data: { user: mockUser }, error: null }) // checkOneWeekOwnershipSurvey用
				.mockResolvedValueOnce({ data: { user: mockUser }, error: null }); // getUserSurveyStatus用

			// getUserSurveyStatus のモック（未回答）
			supabaseMock.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

			// 香典帳データ取得のモック
			supabaseMock.limit.mockResolvedValue({
				data: [{ id: "kouden-id", created_at: "2024-01-01" }],
				error: null,
			});

			// Act
			const result = await checkOneWeekOwnershipSurvey();

			// Assert
			expect(result).toBe(true);
		});

		it("既に回答済みの場合にfalseを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
			supabaseMock.single.mockResolvedValue({ data: mockDbSurvey, error: null });

			// Act
			const result = await checkOneWeekOwnershipSurvey();

			// Assert
			expect(result).toBe(false);
		});

		it("1週間経過した香典帳がない場合にfalseを返す", async () => {
			// Arrange
			authMock.getUser
				.mockResolvedValueOnce({ data: { user: mockUser }, error: null }) // checkOneWeekOwnershipSurvey用
				.mockResolvedValueOnce({ data: { user: mockUser }, error: null }); // getUserSurveyStatus用

			// getUserSurveyStatus のモック（未回答）
			supabaseMock.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

			// 香典帳データなし
			supabaseMock.limit.mockResolvedValue({ data: [], error: null });

			// Act
			const result = await checkOneWeekOwnershipSurvey();

			// Assert
			expect(result).toBe(false);
		});
	});

	describe("getAdminSurveyAnalytics", () => {
		const mockAdminUser = { role: "admin" };
		const mockSurveys = [
			{ ...mockDbSurvey, nps_score: 9 }, // promoter
			{ ...mockDbSurvey, nps_score: 7 }, // passive
			{ ...mockDbSurvey, nps_score: 5 }, // detractor
		];

		it("管理者の場合にアナリティクスデータを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
			supabaseMock.single.mockResolvedValueOnce({ data: mockAdminUser, error: null }); // 管理者チェック
			supabaseMock.order.mockResolvedValue({ data: mockSurveys, error: null }); // アンケートデータ

			// Act
			const result = await getAdminSurveyAnalytics();

			// Assert
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.totalResponses).toBe(3);
			expect(result.data?.npsBreakdown.promoters).toBe(1);
			expect(result.data?.npsBreakdown.passives).toBe(1);
			expect(result.data?.npsBreakdown.detractors).toBe(1);
		});

		it("非管理者の場合にエラーを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
			supabaseMock.single.mockResolvedValue({ data: { role: "user" }, error: null });

			// Act
			const result = await getAdminSurveyAnalytics();

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain("管理者権限が必要です");
		});

		it("未認証の場合にエラーを返す", async () => {
			// Arrange
			authMock.getUser.mockResolvedValue({ data: { user: null }, error: null });

			// Act
			const result = await getAdminSurveyAnalytics();

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain("認証が必要です");
		});
	});
});
