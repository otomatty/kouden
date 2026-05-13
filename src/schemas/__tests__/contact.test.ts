/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { contactRequestSchema } from "../contact";

const validInput = {
	category: "support",
	name: "山田太郎",
	email: "test@example.com",
	subject: "件名",
	message: "問い合わせ内容です",
	company_name: "テスト株式会社",
};

describe("contactRequestSchema", () => {
	it("正常な入力をパースできる", () => {
		const result = contactRequestSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it("category が enum 外なら失敗する", () => {
		const result = contactRequestSchema.safeParse({ ...validInput, category: "invalid" });
		expect(result.success).toBe(false);
	});

	it("email が空なら失敗する", () => {
		const result = contactRequestSchema.safeParse({ ...validInput, email: "" });
		expect(result.success).toBe(false);
	});

	it("email の形式が不正なら失敗する", () => {
		const result = contactRequestSchema.safeParse({ ...validInput, email: "not-an-email" });
		expect(result.success).toBe(false);
	});

	it("message が空なら失敗する", () => {
		const result = contactRequestSchema.safeParse({ ...validInput, message: "" });
		expect(result.success).toBe(false);
	});

	it("message のみ空白なら失敗する (trim 後)", () => {
		const result = contactRequestSchema.safeParse({ ...validInput, message: "   " });
		expect(result.success).toBe(false);
	});

	it("message が 5000 文字を超えたら失敗する", () => {
		const result = contactRequestSchema.safeParse({
			...validInput,
			message: "あ".repeat(5001),
		});
		expect(result.success).toBe(false);
	});

	it("name や company_name が空文字でも許容される (null 化)", () => {
		const result = contactRequestSchema.safeParse({
			...validInput,
			name: "",
			subject: "",
			company_name: "",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBeNull();
			expect(result.data.subject).toBeNull();
			expect(result.data.company_name).toBeNull();
		}
	});

	it("name が 100 文字を超えたら失敗する", () => {
		const result = contactRequestSchema.safeParse({
			...validInput,
			name: "a".repeat(101),
		});
		expect(result.success).toBe(false);
	});

	it("email が 254 文字を超えたら失敗する", () => {
		const longEmail = `${"a".repeat(250)}@x.co`;
		const result = contactRequestSchema.safeParse({ ...validInput, email: longEmail });
		expect(result.success).toBe(false);
	});
});
