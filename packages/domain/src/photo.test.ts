import { describe, expect, it } from "vitest";
import { photoReadingSchema, toPhotoDraft } from "./photo.ts";

describe("toPhotoDraft", () => {
	it("香典袋の書き方の金額・全角の郵便番号をそろえ、空白を詰める", () => {
		expect(
			toPhotoDraft({
				name: "  佐藤　 一郎 ",
				nameKana: "さとう いちろう",
				amount: "金壱萬円也",
				postalCode: "〒１００ー０００１",
				address: "東京都千代田区千代田１－１",
			}),
		).toEqual({
			name: "佐藤 一郎",
			nameKana: "さとう いちろう",
			organization: "",
			amount: "10,000",
			postalCode: "100-0001",
			address: "東京都千代田区千代田1-1",
		});
	});

	it("読めない金額・7 桁でない郵便番号は空にし、長すぎる欄は切る", () => {
		const draft = toPhotoDraft({
			name: "あ".repeat(80),
			amount: "お気持ち",
			postalCode: "100-01",
		});
		expect(draft.amount).toBe("");
		expect(draft.postalCode).toBe("");
		expect(draft.name).toHaveLength(50);
	});

	it("読み取りの出力の形を確かめる（文字列でない値・長すぎる値は通さない）", () => {
		expect(photoReadingSchema.safeParse({ name: 1 }).success).toBe(false);
		expect(photoReadingSchema.safeParse({ amount: "1".repeat(51) }).success).toBe(false);
		expect(photoReadingSchema.parse({})).toEqual({});
	});
});
