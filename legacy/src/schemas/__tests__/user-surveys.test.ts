/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import {
	userSurveyFormSchema,
	userSurveySchema,
	type UserSurveyFormInput,
	type SurveyTrigger,
} from "../user-surveys";

describe("user-surveys schemas", () => {
	describe("userSurveyFormSchema", () => {
		const validFormData: UserSurveyFormInput = {
			overallSatisfaction: 4,
			npsScore: 8,
			usabilityEasierInput: true,
			usabilityBetterUi: false,
			usabilityFasterPerformance: true,
			usabilityOther: "操作性の改善要望",
			featureVoiceInput: false,
			featurePhotoAttachment: true,
			featureExcelIntegration: true,
			featurePrintLayout: false,
			featureOther: "新機能の要望",
			additionalFeedback: "全体的に良いアプリです",
		};

		it("正しいデータの場合にバリデーションが成功する", () => {
			// Act
			const result = userSurveyFormSchema.safeParse(validFormData);

			// Assert
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validFormData);
			}
		});

		describe("満足度のバリデーション", () => {
			it("1-5の範囲内で正常に動作する", () => {
				for (let satisfaction = 1; satisfaction <= 5; satisfaction++) {
					const data = { ...validFormData, overallSatisfaction: satisfaction };
					const result = userSurveyFormSchema.safeParse(data);
					expect(result.success).toBe(true);
				}
			});

			it("範囲外の値でエラーになる", () => {
				const invalidValues = [0, 6, -1, 10];
				for (const value of invalidValues) {
					const data = { ...validFormData, overallSatisfaction: value };
					const result = userSurveyFormSchema.safeParse(data);
					expect(result.success).toBe(false);
				}
			});

			it("必須項目が欠けているとエラーになる", () => {
				const { overallSatisfaction, ...dataWithoutSatisfaction } = validFormData;
				const result = userSurveyFormSchema.safeParse(dataWithoutSatisfaction);
				expect(result.success).toBe(false);
			});
		});

		describe("NPSスコアのバリデーション", () => {
			it("0-10の範囲内で正常に動作する", () => {
				for (let nps = 0; nps <= 10; nps++) {
					const data = { ...validFormData, npsScore: nps };
					const result = userSurveyFormSchema.safeParse(data);
					expect(result.success).toBe(true);
				}
			});

			it("範囲外の値でエラーになる", () => {
				const invalidValues = [-1, 11, 15, -5];
				for (const value of invalidValues) {
					const data = { ...validFormData, npsScore: value };
					const result = userSurveyFormSchema.safeParse(data);
					expect(result.success).toBe(false);
				}
			});

			it("必須項目が欠けているとエラーになる", () => {
				const { npsScore, ...dataWithoutNps } = validFormData;
				const result = userSurveyFormSchema.safeParse(dataWithoutNps);
				expect(result.success).toBe(false);
			});
		});

		describe("チェックボックス項目のバリデーション", () => {
			it("boolean値で正常に動作する", () => {
				const data = {
					...validFormData,
					usabilityEasierInput: true,
					usabilityBetterUi: false,
					featureVoiceInput: true,
					featurePhotoAttachment: false,
				};
				const result = userSurveyFormSchema.safeParse(data);
				expect(result.success).toBe(true);
			});

			it("boolean項目が欠けていても正常に動作する（optional）", () => {
				const { usabilityEasierInput, ...dataWithoutCheckbox } = validFormData;
				const result = userSurveyFormSchema.safeParse(dataWithoutCheckbox);
				expect(result.success).toBe(true);
			});
		});

		describe("任意テキスト項目のバリデーション", () => {
			it("空文字列やundefinedで正常に動作する", () => {
				const dataWithEmptyStrings = {
					...validFormData,
					usabilityOther: "",
					featureOther: "",
					additionalFeedback: "",
				};
				const result = userSurveyFormSchema.safeParse(dataWithEmptyStrings);
				expect(result.success).toBe(true);
			});

			it("長いテキストでも正常に動作する", () => {
				const longText = "あ".repeat(500);
				const dataWithLongText = {
					...validFormData,
					additionalFeedback: longText,
				};
				const result = userSurveyFormSchema.safeParse(dataWithLongText);
				expect(result.success).toBe(true);
			});
		});

		describe("型の不整合", () => {
			it("数値項目に文字列を渡すとエラーになる", () => {
				const dataWithStringNumbers = {
					...validFormData,
					overallSatisfaction: "4" as any,
					npsScore: "8" as any,
				};
				const result = userSurveyFormSchema.safeParse(dataWithStringNumbers);
				expect(result.success).toBe(false);
			});

			it("boolean項目に数値を渡すとエラーになる", () => {
				const dataWithNumberBooleans = {
					...validFormData,
					usabilityEasierInput: 1 as any,
					usabilityBetterUi: 0 as any,
				};
				const result = userSurveyFormSchema.safeParse(dataWithNumberBooleans);
				expect(result.success).toBe(false);
			});
		});
	});

	describe("userSurveySchema", () => {
		const validSurveyData = {
			overallSatisfaction: 4,
			npsScore: 8,
			usabilityEasierInput: true,
			usabilityBetterUi: false,
			usabilityFasterPerformance: true,
			usabilityOther: "操作性の改善要望",
			featureVoiceInput: false,
			featurePhotoAttachment: true,
			featureExcelIntegration: true,
			featurePrintLayout: false,
			featureOther: "新機能の要望",
			additionalFeedback: "全体的に良いアプリです",
			surveyTrigger: "pdf_export" as SurveyTrigger,
		};

		it("正しいデータの場合にバリデーションが成功する", () => {
			// Act
			const result = userSurveySchema.safeParse(validSurveyData);

			// Assert
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validSurveyData);
			}
		});

		describe("surveyTriggerのバリデーション", () => {
			it("有効なトリガー値で正常に動作する", () => {
				const validTriggers: SurveyTrigger[] = ["pdf_export", "one_week_usage"];

				for (const trigger of validTriggers) {
					const data = { ...validSurveyData, surveyTrigger: trigger };
					const result = userSurveySchema.safeParse(data);
					expect(result.success).toBe(true);
				}
			});

			it("無効なトリガー値でエラーになる", () => {
				const invalidTriggers = ["invalid_trigger", "test", "", "pdf", "one_week"];

				for (const trigger of invalidTriggers) {
					const data = { ...validSurveyData, surveyTrigger: trigger };
					const result = userSurveySchema.safeParse(data);
					expect(result.success).toBe(false);
				}
			});

			it("surveyTriggerが欠けているとエラーになる", () => {
				const { surveyTrigger, ...dataWithoutTrigger } = validSurveyData;
				const result = userSurveySchema.safeParse(dataWithoutTrigger);
				expect(result.success).toBe(false);
			});
		});
	});

	describe("型定義の確認", () => {
		it("UserSurveyFormInputが期待する構造と一致する", () => {
			const formInput: UserSurveyFormInput = {
				overallSatisfaction: 5,
				npsScore: 10,
				usabilityEasierInput: false,
				usabilityBetterUi: true,
				usabilityFasterPerformance: false,
				usabilityOther: "test",
				featureVoiceInput: true,
				featurePhotoAttachment: false,
				featureExcelIntegration: true,
				featurePrintLayout: true,
				featureOther: "test feature",
				additionalFeedback: "test feedback",
			};

			const result = userSurveyFormSchema.safeParse(formInput);
			expect(result.success).toBe(true);
		});

		it("SurveyTriggerが期待する値と一致する", () => {
			const triggers: SurveyTrigger[] = ["pdf_export", "one_week_usage"];

			for (const trigger of triggers) {
				expect(typeof trigger).toBe("string");
				expect(["pdf_export", "one_week_usage"]).toContain(trigger);
			}
		});
	});
});
