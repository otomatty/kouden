/// <reference types="vitest" />
import { describe, expect, it } from "vitest";

import { AMOUNT_MAX, FULL_SUPPORT_PRICING, PRICING_SLIDER, TEXT_MAX_LENGTH } from "../constants";

describe("constants", () => {
	it("フルサポート料金の整合性が取れている", () => {
		expect(FULL_SUPPORT_PRICING.BASE_SUPPORT_MIN).toBeLessThan(
			FULL_SUPPORT_PRICING.BASE_SUPPORT_MAX,
		);
		expect(FULL_SUPPORT_PRICING.ADDITIONAL_BLOCK_PRICE_MIN).toBeLessThan(
			FULL_SUPPORT_PRICING.ADDITIONAL_BLOCK_PRICE_MAX,
		);
		expect(FULL_SUPPORT_PRICING.BASE_SUPPORT_INCLUDED_COUNT).toBeGreaterThan(0);
		expect(FULL_SUPPORT_PRICING.ADDITIONAL_BLOCK_SIZE).toBeGreaterThan(0);
	});

	it("スライダーの範囲が妥当である", () => {
		expect(PRICING_SLIDER.MIN_VALUE).toBeLessThan(PRICING_SLIDER.MAX_VALUE);
	});

	it("テキスト最大文字数が定義されている", () => {
		expect(TEXT_MAX_LENGTH.SHORT).toBe(100);
		expect(TEXT_MAX_LENGTH.LONG).toBe(1000);
	});

	it("金額上限が定義されている", () => {
		expect(AMOUNT_MAX).toBe(10_000_000);
	});
});
