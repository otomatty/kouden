import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { allocateOfferingToEntries, removeOfferingAllocation } from "../allocation";
import {
	getOfferingAllocations,
	checkOfferingAllocationIntegrity,
	calculateEntryTotalAmount,
} from "../queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OfferingAllocationRequest } from "@/types/entries";

// モック設定
vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

describe("お供物配分システム統合テスト", () => {
	// biome-ignore lint/suspicious/noExplicitAny: テスト用モック
	let supabaseMock: any;

	beforeEach(() => {
		vi.clearAllMocks();

		supabaseMock = {
			from: vi.fn(),
		};
		(createAdminClient as unknown as Mock).mockReturnValue(supabaseMock);
	});

	describe("配分作成 → 取得 → 整合性チェックの統合フロー", () => {
		it("お供物配分の完全なライフサイクルを正しく処理する", async () => {
			const offeringId = "offering123";
			const entryIds = ["entry1", "entry2", "entry3"];
			const offeringPrice = 15000;

			// 1. 配分作成のモック設定
			const mockOffering = { price: offeringPrice };
			const expectedAllocations = [
				{
					offering_id: offeringId,
					kouden_entry_id: "entry1",
					allocated_amount: 5000,
					allocation_ratio: 5000 / offeringPrice,
					is_primary_contributor: true,
				},
				{
					offering_id: offeringId,
					kouden_entry_id: "entry2",
					allocated_amount: 5000,
					allocation_ratio: 5000 / offeringPrice,
					is_primary_contributor: false,
				},
				{
					offering_id: offeringId,
					kouden_entry_id: "entry3",
					allocated_amount: 5000,
					allocation_ratio: 5000 / offeringPrice,
					is_primary_contributor: false,
				},
			];

			// 配分作成用のモック
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

			// 1. 配分作成
			const createRequest: OfferingAllocationRequest = {
				offering_id: offeringId,
				kouden_entry_ids: entryIds,
				allocation_method: "equal",
				primary_contributor_id: "entry1",
			};

			const createResult = await allocateOfferingToEntries(createRequest);
			expect(createResult.success).toBe(true);

			// 2. 配分データ取得のモック設定
			const mockAllocationsResponse = expectedAllocations.map((alloc, index) => ({
				id: `alloc${index + 1}`,
				...alloc,
				contribution_notes: null,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
				created_by: "user1",
			}));

			supabaseMock.from.mockReturnValueOnce({
				select: () => ({
					eq: () => ({
						order: () => Promise.resolve({ data: mockAllocationsResponse, error: null }),
					}),
				}),
			});

			// 2. 配分データ取得
			const getAllocationsResult = await getOfferingAllocations(offeringId);
			expect(getAllocationsResult.success).toBe(true);
			expect(getAllocationsResult.data).toHaveLength(3);

			// 3. 整合性チェックのモック設定
			const mockIntegrityData = [
				{
					id: offeringId,
					type: "FLOWER",
					price: offeringPrice,
					offering_allocations: expectedAllocations.map((alloc) => ({
						allocated_amount: alloc.allocated_amount,
						allocation_ratio: alloc.allocation_ratio,
					})),
				},
			];

			supabaseMock.from.mockReturnValueOnce({
				select: () => ({
					eq: () => Promise.resolve({ data: mockIntegrityData, error: null }),
				}),
			});

			// 3. 整合性チェック
			const integrityResult = await checkOfferingAllocationIntegrity(offeringId);
			expect(integrityResult.success).toBe(true);
			expect(integrityResult.data?.[0]?.is_valid).toBe(true);
			expect(integrityResult.data?.[0]?.total_allocated).toBe(offeringPrice);
		});
	});

	describe("エラーケースのハンドリング", () => {
		it("配分作成失敗時に適切にロールバックされる", async () => {
			const mockOffering = { price: 10000 };

			// 配分作成は成功するが、has_offeringフラグ更新で失敗するケース
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
					insert: vi.fn().mockResolvedValue({ error: { message: "挿入失敗" } }),
				});

			const request: OfferingAllocationRequest = {
				offering_id: "offering1",
				kouden_entry_ids: ["entry1", "entry2"],
				allocation_method: "equal",
			};

			const result = await allocateOfferingToEntries(request);
			expect(result.success).toBe(false);
			expect(result.error).toContain("挿入失敗");
		});

		it("配分削除後に has_offering フラグが正しく更新される", async () => {
			const mockAllocations = [{ kouden_entry_id: "entry1" }, { kouden_entry_id: "entry2" }];

			// 削除処理のモック
			supabaseMock.from
				.mockReturnValueOnce({
					select: () => ({
						eq: () => Promise.resolve({ data: mockAllocations }),
					}),
				})
				.mockReturnValueOnce({
					delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
				})
				// entry1の残り配分チェック (なし)
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ limit: () => Promise.resolve({ data: [] }) }),
					}),
				})
				// entry1のhas_offeringフラグをfalseに更新
				.mockReturnValueOnce({
					update: () => ({ eq: () => Promise.resolve() }),
				})
				// entry2の残り配分チェック (なし)
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ limit: () => Promise.resolve({ data: [] }) }),
					}),
				})
				// entry2のhas_offeringフラグをfalseに更新
				.mockReturnValueOnce({
					update: () => ({ eq: () => Promise.resolve() }),
				});

			const result = await removeOfferingAllocation("offering1");
			expect(result.success).toBe(true);

			// has_offering フラグ更新の呼び出しを確認
			expect(supabaseMock.from).toHaveBeenCalledWith("kouden_entries");
		});
	});

	describe("パフォーマンステスト", () => {
		it("大量の香典エントリーでも適切に配分処理される", async () => {
			const offeringPrice = 100000;
			const entryCount = 50; // 50人で配分
			const entryIds = Array.from({ length: entryCount }, (_, i) => `entry${i + 1}`);

			const mockOffering = { price: offeringPrice };
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

			const result = await allocateOfferingToEntries(request);
			expect(result.success).toBe(true);

			// 挿入されたデータを確認
			const insertedData = insertMock.mock.calls[0]?.[0];
			expect(insertedData).toHaveLength(entryCount);

			// 合計金額が正確に配分されていることを確認
			const totalAllocated = insertedData.reduce(
				// biome-ignore lint/suspicious/noExplicitAny: テスト用モック
				(sum: number, data: any) => sum + data.allocated_amount,
				0,
			);
			expect(totalAllocated).toBe(offeringPrice);

			// 各配分の比率が正しいことを確認
			for (const data of insertedData) {
				expect(data.allocation_ratio).toBeCloseTo(data.allocated_amount / offeringPrice, 4);
			}
		});
	});

	describe("合計金額計算の統合テスト", () => {
		it("複数お供物配分がある香典エントリーの合計を正しく計算する", async () => {
			const entryId = "entry1";
			const koudenAmount = 10000;
			const mockEntry = { amount: koudenAmount };
			const mockAllocations = [
				{ allocated_amount: 3000 }, // 花 6000円の半分
				{ allocated_amount: 2500 }, // 果物 5000円の半分
				{ allocated_amount: 1000 }, // お線香 2000円の半分
			];

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

			const result = await calculateEntryTotalAmount(entryId);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				kouden_amount: koudenAmount,
				offering_total: 6500, // 3000 + 2500 + 1000
				calculated_total: 16500, // 10000 + 6500
			});
		});
	});

	describe("配分方法の違いによる動作確認", () => {
		it("均等配分と手動配分で異なる結果が得られる", async () => {
			const offeringPrice = 10000;
			const entryIds = ["entry1", "entry2", "entry3"];
			const mockOffering = { price: offeringPrice };

			// 均等配分のテスト
			const equalInsertMock = vi.fn().mockResolvedValue({ error: null });
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
					insert: equalInsertMock,
				})
				.mockReturnValueOnce({
					update: () => ({ in: () => Promise.resolve() }),
				});

			const equalRequest: OfferingAllocationRequest = {
				offering_id: "offering1",
				kouden_entry_ids: entryIds,
				allocation_method: "equal",
			};

			await allocateOfferingToEntries(equalRequest);

			const equalData = equalInsertMock.mock.calls[0]?.[0];
			expect(equalData[0].allocated_amount).toBe(3334); // 10000 / 3 + 余り1
			expect(equalData[1].allocated_amount).toBe(3333);
			expect(equalData[2].allocated_amount).toBe(3333);

			// 手動配分のテスト
			const manualInsertMock = vi.fn().mockResolvedValue({ error: null });
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
					insert: manualInsertMock,
				})
				.mockReturnValueOnce({
					update: () => ({ in: () => Promise.resolve() }),
				});

			const manualRequest: OfferingAllocationRequest = {
				offering_id: "offering2",
				kouden_entry_ids: entryIds,
				allocation_method: "manual",
				manual_amounts: [5000, 3000, 2000], // 手動で指定
			};

			await allocateOfferingToEntries(manualRequest);

			const manualData = manualInsertMock.mock.calls[0]?.[0];
			expect(manualData[0].allocated_amount).toBe(5000);
			expect(manualData[1].allocated_amount).toBe(3000);
			expect(manualData[2].allocated_amount).toBe(2000);
		});
	});
});
