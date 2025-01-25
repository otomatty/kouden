import { atom } from "jotai";
import type { KoudenEntry } from "@/types/kouden";

// 基本的なエントリーデータを管理するatom
export const entriesAtom = atom<KoudenEntry[]>([]);

// 楽観的更新用のデータ型
export interface OptimisticEntry extends KoudenEntry {
	isOptimistic: boolean;
}

// 楽観的更新用のデータを管理するatom
export const optimisticEntriesAtom = atom<OptimisticEntry[]>([]);

// 実際のデータと楽観的更新データを統合するatom
export const mergedEntriesAtom = atom((get) => {
	const realEntries = get(entriesAtom);
	const optimisticEntries = get(optimisticEntriesAtom);

	// 楽観的更新データを優先して表示
	return [...optimisticEntries, ...realEntries];
});

// 選択されたエントリーを管理するatom
export const selectedEntryAtom = atom<KoudenEntry | null>(null);

// フィルタリング用のatom
export const filterTextAtom = atom<string>("");

// ソート用のatom
export interface SortState {
	field: keyof KoudenEntry;
	direction: "asc" | "desc";
}

export const sortStateAtom = atom<SortState>({
	field: "created_at",
	direction: "desc",
});

// フィルタリングとソートを適用した最終的なエントリーリストを生成するatom
export const filteredAndSortedEntriesAtom = atom((get) => {
	const entries = get(mergedEntriesAtom);
	const filterText = get(filterTextAtom);
	const sortState = get(sortStateAtom);

	// フィルタリングの適用
	let filtered = entries;
	if (filterText) {
		const searchText = filterText.toLowerCase();
		filtered = entries.filter(
			(entry) =>
				entry.name?.toLowerCase().includes(searchText) ||
				entry.organization?.toLowerCase().includes(searchText) ||
				entry.position?.toLowerCase().includes(searchText) ||
				entry.address?.toLowerCase().includes(searchText),
		);
	}

	// ソートの適用
	return [...filtered].sort((a, b) => {
		const aValue = a[sortState.field] as string | number | null;
		const bValue = b[sortState.field] as string | number | null;

		if (aValue === bValue) return 0;
		if (aValue === null) return 1;
		if (bValue === null) return -1;

		const comparison = aValue < bValue ? -1 : 1;
		return sortState.direction === "asc" ? comparison : -comparison;
	});
});

// ページネーション用のatom
export interface PaginationState {
	currentPage: number;
	itemsPerPage: number;
}

export const paginationStateAtom = atom<PaginationState>({
	currentPage: 1,
	itemsPerPage: 10,
});

// 現在のページのエントリーを取得するatom
export const currentPageEntriesAtom = atom((get) => {
	const entries = get(filteredAndSortedEntriesAtom);
	const { currentPage, itemsPerPage } = get(paginationStateAtom);

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	return entries.slice(startIndex, endIndex);
});

// 総ページ数を計算するatom
export const totalPagesAtom = atom((get) => {
	const entries = get(filteredAndSortedEntriesAtom);
	const { itemsPerPage } = get(paginationStateAtom);

	return Math.ceil(entries.length / itemsPerPage);
});

// ローディング状態を管理するatom
export const isLoadingAtom = atom<boolean>(false);

// エラー状態を管理するatom
export const errorAtom = atom<Error | null>(null);

// フォームの状態を管理するatom
export const formStateAtom = atom<{
	isSubmitting: boolean;
	error: string | null;
}>({
	isSubmitting: false,
	error: null,
});
