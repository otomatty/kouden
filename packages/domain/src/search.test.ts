import { describe, expect, it } from "vitest";
import {
	buildSearchText,
	escapeLike,
	findDuplicatePersons,
	groupDuplicates,
	parseReceiptNo,
	toSearchKey,
} from "./search.ts";

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

const p = (
	id: string,
	name: string | null,
	nameKana: string | null = null,
	organization: string | null = null,
) => ({
	id,
	name,
	nameKana,
	organization,
});

describe("findDuplicatePersons", () => {
	it("氏名（空白・全角半角の違いを除く）かふりがなが同じ人を候補にする", () => {
		const result = findDuplicatePersons([
			p("a", "佐藤 一郎"),
			p("b", "佐藤一郎"),
			p("c", "佐藤 二郎", "さとう いちろう"),
			p("d", "斎藤 一郎", "サトウ イチロウ"),
			p("e", "鈴木 花子"),
		]);
		expect(result.get("a")).toEqual(["b"]);
		expect(result.get("b")).toEqual(["a"]);
		expect(result.get("c")).toEqual(["d"]);
		expect(result.has("e")).toBe(false);
	});

	it("氏名のない差出人どうしは団体名で比べる（氏名のある人の団体名は比べない）", () => {
		const result = findDuplicatePersons([
			p("a", null, null, "ABC 商事"),
			p("b", null, null, "ＡＢＣ商事"),
			p("c", "山田 太郎", null, "ABC 商事"),
		]);
		expect(result.get("a")).toEqual(["b"]);
		expect(result.has("c")).toBe(false);
	});
});

describe("groupDuplicates", () => {
	it("つながる候補を 1 組にし、一覧の順に並べる。一覧にない人は入れない", () => {
		const duplicates = new Map([
			["a", ["c"]],
			["c", ["a", "d"]],
			["d", ["c"]],
			["e", ["x"]],
			["b", ["f"]],
			["f", ["b"]],
		]);
		expect(groupDuplicates(["d", "a", "b", "c", "e", "f"], duplicates)).toEqual([
			["d", "a", "c"],
			["b", "f"],
		]);
	});
});
