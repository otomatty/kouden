import { describe, expect, it } from "vitest";
import {
	eventSchema,
	giftEntrySchema,
	giftSchema,
	parseYenText,
	pickGiftEntryFields,
	SHEET_MAX_ROWS,
	sheetRequestSchema,
	koudenSchema,
	parseGiftFilter,
	personSchema,
	returnItemSchema,
	returnLineSchema,
	returnRuleSchema,
	toFieldErrors,
} from "./forms.ts";

function errorsOf(result: { success: boolean; error?: unknown }) {
	if (result.success) return {};
	return toFieldErrors(result.error as Parameters<typeof toFieldErrors>[0]);
}

describe("giftEntrySchema", () => {
	const base = { eventId: "ev1", kind: "koden" };

	it("全角数字・カンマ・円の付いた金額を数値にする", () => {
		const r = giftEntrySchema.parse({ ...base, amount: "１０，０００円", name: " 山田 太郎 " });
		expect(r.gift.amount).toBe(10000);
		expect(r.person).toEqual({
			type: "new",
			input: expect.objectContaining({ name: "山田 太郎" }),
		});
	});

	it("香典は金額が必須", () => {
		const r = giftEntrySchema.safeParse({ ...base, amount: "", name: "山田" });
		expect(errorsOf(r)).toEqual({ amount: "香典の金額を入力してください" });
	});

	it("供花は金額なしで登録できる", () => {
		const r = giftEntrySchema.safeParse({ ...base, kind: "kyoka", organization: "ABC 商事" });
		expect(r.success).toBe(true);
	});

	it("弔電には金額を入れられない", () => {
		const r = giftEntrySchema.safeParse({ ...base, kind: "choden", amount: "1000", name: "山田" });
		expect(errorsOf(r).amount).toBe("弔電には金額を入力できません");
	});

	it("氏名も団体名もなく、既存の差出人も選んでいなければエラー", () => {
		const r = giftEntrySchema.safeParse({ ...base, amount: "5000", name: "  " });
		expect(errorsOf(r).name).toBe("氏名か団体名のどちらかを入力してください");
	});

	it("既存の差出人を選んだ場合は氏名がなくてもよい", () => {
		const r = giftEntrySchema.parse({ ...base, amount: "5000", personId: "p1" });
		expect(r.person).toEqual({ type: "existing", personId: "p1" });
	});

	it("数字でない金額はエラー", () => {
		const r = giftEntrySchema.safeParse({ ...base, amount: "五千くらい", name: "山田" });
		expect(errorsOf(r).amount).toBe("金額は数字で入力してください");
	});

	it("香典袋の書き方の金額（「1万」「五千円」）も読む", () => {
		const r = giftEntrySchema.parse({ ...base, amount: "金壱萬円也", name: "山田" });
		expect(r.gift.amount).toBe(10000);
	});

	it("種別が不正ならエラー", () => {
		const r = giftEntrySchema.safeParse({ ...base, kind: "cash", amount: "1", name: "山田" });
		expect(errorsOf(r).kind).toBe("種別を選んでください");
	});
});

describe("personSchema", () => {
	it("郵便番号をハイフン付きにそろえる", () => {
		const r = personSchema.parse({ name: "山田", postalCode: "〒１０００００１" });
		expect(r.postalCode).toBe("100-0001");
	});

	it("郵便番号の形式が違えばエラー", () => {
		expect(
			errorsOf(personSchema.safeParse({ name: "山田", postalCode: "12-34" })).postalCode,
		).toMatch(/7 桁/);
	});

	it("団体名だけでもよい", () => {
		expect(personSchema.safeParse({ organization: "ABC 商事" }).success).toBe(true);
	});
});

describe("giftSchema", () => {
	it("長すぎる品名はエラー", () => {
		const r = giftSchema.safeParse({ eventId: "e", kind: "kumotsu", itemName: "あ".repeat(101) });
		expect(errorsOf(r).itemName).toMatch(/100 文字以内/);
	});
});

describe("koudenSchema / eventSchema", () => {
	it("香典帳の名前を省略すると故人名から作る", () => {
		expect(koudenSchema.parse({ deceasedName: "山田 一郎", title: "" })).toEqual({
			deceasedName: "山田 一郎",
			title: "故 山田 一郎 様",
		});
	});

	it("行事の名前を省略すると種類の名前になる", () => {
		expect(eventSchema.parse({ kind: "memorial_49", name: "", date: "2026-11-20" })).toEqual({
			kind: "memorial_49",
			name: "四十九日",
			date: "2026-11-20",
		});
	});

	it("日付の形式が違えばエラー", () => {
		expect(errorsOf(eventSchema.safeParse({ kind: "other", date: "11/20" })).date).toMatch(
			/YYYY-MM-DD/,
		);
	});
});

describe("parseGiftFilter", () => {
	it("不正な値は無視する", () => {
		expect(
			parseGiftFilter({ event: "e1", kind: "cash", q: " 山田 ", min: "３０００", max: "abc" }),
		).toEqual({ eventId: "e1", q: "山田", minAmount: 3000 });
	});
});

describe("香典返しのフォーム", () => {
	it("金額帯ルール: 目安率を分数にし、上限は下限以上", () => {
		expect(
			returnRuleSchema.parse({
				minAmount: "5,000",
				maxAmount: "",
				ratio: "1/3",
				suggestedItemId: "",
			}),
		).toEqual({
			minAmount: 5000,
			maxAmount: null,
			ratioNumerator: 1,
			ratioDenominator: 3,
			suggestedItemId: null,
		});
		const bad = returnRuleSchema.safeParse({ minAmount: "10000", maxAmount: "5000", ratio: "1/2" });
		expect(bad.success).toBe(false);
	});

	it("返礼品: 価格は必須", () => {
		const r = returnItemSchema.safeParse({ name: "お茶", price: "" });
		expect(r.success).toBe(false);
		expect(r.error && toFieldErrors(r.error).price).toBe("価格を入力してください");
	});

	it("明細: カタログを選ぶか、品名と単価を入力する", () => {
		expect(returnLineSchema.parse({ itemId: "x" })).toEqual({
			type: "catalog",
			itemId: "x",
			quantity: 1,
		});
		expect(returnLineSchema.parse({ name: "お礼状", unitPrice: "100", quantity: "2" })).toEqual({
			type: "custom",
			name: "お礼状",
			unitPrice: 100,
			quantity: 2,
		});
		expect(returnLineSchema.safeParse({ name: "お礼状" }).success).toBe(false);
	});
});

describe("parseYenText", () => {
	it.each([
		["10000", 10000],
		["１０，０００円", 10000],
		["¥10,000", 10000],
		["1万", 10000],
		["1万5千", 15000],
		["1.5万", 15000],
		// 浮動小数点の誤差（1.1 × 10000 = 11000.000000000002）で読めなくならない
		["1.1万", 11000],
		["2.3万", 23000],
		["1.05万", 10500],
		["万", 10000],
		// 係数の 0 を書いたら 0（1 万にしない）
		["0万", 0],
		["金〇萬円", 0],
		["1万2000", 12000],
		["五千円", 5000],
		["三万", 30000],
		["十万", 100000],
		["三十万", 300000],
		["二万三千", 23000],
		["千五百", 1500],
		["金壱萬円也", 10000],
		["金伍阡円", 5000],
		["一〇〇〇〇", 10000],
		["0", 0],
	])("%s → %d", (input, expected) => {
		expect(parseYenText(input)).toBe(expected);
	});

	it.each(["", "abc", "1.5", "1.00001万", "五千くらい", "1-2"])("%s は読めない", (input) => {
		expect(parseYenText(input)).toBeUndefined();
	});
});

describe("pickGiftEntryFields", () => {
	const values = {
		kind: "choden",
		amount: "5000",
		itemName: "生花",
		quantity: "1",
		message: "ご冥福を",
	};

	it.each(["constructor", "toString", "__proto__", "unknown"])(
		"種別でない値（%s）はそのまま返す（検証で弾く）",
		(kind) => {
			expect(pickGiftEntryFields({ ...values, kind })).toEqual({ ...values, kind });
		},
	);

	it("弔電では文面だけを残す", () => {
		expect(pickGiftEntryFields(values)).toEqual({ kind: "choden", message: "ご冥福を" });
	});

	it("香典では金額だけを残す", () => {
		expect(pickGiftEntryFields({ ...values, kind: "koden" })).toEqual({
			kind: "koden",
			amount: "5000",
		});
	});

	it("供花では金額・品名・数量を残す", () => {
		expect(pickGiftEntryFields({ ...values, kind: "kyoka" })).toEqual({
			kind: "kyoka",
			amount: "5000",
			itemName: "生花",
			quantity: "1",
		});
	});
});

describe("sheetRequestSchema", () => {
	it("行の値は文字列のまま受け取り、ない列は空にする", () => {
		const r = sheetRequestSchema.parse({
			eventId: "ev1",
			rows: [{ key: "r1", name: "山田", amount: "1万" }],
		});
		expect(r.rows[0]).toEqual({
			key: "r1",
			name: "山田",
			nameKana: "",
			amount: "1万",
			postalCode: "",
			address: "",
			relationshipId: "",
			organization: "",
		});
	});

	it(`1 回に ${SHEET_MAX_ROWS} 行まで`, () => {
		const rows = Array.from({ length: SHEET_MAX_ROWS + 1 }, (_, i) => ({ key: `r${i}` }));
		expect(sheetRequestSchema.safeParse({ eventId: "ev1", rows }).success).toBe(false);
	});
});
