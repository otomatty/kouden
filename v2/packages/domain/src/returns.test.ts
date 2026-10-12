import { describe, expect, it } from "vitest";
import { reminderSchedule, suggestReturn } from "./returns.ts";

const item = (id: string, price: number, isActive = true) => ({ id, name: id, price, isActive });
const rule = (
	id: string,
	minAmount: number,
	maxAmount: number | null,
	ratio: [number, number],
	suggestedItemId: string | null = null,
) => ({
	id,
	minAmount,
	maxAmount,
	ratioNumerator: ratio[0],
	ratioDenominator: ratio[1],
	suggestedItemId,
});

describe("suggestReturn", () => {
	const items = [item("a", 2000), item("b", 3000), item("c", 5000), item("off", 4900, false)];

	it("ルールがなければ半返しで、目安額に最も近い有効な品を選ぶ", () => {
		const s = suggestReturn({ total: 10000, onDayAmount: 0, rules: [], items });
		expect(s).toMatchObject({ ruleId: null, ratioNumerator: 1, ratioDenominator: 2, target: 5000 });
		expect(s.item?.id).toBe("c");
	});

	it("金額帯ルールの目安率を使い、推奨品があればそれを選ぶ", () => {
		const rules = [rule("r1", 0, 9999, [1, 2]), rule("r2", 10000, null, [1, 3], "a")];
		const s = suggestReturn({ total: 30000, onDayAmount: 0, rules, items });
		expect(s).toMatchObject({ ruleId: "r2", target: 10000 });
		expect(s.item?.id).toBe("a");
	});

	it("当日返しの額を目安額から差し引く", () => {
		const s = suggestReturn({ total: 10000, onDayAmount: 2000, rules: [], items });
		expect(s.target).toBe(3000);
		expect(s.item?.id).toBe("b");
	});

	it("当日返しで足りていれば目安額は 0 で、品は提案しない", () => {
		const s = suggestReturn({ total: 3000, onDayAmount: 2000, rules: [], items });
		expect(s).toMatchObject({ target: 0, item: null });
	});

	it("差が同じなら安い方を選び、無効な品・無効な推奨品は使わない", () => {
		const rules = [rule("r", 0, null, [1, 2], "off")];
		const s = suggestReturn({ total: 5000, onDayAmount: 0, rules, items });
		expect(s.target).toBe(2500);
		expect(s.item?.id).toBe("a");
	});

	it("帯が重なる場合は下限の高いルールを優先する", () => {
		const rules = [rule("wide", 0, null, [1, 2]), rule("high", 50000, null, [1, 4])];
		expect(suggestReturn({ total: 100000, onDayAmount: 0, rules, items }).ruleId).toBe("high");
		expect(suggestReturn({ total: 10000, onDayAmount: 0, rules, items }).ruleId).toBe("wide");
	});
});

describe("reminderSchedule", () => {
	it("期限の 14 日前と 3 日前の日本時間 9:00 に送る", () => {
		expect(reminderSchedule("2026-12-20", new Date("2026-10-01T00:00:00Z"))).toEqual([
			{ kind: "return_due_14d", fireAt: "2026-12-06T00:00:00.000Z" },
			{ kind: "return_due_3d", fireAt: "2026-12-17T00:00:00.000Z" },
		]);
	});

	it("すでに過ぎた日時は含めない", () => {
		expect(reminderSchedule("2026-12-20", new Date("2026-12-10T00:00:00Z"))).toEqual([
			{ kind: "return_due_3d", fireAt: "2026-12-17T00:00:00.000Z" },
		]);
		expect(reminderSchedule("2026-12-20", new Date("2026-12-18T00:00:00Z"))).toEqual([]);
	});
});
