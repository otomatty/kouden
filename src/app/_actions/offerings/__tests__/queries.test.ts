import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
	getOfferingAllocations,
	getEntryOfferingAllocations,
	checkOfferingAllocationIntegrity,
	calculateEntryTotalAmount,
} from "../queries";
import { createAdminClient } from "@/lib/supabase/admin";

// モック設定
vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));

describe("お供物配分クエリー機能", () => {
	// biome-ignore lint/suspicious/noExplicitAny: テスト用モック
	let supabaseMock: any;

	beforeEach(() => {
		vi.clearAllMocks();

		supabaseMock = {
			from: vi.fn(),
		};
		(createAdminClient as unknown as Mock).mockReturnValue(supabaseMock);
	});

	describe("getOfferingAllocations", () => {
		it("お供物の配分データを正しく取得する", async () => {
			const mockAllocations = [
				{
					id: "alloc1",
					offering_id: "offering1",
					kouden_entry_id: "entry1",
					allocated_amount: 5000,
					allocation_ratio: 0.5,
					is_primary_contributor: true,
					contribution_notes: null,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
					created_by: "user1",
				},
				{
					id: "alloc2",
					offering_id: "offering1",
					kouden_entry_id: "entry2",
					allocated_amount: 5000,
					allocation_ratio: 0.5,
					is_primary_contributor: false,
					contribution_notes: null,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
					created_by: "user1",
				},
			];

			supabaseMock.from.mockReturnValue({
				select: () => ({
					eq: () => ({
						order: () => Promise.resolve({ data: mockAllocations, error: null }),
					}),
				}),
			});

			const result = await getOfferingAllocations("offering1");

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockAllocations);
			expect(supabaseMock.from).toHaveBeenCalledWith("offering_allocations");
		});

		it("データベースエラーが適切にハンドリングされる", async () => {
			const mockError = { message: "データベース接続エラー" };

			supabaseMock.from.mockReturnValue({
				select: () => ({
					eq: () => ({
						order: () => Promise.resolve({ data: null, error: mockError }),
					}),
				}),
			});

			const result = await getOfferingAllocations("offering1");

			expect(result.success).toBe(false);
			expect(result.error).toContain("データベース接続エラー");
		});
	});

	describe("getEntryOfferingAllocations", () => {
		it("香典エントリーに関連する配分データを正しく取得する", async () => {
			const mockData = [
				{
					id: "alloc1",
					offering_id: "offering1",
					kouden_entry_id: "entry1",
					allocated_amount: 5000,
					allocation_ratio: 0.5,
					is_primary_contributor: true,
					contribution_notes: null,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
					created_by: "user1",
					offerings: {
						type: "FLOWER",
						price: 10000,
						provider_name: "花屋さん",
					},
				},
			];

			supabaseMock.from.mockReturnValue({
				select: () => ({
					eq: () => ({
						order: () => Promise.resolve({ data: mockData, error: null }),
					}),
				}),
			});

			const result = await getEntryOfferingAllocations("entry1");

			expect(result.success).toBe(true);
			expect(result.data?.[0]).toMatchObject({
				id: "alloc1",
				offering_type: "FLOWER",
				offering_price: 10000,
				provider_name: "花屋さん",
			});
		});

		it("関連するお供物情報が null の場合適切にハンドリングされる", async () => {
			const mockData = [
				{
					id: "alloc1",
					offering_id: "offering1",
					kouden_entry_id: "entry1",
					allocated_amount: 5000,
					allocation_ratio: 0.5,
					is_primary_contributor: true,
					contribution_notes: null,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-01T00:00:00Z",
					created_by: "user1",
					offerings: null, // 関連するお供物が削除されている場合
				},
			];

			supabaseMock.from.mockReturnValue({
				select: () => ({
					eq: () => ({
						order: () => Promise.resolve({ data: mockData, error: null }),
					}),
				}),
			});

			const result = await getEntryOfferingAllocations("entry1");

			expect(result.success).toBe(true);
			expect(result.data?.[0]).toMatchObject({
				id: "alloc1",
				offering_type: "",
				offering_price: 0,
				provider_name: "",
			});
		});
	});

	describe("checkOfferingAllocationIntegrity", () => {
		it("配分整合性を正しくチェックする", async () => {
			const mockData = [
				{
					id: "offering1",
					type: "FLOWER",
					price: 10000,
					offering_allocations: [
						{ allocated_amount: 5000, allocation_ratio: 0.5 },
						{ allocated_amount: 5000, allocation_ratio: 0.5 },
					],
				},
				{
					id: "offering2",
					type: "FRUIT",
					price: 8000,
					offering_allocations: [
						{ allocated_amount: 4000, allocation_ratio: 0.5 },
						{ allocated_amount: 3000, allocation_ratio: 0.375 }, // 不整合のケース
					],
				},
			];

			supabaseMock.from.mockReturnValue({
				select: () => Promise.resolve({ data: mockData, error: null }),
			});

			const result = await checkOfferingAllocationIntegrity();

			expect(result.success).toBe(true);
			expect(result.data).toHaveLength(2);

			// 整合性が取れているoffering1
			expect(result.data?.[0]).toMatchObject({
				offering_id: "offering1",
				offering_type: "FLOWER",
				offering_price: 10000,
				total_allocated: 10000,
				allocation_difference: 0,
				ratio_sum: 1.0,
				is_valid: true,
			});

			// 不整合のあるoffering2
			expect(result.data?.[1]).toMatchObject({
				offering_id: "offering2",
				offering_type: "FRUIT",
				offering_price: 8000,
				total_allocated: 7000,
				allocation_difference: 1000,
				ratio_sum: 0.875,
				is_valid: false,
			});
		});

		it("特定のお供物だけをチェックできる", async () => {
			const mockData = [
				{
					id: "offering1",
					type: "FLOWER",
					price: 10000,
					offering_allocations: [
						{ allocated_amount: 5000, allocation_ratio: 0.5 },
						{ allocated_amount: 5000, allocation_ratio: 0.5 },
					],
				},
			];

			const eqMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
			supabaseMock.from.mockReturnValue({
				select: () => ({
					eq: eqMock,
				}),
			});

			const result = await checkOfferingAllocationIntegrity("offering1");

			expect(result.success).toBe(true);
			expect(eqMock).toHaveBeenCalledWith("id", "offering1");
		});
	});

	describe("calculateEntryTotalAmount", () => {
		it("香典エントリーの合計金額を正しく計算する", async () => {
			const mockEntry = { amount: 10000 };
			const mockAllocations = [{ allocated_amount: 3000 }, { allocated_amount: 2000 }];

			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockEntry, error: null }) }),
					}),
				})
				.mockReturnValueOnce({
					select: () => ({
						eq: () => Promise.resolve({ data: mockAllocations, error: null }),
					}),
				});

			const result = await calculateEntryTotalAmount("entry1");

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				kouden_amount: 10000,
				offering_total: 5000, // 3000 + 2000
				calculated_total: 15000, // 10000 + 5000
			});
		});

		it("香典エントリーが見つからない場合エラーになる", async () => {
			supabaseMock.from.mockReturnValueOnce({
				select: () => ({
					eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
				}),
			});

			const result = await calculateEntryTotalAmount("nonexistent");

			expect(result.success).toBe(false);
			expect(result.error).toBe("香典エントリーが見つかりません");
		});

		it("お供物配分がない場合は0で計算される", async () => {
			const mockEntry = { amount: 10000 };

			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockEntry, error: null }) }),
					}),
				})
				.mockReturnValueOnce({
					select: () => ({
						eq: () => Promise.resolve({ data: [], error: null }),
					}),
				});

			const result = await calculateEntryTotalAmount("entry1");

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				kouden_amount: 10000,
				offering_total: 0,
				calculated_total: 10000,
			});
		});

		it("配分データ取得でエラーが発生した場合適切にハンドリングされる", async () => {
			const mockEntry = { amount: 10000 };
			const mockError = { message: "配分データ取得失敗" };

			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockEntry, error: null }) }),
					}),
				})
				.mockReturnValueOnce({
					select: () => ({
						eq: () => Promise.resolve({ data: null, error: mockError }),
					}),
				});

			const result = await calculateEntryTotalAmount("entry1");

			expect(result.success).toBe(false);
			expect(result.error).toContain("お供物配分データの取得に失敗");
		});
	});
});
