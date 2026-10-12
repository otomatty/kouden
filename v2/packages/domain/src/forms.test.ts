import { describe, expect, it } from "vitest";
import {
	eventSchema,
	giftSchema,
	koudenSchema,
	parseGiftFilter,
	personSchema,
	receptionSchema,
	toFieldErrors,
} from "./forms.ts";

function errorsOf(result: { success: boolean; error?: unknown }) {
	if (result.success) return {};
	return toFieldErrors(result.error as Parameters<typeof toFieldErrors>[0]);
}

describe("receptionSchema", () => {
	const base = { eventId: "ev1", kind: "koden" };

	it("全角数字・カンマ・円の付いた金額を数値にする", () => {
		const r = receptionSchema.parse({ ...base, amount: "１０，０００円", name: " 山田 太郎 " });
		expect(r.gift.amount).toBe(10000);
		expect(r.person).toEqual({
			type: "new",
			input: expect.objectContaining({ name: "山田 太郎" }),
		});
	});

	it("香典は金額が必須", () => {
		const r = receptionSchema.safeParse({ ...base, amount: "", name: "山田" });
		expect(errorsOf(r)).toEqual({ amount: "香典の金額を入力してください" });
	});

	it("供花は金額なしで登録できる", () => {
		const r = receptionSchema.safeParse({ ...base, kind: "kyoka", organization: "ABC 商事" });
		expect(r.success).toBe(true);
	});

	it("弔電には金額を入れられない", () => {
		const r = receptionSchema.safeParse({ ...base, kind: "choden", amount: "1000", name: "山田" });
		expect(errorsOf(r).amount).toBe("弔電には金額を入力できません");
	});

	it("氏名も団体名もなく、既存の差出人も選んでいなければエラー", () => {
		const r = receptionSchema.safeParse({ ...base, amount: "5000", name: "  " });
		expect(errorsOf(r).name).toBe("氏名か団体名のどちらかを入力してください");
	});

	it("既存の差出人を選んだ場合は氏名がなくてもよい", () => {
		const r = receptionSchema.parse({ ...base, amount: "5000", personId: "p1" });
		expect(r.person).toEqual({ type: "existing", personId: "p1" });
	});

	it("数字でない金額はエラー", () => {
		const r = receptionSchema.safeParse({ ...base, amount: "五千", name: "山田" });
		expect(errorsOf(r).amount).toBe("金額は数字で入力してください");
	});

	it("種別が不正ならエラー", () => {
		const r = receptionSchema.safeParse({ ...base, kind: "cash", amount: "1", name: "山田" });
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
