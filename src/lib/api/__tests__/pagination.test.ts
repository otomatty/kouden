/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { paginationQuerySchema, parsePagination } from "../pagination";

describe("paginationQuerySchema", () => {
	it("未指定時にデフォルト値を返す", () => {
		const result = paginationQuerySchema.parse({});
		expect(result).toEqual({ page: 1, pageSize: 50 });
	});

	it("文字列の数値を coerce する", () => {
		const result = paginationQuerySchema.parse({ page: "3", pageSize: "20" });
		expect(result).toEqual({ page: 3, pageSize: 20 });
	});

	it("pageSize の上限 100 を超える値を拒否する", () => {
		const result = paginationQuerySchema.safeParse({ page: 1, pageSize: 999999 });
		expect(result.success).toBe(false);
	});

	it("0 や負数を拒否する", () => {
		expect(paginationQuerySchema.safeParse({ page: 0, pageSize: 50 }).success).toBe(false);
		expect(paginationQuerySchema.safeParse({ page: -1, pageSize: 50 }).success).toBe(false);
		expect(paginationQuerySchema.safeParse({ page: 1, pageSize: 0 }).success).toBe(false);
		expect(paginationQuerySchema.safeParse({ page: 1, pageSize: -10 }).success).toBe(false);
	});

	it("NaN になる文字列を拒否する", () => {
		const result = paginationQuerySchema.safeParse({ page: "abc", pageSize: "50" });
		expect(result.success).toBe(false);
	});

	it("小数を拒否する (整数要求)", () => {
		const result = paginationQuerySchema.safeParse({ page: 1.5, pageSize: 50 });
		expect(result.success).toBe(false);
	});
});

describe("parsePagination", () => {
	it("URLSearchParams からパースする", () => {
		const sp = new URLSearchParams("page=2&pageSize=30");
		const result = parsePagination(sp);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ page: 2, pageSize: 30 });
		}
	});

	it("空の URLSearchParams ではデフォルトを返す", () => {
		const result = parsePagination(new URLSearchParams());
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ page: 1, pageSize: 50 });
		}
	});

	it("巨大な pageSize を拒否する", () => {
		const sp = new URLSearchParams("pageSize=999999");
		const result = parsePagination(sp);
		expect(result.success).toBe(false);
	});

	it("負の page を拒否する", () => {
		const sp = new URLSearchParams("page=-1");
		const result = parsePagination(sp);
		expect(result.success).toBe(false);
	});
});
