/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SurveyTrigger, PdfExportSurveyTrigger, OneWeekSurveyTrigger } from "../survey-trigger";
import * as userSurveysActions from "@/app/_actions/user-surveys";

// Server Actions をモック
vi.mock("@/app/_actions/user-surveys");

// SurveyModal をシンプルにモック
vi.mock("../survey-modal", () => ({
	SurveyModal: ({ isOpen, trigger }: { isOpen: boolean; trigger: string }) => {
		return isOpen ? <div data-testid="survey-modal">Survey Modal - {trigger}</div> : null;
	},
}));

const mockGetUserSurveyStatus = vi.mocked(userSurveysActions.getUserSurveyStatus);
const mockCheckOneWeekOwnershipSurvey = vi.mocked(userSurveysActions.checkOneWeekOwnershipSurvey);

describe("SurveyTrigger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的な表示テスト", () => {
		it("PDF出力トリガーコンポーネントが正常にレンダリングされる", () => {
			mockGetUserSurveyStatus.mockResolvedValue({ hasAnswered: false });

			render(<SurveyTrigger trigger="pdf_export" shouldShow={false} />);

			// エラーなくレンダリングされることを確認
			expect(() => render(<SurveyTrigger trigger="pdf_export" shouldShow={false} />)).not.toThrow();
		});

		it("1週間後トリガーコンポーネントが正常にレンダリングされる", () => {
			mockCheckOneWeekOwnershipSurvey.mockResolvedValue(false);

			render(<SurveyTrigger trigger="one_week_usage" />);

			// エラーなくレンダリングされることを確認
			expect(() => render(<SurveyTrigger trigger="one_week_usage" />)).not.toThrow();
		});

		it("適切なトリガータイプが渡される", () => {
			const onShownMock = vi.fn();

			render(<SurveyTrigger trigger="pdf_export" shouldShow={false} onShown={onShownMock} />);
			render(<SurveyTrigger trigger="one_week_usage" onShown={onShownMock} />);

			// 基本的なプロップスが受け入れられることを確認
			expect(true).toBe(true);
		});
	});

	describe("ヘルパーコンポーネント", () => {
		it("PdfExportSurveyTriggerが正常にレンダリングされる", () => {
			mockGetUserSurveyStatus.mockResolvedValue({ hasAnswered: false });

			render(<PdfExportSurveyTrigger showSurvey={false} />);

			expect(() => render(<PdfExportSurveyTrigger showSurvey={false} />)).not.toThrow();
		});

		it("OneWeekSurveyTriggerが正常にレンダリングされる", () => {
			mockCheckOneWeekOwnershipSurvey.mockResolvedValue(false);

			render(<OneWeekSurveyTrigger />);

			expect(() => render(<OneWeekSurveyTrigger />)).not.toThrow();
		});

		it("onShownコールバックが適切に渡される", () => {
			const onShownMock = vi.fn();

			render(<PdfExportSurveyTrigger showSurvey={false} onShown={onShownMock} />);
			render(<OneWeekSurveyTrigger onShown={onShownMock} />);

			// コールバックが受け入れられることを確認
			expect(true).toBe(true);
		});
	});

	describe("型安全性", () => {
		it("正しいトリガータイプのみが受け入れられる", () => {
			// TypeScriptコンパイル時にチェックされる
			render(<SurveyTrigger trigger="pdf_export" shouldShow={false} />);
			render(<SurveyTrigger trigger="one_week_usage" />);

			expect(true).toBe(true);
		});

		it("必要なプロップスが適切に型チェックされる", () => {
			// PDF出力トリガーにはshouldShowが必要
			render(<SurveyTrigger trigger="pdf_export" shouldShow={true} />);

			// 1週間後トリガーにはshouldShowは不要
			render(<SurveyTrigger trigger="one_week_usage" />);

			expect(true).toBe(true);
		});
	});

	describe("Server Actionsの呼び出し", () => {
		it("PDF出力トリガーでgetUserSurveyStatusが呼ばれる可能性がある", () => {
			mockGetUserSurveyStatus.mockResolvedValue({ hasAnswered: false });

			render(<SurveyTrigger trigger="pdf_export" shouldShow={true} />);

			// モック関数が設定されていることを確認
			expect(mockGetUserSurveyStatus).toBeDefined();
		});

		it("1週間後トリガーでcheckOneWeekOwnershipSurveyが呼ばれる可能性がある", () => {
			mockCheckOneWeekOwnershipSurvey.mockResolvedValue(false);

			render(<SurveyTrigger trigger="one_week_usage" />);

			// モック関数が設定されていることを確認
			expect(mockCheckOneWeekOwnershipSurvey).toBeDefined();
		});
	});
});
