import { describe, expect, it } from "vitest";
import { allocateAmount } from "./allocation.ts";

const c = (personId: string, isPrimary = false, shareAmount: number | null = null) => ({
	personId,
	isPrimary,
	shareAmount,
});

describe("allocateAmount", () => {
	it("単名なら全額", () => {
		expect(Object.fromEntries(allocateAmount(10000, [c("a", true)]))).toEqual({ a: 10000 });
	});

	it("負担額がなければ均等割りし、端数は代表者に寄せる", () => {
		expect(Object.fromEntries(allocateAmount(10000, [c("a"), c("b", true), c("c")]))).toEqual({
			a: 3333,
			b: 3334,
			c: 3333,
		});
	});

	it("負担額が入力されている人はその額、残りを未入力の人で割る", () => {
		expect(Object.fromEntries(allocateAmount(10000, [c("a", true, 5000), c("b"), c("c")]))).toEqual(
			{ a: 5000, b: 2500, c: 2500 },
		);
	});

	it("負担額の合計が金額を超えても、未入力の人は 0 円（負にならない）", () => {
		expect(Object.fromEntries(allocateAmount(10000, [c("a", true, 12000), c("b")]))).toEqual({
			a: 12000,
			b: 0,
		});
	});
});
