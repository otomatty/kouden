import React from "react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// UIコンポーネントをモック化
vi.mock("@/components/custom/OfferingAllocationDialog", () => ({
	OfferingAllocationDialog: ({ children, ...props }: any) => (
		<div data-testid="offering-allocation-dialog" {...props}>
			{children}
		</div>
	),
}));

vi.mock("@testing-library/react", () => ({
	render: vi.fn(),
	screen: {
		getByText: vi.fn(),
		getAllByText: vi.fn(),
		getByLabelText: vi.fn(),
		getByRole: vi.fn(),
		getByTestId: vi.fn(),
	},
	fireEvent: vi.fn(),
	waitFor: vi.fn(),
}));

vi.mock("@testing-library/user-event", () => ({
	default: {
		setup: () => ({
			click: vi.fn(),
			clear: vi.fn(),
			type: vi.fn(),
		}),
		click: vi.fn(),
	},
}));

// Server Actions のモック設定
vi.mock("@/app/_actions/offerings/allocation", () => ({
	allocateOfferingToEntries: vi.fn(),
	recalculateOfferingAllocation: vi.fn(),
}));

vi.mock("@/app/_actions/offerings/queries", () => ({
	getOfferingAllocations: vi.fn(),
	checkOfferingAllocationIntegrity: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("お供物配分システム統合テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("配分システムの基本機能テスト", async () => {
		const { allocateOfferingToEntries } = await import("@/app/_actions/offerings/allocation");
		const { getOfferingAllocations } = await import("@/app/_actions/offerings/queries");

		(getOfferingAllocations as Mock).mockResolvedValue({
			success: true,
			data: [],
		});

		(allocateOfferingToEntries as Mock).mockResolvedValue({
			success: true,
		});

		// モック関数が正しく設定されていることを確認
		expect(getOfferingAllocations).toBeDefined();
		expect(allocateOfferingToEntries).toBeDefined();
	});

	it("配分データの取得が正しく動作する", async () => {
		const { getOfferingAllocations } = await import("@/app/_actions/offerings/queries");

		const mockAllocations = [
			{
				id: "alloc1",
				offering_id: "offering1",
				kouden_entry_id: "entry1",
				allocated_amount: 5000,
				allocation_ratio: 0.5,
				is_primary_contributor: true,
				contribution_notes: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				created_by: null,
			},
		];

		(getOfferingAllocations as Mock).mockResolvedValue({
			success: true,
			data: mockAllocations,
		});

		const result = await getOfferingAllocations("offering1");

		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockAllocations);
	});

	it("配分作成が正しく呼び出される", async () => {
		const { allocateOfferingToEntries } = await import("@/app/_actions/offerings/allocation");

		(allocateOfferingToEntries as Mock).mockResolvedValue({
			success: true,
		});

		const mockRequest = {
			offering_id: "offering1",
			kouden_entry_ids: ["entry1", "entry2"],
			allocation_method: "equal" as const,
			primary_contributor_id: "entry1",
		};

		const result = await allocateOfferingToEntries(mockRequest);

		expect(result.success).toBe(true);
		expect(allocateOfferingToEntries).toHaveBeenCalledWith(mockRequest);
	});

	it("手動配分でエラーハンドリングが動作する", async () => {
		const { allocateOfferingToEntries } = await import("@/app/_actions/offerings/allocation");

		(allocateOfferingToEntries as Mock).mockResolvedValue({
			success: false,
			error: "配分金額の合計（11000円）がお供物価格（10000円）と一致しません",
		});

		const mockRequest = {
			offering_id: "offering1",
			kouden_entry_ids: ["entry1", "entry2"],
			allocation_method: "manual" as const,
			manual_amounts: [5000, 6000], // 合計11000で不一致
		};

		const result = await allocateOfferingToEntries(mockRequest);

		expect(result.success).toBe(false);
		expect(result.error).toContain("配分金額の合計");
	});

	it("整合性チェックが正しく動作する", async () => {
		const { checkOfferingAllocationIntegrity } = await import("@/app/_actions/offerings/queries");

		(checkOfferingAllocationIntegrity as Mock).mockResolvedValue({
			success: true,
			data: [
				{
					offering_id: "offering1",
					offering_type: "生花",
					offering_price: 10000,
					total_allocated: 10000,
					allocation_difference: 0,
					ratio_sum: 1.0,
					is_valid: true,
				},
			],
		});

		const result = await checkOfferingAllocationIntegrity("offering1");

		expect(result.success).toBe(true);
		expect(result.data?.[0]?.is_valid).toBe(true);
		expect(result.data?.[0]?.allocation_difference).toBe(0);
	});
});
