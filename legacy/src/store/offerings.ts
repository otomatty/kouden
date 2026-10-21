import { atom } from "jotai";
import type { Offering, OfferingType } from "@/types/offerings";

// お供物データを管理するatom
export const offeringsAtom = atom<Offering[]>([]);

// 楽観的更新用のデータ型
export interface OptimisticOffering extends Offering {
	isOptimistic: boolean;
	isDeleted?: boolean;
}

// 楽観的更新用のデータを管理するatom
export const optimisticOfferingsAtom = atom<OptimisticOffering[]>([]);

// 実際のデータと楽観的更新データを統合するatom
export const mergedOfferingsAtom = atom((get) => {
	const realOfferings = get(offeringsAtom);
	const optimisticOfferings = get(optimisticOfferingsAtom);

	// 実際のデータをIDでマップ化
	const realOfferingsMap = new Map(realOfferings.map((o) => [o.id, o]));

	// 楽観的更新データを処理
	for (const optimisticOffering of optimisticOfferings) {
		if (optimisticOffering.isDeleted) {
			// 削除された場合は実際のデータから削除
			realOfferingsMap.delete(optimisticOffering.id);
		} else {
			// 追加または更新の場合は上書き
			realOfferingsMap.set(optimisticOffering.id, optimisticOffering);
		}
	}

	// Mapから配列に戻す
	return Array.from(realOfferingsMap.values());
});

// 選択されたお供物を管理するatom
export const selectedOfferingAtom = atom<Offering | null>(null);

// フィルタリング用のatom
export const filterTextAtom = atom<string>("");

// ソート用のatom
export interface SortState {
	field: keyof Offering;
	direction: "asc" | "desc";
}

export const sortStateAtom = atom<SortState>({
	field: "created_at",
	direction: "desc",
});

// フィルタリングとソートを適用した最終的なお供物リストを生成するatom
export const filteredAndSortedOfferingsAtom = atom((get) => {
	const offerings = get(mergedOfferingsAtom);
	const filterText = get(filterTextAtom);
	const sortState = get(sortStateAtom);

	// フィルタリングの適用
	let filtered = offerings;
	if (filterText) {
		const searchText = filterText.toLowerCase();
		filtered = offerings.filter(
			(offering) =>
				offering.description?.toLowerCase().includes(searchText) ||
				offering.notes?.toLowerCase().includes(searchText),
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

// 現在のページのお供物を取得するatom
export const currentPageOfferingsAtom = atom((get) => {
	const offerings = get(filteredAndSortedOfferingsAtom);
	const { currentPage, itemsPerPage } = get(paginationStateAtom);

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	return offerings.slice(startIndex, endIndex);
});

// 総ページ数を計算するatom
export const totalPagesAtom = atom((get) => {
	const offerings = get(filteredAndSortedOfferingsAtom);
	const { itemsPerPage } = get(paginationStateAtom);

	return Math.ceil(offerings.length / itemsPerPage);
});

// ローディング状態を管理するatom
export const isLoadingAtom = atom<boolean>(false);

// エラー状態を管理するatom
export const errorAtom = atom<Error | null>(null);

// フォームの状態を管理するatom
export interface OfferingForm {
	description: string | null;
	notes: string | null;
	type: OfferingType;
}

export const offeringFormAtom = atom<OfferingForm>({
	description: null,
	notes: null,
	type: "OTHER",
});

// フォームの初期値をセットするatom
export const setOfferingFormAtom = atom(null, (get, set, offering: Partial<OfferingForm>) => {
	const currentForm = get(offeringFormAtom);
	set(offeringFormAtom, {
		...currentForm,
		...offering,
	});
});

// フォームの値を更新するatom
export const updateOfferingFormAtom = atom(
	null,
	(
		get,
		set,
		update: {
			field: keyof OfferingForm;
			value: OfferingForm[keyof OfferingForm];
		},
	) => {
		const currentForm = get(offeringFormAtom);
		set(offeringFormAtom, {
			...currentForm,
			[update.field]: update.value,
		});
	},
);

// フォームをリセットするatom
export const resetOfferingFormAtom = atom(null, (_get, set) => {
	set(offeringFormAtom, {
		description: null,
		notes: null,
		type: "OTHER",
	});
});

// フォームの送信状態を管理するatom
export const formSubmissionStateAtom = atom({
	isSubmitting: false,
	error: null as string | null,
});
