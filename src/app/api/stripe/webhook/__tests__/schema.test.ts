/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { koudenMetadataSchema } from "../schema";

const VALID_UUID_1 = "11111111-1111-1111-1111-111111111111";
const VALID_UUID_2 = "22222222-2222-2222-2222-222222222222";

const validBase = {
	koudenId: VALID_UUID_1,
	planCode: "basic",
	userId: VALID_UUID_2,
};

describe("koudenMetadataSchema", () => {
	it("必須項目のみで成功し title / description はデフォルト値の空文字になる", () => {
		const result = koudenMetadataSchema.safeParse(validBase);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.title).toBe("");
			expect(result.data.description).toBe("");
			expect(result.data.expectedCount).toBeUndefined();
		}
	});

	it("全項目を指定して成功する", () => {
		const result = koudenMetadataSchema.safeParse({
			...validBase,
			title: "タイトル",
			description: "詳細",
			expectedCount: "20",
		});
		expect(result.success).toBe(true);
	});

	it("koudenId が UUID でない場合は失敗する", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, koudenId: "not-a-uuid" });
		expect(result.success).toBe(false);
	});

	it("userId が UUID でない場合は失敗する", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, userId: "not-a-uuid" });
		expect(result.success).toBe(false);
	});

	it("planCode が空の場合は失敗する", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, planCode: "" });
		expect(result.success).toBe(false);
	});

	it("planCode が 50 文字を超える場合は失敗する", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, planCode: "a".repeat(51) });
		expect(result.success).toBe(false);
	});

	it("planCode が境界値 (50 文字) で成功する", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, planCode: "a".repeat(50) });
		expect(result.success).toBe(true);
	});

	it("title が空文字でも成功する (upgrade フローでは title 未送出)", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, title: "" });
		expect(result.success).toBe(true);
	});

	it("title が 100 文字を超える場合は失敗する", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, title: "a".repeat(101) });
		expect(result.success).toBe(false);
	});

	it("title が境界値 (100 文字) で成功する", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, title: "a".repeat(100) });
		expect(result.success).toBe(true);
	});

	it("description が 500 文字を超える場合は失敗する", () => {
		const result = koudenMetadataSchema.safeParse({
			...validBase,
			description: "a".repeat(501),
		});
		expect(result.success).toBe(false);
	});

	it("description が境界値 (500 文字) で成功する", () => {
		const result = koudenMetadataSchema.safeParse({
			...validBase,
			description: "a".repeat(500),
		});
		expect(result.success).toBe(true);
	});

	it("expectedCount が空文字でも成功する (未指定相当)", () => {
		const result = koudenMetadataSchema.safeParse({ ...validBase, expectedCount: "" });
		expect(result.success).toBe(true);
	});

	it("expectedCount が数字以外を含む場合は失敗する (NaN 防止)", () => {
		expect(koudenMetadataSchema.safeParse({ ...validBase, expectedCount: "abc" }).success).toBe(
			false,
		);
		expect(koudenMetadataSchema.safeParse({ ...validBase, expectedCount: "12a" }).success).toBe(
			false,
		);
		expect(koudenMetadataSchema.safeParse({ ...validBase, expectedCount: "-1" }).success).toBe(
			false,
		);
		expect(koudenMetadataSchema.safeParse({ ...validBase, expectedCount: "1.5" }).success).toBe(
			false,
		);
	});

	it("expectedCount が MAX_SAFE_INTEGER (2^53-1) 境界で成功する", () => {
		const result = koudenMetadataSchema.safeParse({
			...validBase,
			expectedCount: String(Number.MAX_SAFE_INTEGER),
		});
		expect(result.success).toBe(true);
	});

	it("expectedCount が MAX_SAFE_INTEGER を超える場合は失敗する (精度劣化防止)", () => {
		expect(
			koudenMetadataSchema.safeParse({ ...validBase, expectedCount: "9007199254740992" }).success,
		).toBe(false);
		expect(
			koudenMetadataSchema.safeParse({ ...validBase, expectedCount: "99999999999999999999" })
				.success,
		).toBe(false);
	});

	it("必須項目が欠けると失敗する", () => {
		const { koudenId: _koudenId, ...withoutKoudenId } = validBase;
		expect(koudenMetadataSchema.safeParse(withoutKoudenId).success).toBe(false);

		const { planCode: _planCode, ...withoutPlanCode } = validBase;
		expect(koudenMetadataSchema.safeParse(withoutPlanCode).success).toBe(false);

		const { userId: _userId, ...withoutUserId } = validBase;
		expect(koudenMetadataSchema.safeParse(withoutUserId).success).toBe(false);
	});

	it("非オブジェクトを与えると失敗する", () => {
		expect(koudenMetadataSchema.safeParse(null).success).toBe(false);
		expect(koudenMetadataSchema.safeParse(undefined).success).toBe(false);
		expect(koudenMetadataSchema.safeParse("string").success).toBe(false);
	});
});
