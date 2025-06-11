/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMarketingTemplate } from "../createMarketingTemplate";
import { listMarketingTemplates } from "../listMarketingTemplates";
import { getMarketingTemplate } from "../getMarketingTemplate";
import { updateMarketingTemplate } from "../updateMarketingTemplate";
import { deleteMarketingTemplate } from "../deleteMarketingTemplate";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift marketing_templates server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeTemplate = {
		id: "tmpl-uuid",
		campaign_id: "camp-uuid",
		type: "email",
		content: "<p>Hello</p>",
	};

	beforeEach(() => {
		supabaseMock = {
			schema: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
		};
		// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
		(createClient as any).mockResolvedValue(supabaseMock);
	});

	// Test case: createMarketingTemplate が正常に実行され、作成されたテンプレートを返す
	it("createMarketingTemplate returns created template", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeTemplate, error: null });
		const result = await createMarketingTemplate({
			campaignId: "camp-uuid",
			type: "email",
			content: "<p>Hello</p>",
		});
		expect(result).toEqual(fakeTemplate);
	});

	// Test case: createMarketingTemplate がエラーを返した場合に例外を投げる
	it("createMarketingTemplate throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createMarketingTemplate({ campaignId: "camp-uuid", type: "email", content: "<p>Hi</p>" }),
		).rejects.toThrow("fail");
	});

	// Test case: listMarketingTemplates が配列を返す
	it("listMarketingTemplates returns array of templates", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: [fakeTemplate], error: null });
		const result = await listMarketingTemplates("camp-uuid");
		expect(result).toEqual([fakeTemplate]);
	});

	// Test case: listMarketingTemplates がエラーを返した場合に例外を投げる
	it("listMarketingTemplates throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listMarketingTemplates("camp-uuid")).rejects.toThrow("fail");
	});

	// Test case: getMarketingTemplate が正常にテンプレートを返す
	it("getMarketingTemplate returns template", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeTemplate, error: null });
		const result = await getMarketingTemplate("tmpl-uuid");
		expect(result).toEqual(fakeTemplate);
	});

	// Test case: getMarketingTemplate がエラーを返した場合に例外を投げる
	it("getMarketingTemplate throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getMarketingTemplate("tmpl-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateMarketingTemplate が正常に更新されたテンプレートを返す
	it("updateMarketingTemplate returns updated template", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeTemplate, error: null });
		const result = await updateMarketingTemplate({ id: "tmpl-uuid", content: "<p>Updated</p>" });
		expect(result).toEqual(fakeTemplate);
	});

	// Test case: updateMarketingTemplate がエラーを返した場合に例外を投げる
	it("updateMarketingTemplate throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateMarketingTemplate({ id: "tmpl-uuid", type: "sms" })).rejects.toThrow("fail");
	});

	// Test case: deleteMarketingTemplate が正常に実行され true を返す
	it("deleteMarketingTemplate returns true", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteMarketingTemplate("tmpl-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteMarketingTemplate がエラーを返した場合に例外を投げる
	it("deleteMarketingTemplate throws on error", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteMarketingTemplate("tmpl-uuid")).rejects.toThrow("fail");
	});
});
