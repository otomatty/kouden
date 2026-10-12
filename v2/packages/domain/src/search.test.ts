import { describe, expect, it } from "vitest";
import { buildSearchText, escapeLike, toSearchKey } from "./search.ts";

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

describe("escapeLike", () => {
	it("LIKE のワイルドカードをエスケープする", () => {
		expect(escapeLike("100%_\\")).toBe("100\\%\\_\\\\");
	});
});
