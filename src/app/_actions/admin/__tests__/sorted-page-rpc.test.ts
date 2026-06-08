import { describe, expect, it, vi } from "vitest";
import {
	resolveSortedPageTotalCount,
	totalCountFromSortedPageRows,
} from "../sorted-page-rpc";

describe("totalCountFromSortedPageRows", () => {
	it("returns total_count from the first row", () => {
		expect(totalCountFromSortedPageRows([{ id: "a", total_count: 42 }])).toBe(42);
		expect(totalCountFromSortedPageRows([{ id: "a", total_count: "99" }])).toBe(99);
	});

	it("returns 0 for an empty page", () => {
		expect(totalCountFromSortedPageRows([])).toBe(0);
	});
});

describe("resolveSortedPageTotalCount", () => {
	it("uses total_count from a non-empty page", async () => {
		const fetchTotalCount = vi.fn();

		await expect(
			resolveSortedPageTotalCount([{ id: "a", total_count: 15 }], 20, fetchTotalCount),
		).resolves.toBe(15);

		expect(fetchTotalCount).not.toHaveBeenCalled();
	});

	it("returns 0 for the first page when there are no rows", async () => {
		const fetchTotalCount = vi.fn();

		await expect(resolveSortedPageTotalCount([], 0, fetchTotalCount)).resolves.toBe(0);

		expect(fetchTotalCount).not.toHaveBeenCalled();
	});

	it("probes the first page when an out-of-range page is empty", async () => {
		const fetchTotalCount = vi
			.fn()
			.mockResolvedValue([{ id: "a", total_count: 37 }] as const);

		await expect(resolveSortedPageTotalCount([], 40, fetchTotalCount)).resolves.toBe(37);

		expect(fetchTotalCount).toHaveBeenCalledOnce();
	});
});
