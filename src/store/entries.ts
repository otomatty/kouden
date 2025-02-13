import { atom } from "jotai";
import type { Entry, EntryForm, AttendanceType } from "@/types/entries";
import type { KoudenPermission } from "@/types/role";

// 香典データを管理するatom
export const entriesAtom = atom<Entry[]>([]);

// 楽観的更新用のデータ型
export interface OptimisticEntry extends Entry {
	isOptimistic: boolean;
	isDeleted?: boolean;
}

// 楽観的更新用のデータを管理するatom
export const optimisticEntriesAtom = atom<OptimisticEntry[]>([]);

// 実際のデータと楽観的更新データを統合するatom
export const mergedEntriesAtom = atom((get) => {
	const realEntries = get(entriesAtom);
	const optimisticEntries = get(optimisticEntriesAtom);

	// 実際のデータをIDでマップ化
	const realEntriesMap = new Map(realEntries.map((e) => [e.id, e]));

	// 楽観的更新データを処理
	for (const optimisticEntry of optimisticEntries) {
		if (optimisticEntry.isDeleted) {
			// 削除された場合は実際のデータから削除
			realEntriesMap.delete(optimisticEntry.id);
		} else {
			// 追加または更新の場合は上書き
			realEntriesMap.set(optimisticEntry.id, optimisticEntry);
		}
	}

	// Mapから配列に戻す
	return Array.from(realEntriesMap.values());
});

// 選択されたエントリーを管理するatom
export const selectedEntryAtom = atom<Entry | null>(null);

// フィルタリング用のatom
export const filterTextAtom = atom<string>("");

// ソート用のatom
export interface SortState {
	field: keyof Entry;
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
export const entryFormAtom = atom<EntryForm>({
	name: "",
	organization: "",
	position: "",
	amount: 0,
	postalCode: "",
	address: "",
	phoneNumber: null,
	relationshipId: null,
	attendanceType: "FUNERAL",
	notes: "",
});

// フォームの初期値をセットするatom
export const setEntryFormAtom = atom(null, (get, set, entry: Partial<EntryForm>) => {
	const currentForm = get(entryFormAtom);
	set(entryFormAtom, {
		...currentForm,
		...entry,
	});
});

// フォームの値を更新するatom
export const updateEntryFormAtom = atom(
	null,
	(
		get,
		set,
		update: {
			field: keyof EntryForm;
			value: EntryForm[keyof EntryForm];
		},
	) => {
		const currentForm = get(entryFormAtom);
		set(entryFormAtom, {
			...currentForm,
			[update.field]: update.value,
		});
	},
);

// フォームをリセットするatom
export const resetEntryFormAtom = atom(null, (_get, set) => {
	set(entryFormAtom, {
		name: "",
		organization: "",
		position: "",
		amount: 0,
		postalCode: "",
		address: "",
		phoneNumber: null,
		relationshipId: null,
		attendanceType: "FUNERAL",
		notes: "",
	});
});

// フォームの送信状態を管理するatom
export const formSubmissionStateAtom = atom({
	isSubmitting: false,
	error: null as string | null,
});

// 郵便番号による住所検索の状態を管理するatom
export const addressSearchStateAtom = atom({
	isSearching: false,
	error: null as string | null,
});
