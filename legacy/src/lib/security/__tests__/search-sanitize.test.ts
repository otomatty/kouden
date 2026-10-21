/// <reference types="vitest" />
import { describe, expect, it } from "vitest";

import {
	buildOrIlikePattern,
	escapeIlikePattern,
	parseEntrySortValue,
	sanitizePostgrestOrValue,
} from "../search-sanitize";

describe("escapeIlikePattern", () => {
	it("通常文字はそのまま返す", () => {
		expect(escapeIlikePattern("田中")).toBe("田中");
	});

	it("% と _ をエスケープする", () => {
		expect(escapeIlikePattern("100% off")).toBe("100\\% off");
		expect(escapeIlikePattern("a_b")).toBe("a\\_b");
	});

	it("エスケープ文字 \\ もエスケープする", () => {
		expect(escapeIlikePattern("path\\to")).toBe("path\\\\to");
	});
});

describe("sanitizePostgrestOrValue", () => {
	it("PostgREST .or() の区切り文字を除去する", () => {
		expect(sanitizePostgrestOrValue("a,b(c)d*e")).toBe("abcde");
	});

	it("通常文字列はそのまま返す", () => {
		expect(sanitizePostgrestOrValue("田中太郎")).toBe("田中太郎");
	});
});

describe("buildOrIlikePattern", () => {
	it("ワイルドカードと区切り文字を同時に処理する", () => {
		expect(buildOrIlikePattern("a,b%c_d")).toBe("%ab\\%c\\_d%");
	});

	it("通常文字列は前後を % で囲むのみ", () => {
		expect(buildOrIlikePattern("田中")).toBe("%田中%");
	});
});

describe("parseEntrySortValue", () => {
	it("未指定/default の場合は created_at desc にフォールバックする", () => {
		expect(parseEntrySortValue(undefined)).toEqual({ field: "created_at", ascending: false });
		expect(parseEntrySortValue("default")).toEqual({ field: "created_at", ascending: false });
		expect(parseEntrySortValue("")).toEqual({ field: "created_at", ascending: false });
	});

	it("許可リストに含まれるフィールドと方向をパースできる", () => {
		expect(parseEntrySortValue("amount_asc")).toEqual({ field: "amount", ascending: true });
		expect(parseEntrySortValue("name_desc")).toEqual({ field: "name", ascending: false });
	});

	it("アンダースコアを含むフィールド名 (created_at) を正しくパースできる", () => {
		expect(parseEntrySortValue("created_at_asc")).toEqual({ field: "created_at", ascending: true });
		expect(parseEntrySortValue("updated_at_desc")).toEqual({
			field: "updated_at",
			ascending: false,
		});
	});

	it("許可されていないフィールド名は created_at にフォールバックする", () => {
		expect(parseEntrySortValue("password_asc")).toEqual({ field: "created_at", ascending: true });
		expect(parseEntrySortValue("id_desc")).toEqual({ field: "created_at", ascending: false });
	});

	it("許可されていない方向は desc にフォールバックする", () => {
		expect(parseEntrySortValue("amount_DROP")).toEqual({ field: "amount", ascending: false });
	});
});
