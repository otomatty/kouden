import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
	allocateOfferingToEntries,
	removeOfferingAllocation,
	recalculateOfferingAllocation,
} from "../allocation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OfferingAllocationRequest } from "@/types/entries";

// モック設定
vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

describe("お供物配分システム", () => {
	// biome-ignore lint/suspicious/noExplicitAny: テスト用モック
	let supabaseMock: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Supabase Admin Client のモックセットアップ
		supabaseMock = {
			from: vi.fn(),
		};
		(createAdminClient as unknown as Mock).mockReturnValue(supabaseMock);
	});

	describe("allocateOfferingToEntries", () => {
		it("均等配分で正しく配分される", async () => {
			const mockOffering = { price: 10000 };
			const entryIds = ["entry1", "entry2", "entry3"];

			// モックの設定
			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockOffering, error: null }) }),
					}),
				})
				.mockReturnValueOnce({
					delete: () => ({ eq: () => Promise.resolve() }),
				})
				.mockReturnValueOnce({
					insert: vi.fn().mockResolvedValue({ error: null }),
				})
				.mockReturnValueOnce({
					update: () => ({ in: () => Promise.resolve() }),
				});

			const request: OfferingAllocationRequest = {
				offering_id: "offering1",
				kouden_entry_ids: entryIds,
				allocation_method: "equal",
			};

			const result = await allocateOfferingToEntries(request);

			expect(result.success).toBe(true);
			expect(supabaseMock.from).toHaveBeenCalledWith("offerings");
			expect(supabaseMock.from).toHaveBeenCalledWith("offering_allocations");
		});

		it("手動配分で合計が一致しない場合エラーになる", async () => {
			const mockOffering = { price: 10000 };

			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockOffering, error: null }) }),
					}),
				})
				.mockReturnValueOnce({
					delete: () => ({ eq: () => Promise.resolve() }),
				});

			const request: OfferingAllocationRequest = {
				offering_id: "offering1",
				kouden_entry_ids: ["entry1", "entry2"],
				allocation_method: "manual",
				manual_amounts: [5000, 6000], // 合計11000で、価格10000と一致しない
			};

			const result = await allocateOfferingToEntries(request);

			expect(result.success).toBe(false);
			expect(result.error).toContain("配分金額の合計");
		});

		it("お供物が見つからない場合エラーになる", async () => {
			supabaseMock.from.mockReturnValueOnce({
				select: () => ({
					eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
				}),
			});

			const request: OfferingAllocationRequest = {
				offering_id: "nonexistent",
				kouden_entry_ids: ["entry1"],
				allocation_method: "equal",
			};

			const result = await allocateOfferingToEntries(request);

			expect(result.success).toBe(false);
			expect(result.error).toBe("お供物が見つかりません");
		});

		it("主要提供者が正しく設定される", async () => {
			const mockOffering = { price: 10000 };
			const entryIds = ["entry1", "entry2", "entry3"];
			const insertMock = vi.fn().mockResolvedValue({ error: null });

			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockOffering, error: null }) }),
					}),
				})
				.mockReturnValueOnce({
					delete: () => ({ eq: () => Promise.resolve() }),
				})
				.mockReturnValueOnce({
					insert: insertMock,
				})
				.mockReturnValueOnce({
					update: () => ({ in: () => Promise.resolve() }),
				});

			const request: OfferingAllocationRequest = {
				offering_id: "offering1",
				kouden_entry_ids: entryIds,
				allocation_method: "equal",
				primary_contributor_id: "entry2",
			};

			await allocateOfferingToEntries(request);

			const insertedData = insertMock.mock.calls[0][0];
			const primaryEntry = insertedData.find((data: any) => data.is_primary_contributor);
			expect(primaryEntry.kouden_entry_id).toBe("entry2");
		});
	});

	describe("removeOfferingAllocation", () => {
		it("配分が正しく削除される", async () => {
			const mockAllocations = [{ kouden_entry_id: "entry1" }, { kouden_entry_id: "entry2" }];

			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => Promise.resolve({ data: mockAllocations }),
					}),
				})
				.mockReturnValueOnce({
					delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
				})
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ limit: () => Promise.resolve({ data: [] }) }),
					}),
				})
				.mockReturnValueOnce({
					update: () => ({ eq: () => Promise.resolve() }),
				})
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ limit: () => Promise.resolve({ data: [] }) }),
					}),
				})
				.mockReturnValueOnce({
					update: () => ({ eq: () => Promise.resolve() }),
				});

			const result = await removeOfferingAllocation("offering1");

			expect(result.success).toBe(true);
			expect(supabaseMock.from).toHaveBeenCalledWith("offering_allocations");
		});

		it("削除エラーが適切にハンドリングされる", async () => {
			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => Promise.resolve({ data: [] }),
					}),
				})
				.mockReturnValueOnce({
					delete: () => ({ eq: () => Promise.resolve({ error: { message: "削除エラー" } }) }),
				});

			const result = await removeOfferingAllocation("offering1");

			expect(result.success).toBe(false);
			expect(result.error).toContain("削除エラー");
		});
	});

	describe("recalculateOfferingAllocation", () => {
		it("既存の配分が再計算される", async () => {
			const mockCurrentAllocations = [
				{ kouden_entry_id: "entry1", is_primary_contributor: true },
				{ kouden_entry_id: "entry2", is_primary_contributor: false },
			];

			// allocateOfferingToEntriesをモック化して成功を返す
			const mockOffering = { price: 10000 };
			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({
							order: () => Promise.resolve({ data: mockCurrentAllocations }),
						}),
					}),
				})
				// 以下、allocateOfferingToEntriesの呼び出し用モック
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockOffering, error: null }) }),
					}),
				})
				.mockReturnValueOnce({
					delete: () => ({ eq: () => Promise.resolve() }),
				})
				.mockReturnValueOnce({
					insert: vi.fn().mockResolvedValue({ error: null }),
				})
				.mockReturnValueOnce({
					update: () => ({ in: () => Promise.resolve() }),
				});

			const result = await recalculateOfferingAllocation("offering1", "manual", [5000, 5000]);

			expect(result.success).toBe(true);
		});

		it("配分データが見つからない場合エラーになる", async () => {
			supabaseMock.from.mockReturnValueOnce({
				select: () => ({
					eq: () => ({
						order: () => Promise.resolve({ data: [] }),
					}),
				}),
			});

			const result = await recalculateOfferingAllocation("offering1", "equal");

			expect(result.success).toBe(false);
			expect(result.error).toBe("配分データが見つかりません");
		});
	});

	describe("配分金額計算のテスト", () => {
		it("均等配分で余りが最初の人に加算される", async () => {
			const mockOffering = { price: 10001 }; // 3で割り切れない
			const entryIds = ["entry1", "entry2", "entry3"];
			const insertMock = vi.fn().mockResolvedValue({ error: null });

			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockOffering, error: null }) }),
					}),
				})
				.mockReturnValueOnce({
					delete: () => ({ eq: () => Promise.resolve() }),
				})
				.mockReturnValueOnce({
					insert: insertMock,
				})
				.mockReturnValueOnce({
					update: () => ({ in: () => Promise.resolve() }),
				});

			const request: OfferingAllocationRequest = {
				offering_id: "offering1",
				kouden_entry_ids: entryIds,
				allocation_method: "equal",
			};

			await allocateOfferingToEntries(request);

			const insertedData = insertMock.mock.calls[0][0];
			const totalAllocated = insertedData.reduce(
				(sum: number, data: any) => sum + data.allocated_amount,
				0,
			);
			expect(totalAllocated).toBe(10001);

			// 最初の人が余り1円分多くもらっているはず
			expect(insertedData[0].allocated_amount).toBe(3334);
			expect(insertedData[1].allocated_amount).toBe(3334);
			expect(insertedData[2].allocated_amount).toBe(3333);
		});
	});
});
