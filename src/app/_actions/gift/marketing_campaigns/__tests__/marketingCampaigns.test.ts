/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMarketingCampaign } from "../createMarketingCampaign";
import { listMarketingCampaigns } from "../listMarketingCampaigns";
import { getMarketingCampaign } from "../getMarketingCampaign";
import { updateMarketingCampaign } from "../updateMarketingCampaign";
import { deleteMarketingCampaign } from "../deleteMarketingCampaign";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift marketing_campaigns server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeCampaign = {
		id: "camp-uuid",
		organization_id: "org",
		name: "Campaign A",
		start_date: "2025-09-09T00:00:00Z",
		end_date: "2025-10-10T00:00:00Z",
		status: "active",
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

	// Test case: createMarketingCampaign が正常に実行され、作成されたキャンペーンを返す
	it("createMarketingCampaign returns created campaign", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeCampaign, error: null });
		const result = await createMarketingCampaign({
			organizationId: "org",
			name: "Campaign A",
			startDate: "2025-09-09T00:00:00Z",
			endDate: "2025-10-10T00:00:00Z",
			status: "active",
		});
		expect(result).toEqual(fakeCampaign);
	});

	// Test case: createMarketingCampaign がエラーを返した場合に例外を投げる
	it("createMarketingCampaign throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createMarketingCampaign({ organizationId: "org", name: "Campaign A" }),
		).rejects.toThrow("fail");
	});

	// Test case: listMarketingCampaigns が配列を返す
	it("listMarketingCampaigns returns array of campaigns", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeCampaign], error: null });
		const result = await listMarketingCampaigns();
		expect(result).toEqual([fakeCampaign]);
	});

	// Test case: listMarketingCampaigns がエラーを返した場合に例外を投げる
	it("listMarketingCampaigns throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listMarketingCampaigns()).rejects.toThrow("fail");
	});

	// Test case: getMarketingCampaign が正常にキャンペーンを返す
	it("getMarketingCampaign returns campaign", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeCampaign, error: null });
		const result = await getMarketingCampaign("camp-uuid");
		expect(result).toEqual(fakeCampaign);
	});

	// Test case: getMarketingCampaign がエラーを返した場合に例外を投げる
	it("getMarketingCampaign throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getMarketingCampaign("camp-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateMarketingCampaign が正常に更新されたキャンペーンを返す
	it("updateMarketingCampaign returns updated campaign", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeCampaign, error: null });
		const result = await updateMarketingCampaign({ id: "camp-uuid", name: "Campaign B" });
		expect(result).toEqual(fakeCampaign);
	});

	// Test case: updateMarketingCampaign がエラーを返した場合に例外を投げる
	it("updateMarketingCampaign throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateMarketingCampaign({ id: "camp-uuid", status: "inactive" })).rejects.toThrow(
			"fail",
		);
	});

	// Test case: deleteMarketingCampaign が正常に実行され true を返す
	it("deleteMarketingCampaign returns true", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteMarketingCampaign("camp-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteMarketingCampaign がエラーを返した場合に例外を投げる
	it("deleteMarketingCampaign throws on error", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteMarketingCampaign("camp-uuid")).rejects.toThrow("fail");
	});
});
