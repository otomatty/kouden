import { describe, expect, it } from "vitest";
import { uuidv7 } from "./id.ts";

describe("uuidv7", () => {
	it("RFC 9562 の形式（version 7 / variant 10）になる", () => {
		const id = uuidv7();
		expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
	});

	it("先頭 48 ビットに時刻が入り、時刻順に並ぶ", () => {
		const earlier = uuidv7(1_700_000_000_000);
		const later = uuidv7(1_700_000_000_001);
		expect(earlier.slice(0, 13)).toBe("018bcfe5-6800");
		expect(earlier < later).toBe(true);
	});

	it("同じ時刻でも衝突しない", () => {
		const ids = new Set(Array.from({ length: 1000 }, () => uuidv7(0)));
		expect(ids.size).toBe(1000);
	});
});
