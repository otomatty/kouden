import { describe, expect, it } from "vitest";
import { buildSearchText, escapeLike, parseReceiptNo, toSearchKey } from "./search.ts";

describe("toSearchKey", () => {
	it.each([
		["ヤマダ タロウ", "やまだたろう"],
		["ﾔﾏﾀﾞ", "やまだ"],
		["やまだ", "やまだ"],
		["ＡＢＣ商事", "abc商事"],
		["山田　太郎", "山田太郎"],
		["ヴァイオリン", "ゔぁいおりん"],
	])("%s → %s", (input, expected) => {
		expect(toSearchKey(input)).toBe(expected);
	});
});

describe("buildSearchText", () => {
	it("空の項目を除いて連結する", () => {
		expect(buildSearchText(["山田 太郎", null, "ヤマダ", "", undefined])).toBe("山田太郎 やまだ");
	});
});

describe("parseReceiptNo", () => {
	it.each([
		["12", 12],
		["１２", 12],
		["No.12", 12],
		["no 12", 12],
		["#3", 3],
		["12番", 12],
		[" 7 ", 7],
	])("%s → %d", (input, expected) => {
		expect(parseReceiptNo(input)).toBe(expected);
	});

	it.each(["山田", "1-2-3", "No.", "12a", ""])("%s は番号ではない", (input) => {
		expect(parseReceiptNo(input)).toBeUndefined();
	});
});

describe("escapeLike", () => {
	it("LIKE のワイルドカードをエスケープする", () => {
		expect(escapeLike("100%_\\")).toBe("100\\%\\_\\\\");
	});
});
