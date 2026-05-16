/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "../timing-safe";

describe("timingSafeEqual", () => {
	it("等しい文字列は true", () => {
		expect(timingSafeEqual("abc", "abc")).toBe(true);
	});

	it("空文字列同士は true", () => {
		expect(timingSafeEqual("", "")).toBe(true);
	});

	it("長さが違う文字列は false（部分一致でも false）", () => {
		expect(timingSafeEqual("abc", "abcd")).toBe(false);
		expect(timingSafeEqual("abcd", "abc")).toBe(false);
		expect(timingSafeEqual("", "a")).toBe(false);
	});

	it("同じ長さで内容が違う場合は false", () => {
		expect(timingSafeEqual("abc", "abd")).toBe(false);
		expect(timingSafeEqual("abc", "xbc")).toBe(false);
	});

	it("先頭・末尾の不一致いずれも false（短絡評価していないことを担保）", () => {
		expect(timingSafeEqual("Xbcdef", "abcdef")).toBe(false);
		expect(timingSafeEqual("abcdeX", "abcdef")).toBe(false);
	});

	it("Unicode を含む文字列でも一致を検出できる", () => {
		expect(timingSafeEqual("香典帳", "香典帳")).toBe(true);
		expect(timingSafeEqual("香典帳", "香典簿")).toBe(false);
	});
});
