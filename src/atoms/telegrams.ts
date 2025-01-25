import { atom } from "jotai";
import type { Database } from "@/types/supabase";

type SupabaseTelegram = Database["public"]["Tables"]["telegrams"]["Row"];

export interface Telegram {
	id: string;
	koudenId: string;
	koudenEntryId: string | null;
	senderName: string;
	senderOrganization: string | null;
	senderPosition: string | null;
	message: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
}

// スネークケースからキャメルケースへの変換
export const toCamelCase = (telegram: SupabaseTelegram): Telegram => ({
	id: telegram.id,
	koudenId: telegram.kouden_id,
	koudenEntryId: telegram.kouden_entry_id,
	senderName: telegram.sender_name,
	senderOrganization: telegram.sender_organization,
	senderPosition: telegram.sender_position,
	message: telegram.message,
	notes: telegram.notes,
	createdAt: telegram.created_at,
	updatedAt: telegram.updated_at,
	createdBy: telegram.created_by,
});

// キャメルケースからスネークケースへの変換
const toSnakeCase = (
	telegram: Partial<Telegram>,
): Partial<SupabaseTelegram> => {
	const result: Partial<SupabaseTelegram> = {};
	if (telegram.id !== undefined) result.id = telegram.id;
	if (telegram.koudenId !== undefined) result.kouden_id = telegram.koudenId;
	if (telegram.koudenEntryId !== undefined)
		result.kouden_entry_id = telegram.koudenEntryId;
	if (telegram.senderName !== undefined)
		result.sender_name = telegram.senderName;
	if (telegram.senderOrganization !== undefined)
		result.sender_organization = telegram.senderOrganization;
	if (telegram.senderPosition !== undefined)
		result.sender_position = telegram.senderPosition;
	if (telegram.message !== undefined) result.message = telegram.message;
	if (telegram.notes !== undefined) result.notes = telegram.notes;
	if (telegram.createdAt !== undefined) result.created_at = telegram.createdAt;
	if (telegram.updatedAt !== undefined) result.updated_at = telegram.updatedAt;
	if (telegram.createdBy !== undefined) result.created_by = telegram.createdBy;
	return result;
};

// アクション型の定義
type TelegramAction =
	| { type: "add"; payload: Partial<Telegram> }
	| { type: "update"; payload: Partial<Telegram> }
	| { type: "delete"; payload: string };

// 基本的なデータを管理するatom
export const telegramsAtom = atom<Telegram[]>([]);

// 楽観的更新用のデータ型
export interface OptimisticTelegram extends Telegram {
	isOptimistic: boolean;
	isDeleted?: boolean;
}

// 楽観的更新用のデータを管理するatom
export const optimisticTelegramsAtom = atom<OptimisticTelegram[]>([]);

// テーブルの更新関数を提供するatom
export const telegramsActionsAtom = atom(
	null,
	(get, set, action: TelegramAction) => {
		const telegrams = get(telegramsAtom);

		switch (action.type) {
			case "add":
				set(telegramsAtom, [action.payload as Telegram, ...telegrams]);
				break;
			case "update":
				set(
					telegramsAtom,
					telegrams.map((t) =>
						t.id === action.payload.id ? { ...t, ...action.payload } : t,
					),
				);
				break;
			case "delete":
				set(
					telegramsAtom,
					telegrams.filter((t) => t.id !== action.payload),
				);
				break;
		}
	},
);

// 実際のデータと楽観的更新データを統合するatom
export const mergedTelegramsAtom = atom((get) => {
	const realTelegrams = get(telegramsAtom);
	const optimisticTelegrams = get(optimisticTelegramsAtom);

	console.log("mergedTelegramsAtom - realTelegrams:", realTelegrams);
	console.log(
		"mergedTelegramsAtom - optimisticTelegrams:",
		optimisticTelegrams,
	);

	// 実際のデータをIDでマップ化
	const realTelegramsMap = new Map(realTelegrams.map((t) => [t.id, t]));

	// 楽観的更新データを処理
	for (const optimisticTelegram of optimisticTelegrams) {
		if (optimisticTelegram.isDeleted) {
			// 削除された場合は実際のデータから削除
			realTelegramsMap.delete(optimisticTelegram.id);
		} else {
			// 追加または更新の場合は上書き
			realTelegramsMap.set(optimisticTelegram.id, optimisticTelegram);
		}
	}

	// Mapから配列に戻す
	const mergedTelegrams = Array.from(realTelegramsMap.values());

	console.log("mergedTelegramsAtom - final result:", mergedTelegrams);
	return mergedTelegrams;
});

// 選択されたデータを管理するatom
export const selectedTelegramAtom = atom<Telegram | null>(null);

// フィルタリング用のatom
export const telegramFilterTextAtom = atom<string>("");

// ソート用のatom
export interface TelegramSortState {
	field: keyof Telegram;
	direction: "asc" | "desc";
}

export const telegramSortStateAtom = atom<TelegramSortState>({
	field: "createdAt",
	direction: "desc",
});

// フィルタリングとソートを適用した最終的なリストを生成するatom
export const filteredAndSortedTelegramsAtom = atom((get) => {
	const telegrams = get(mergedTelegramsAtom);
	const filterText = get(telegramFilterTextAtom);
	const sortState = get(telegramSortStateAtom);

	console.log("filteredAndSortedTelegramsAtom - initial:", telegrams);
	console.log("filteredAndSortedTelegramsAtom - filterText:", filterText);
	console.log("filteredAndSortedTelegramsAtom - sortState:", sortState);

	// フィルタリングの適用
	let filtered = telegrams;
	if (filterText) {
		const searchText = filterText.toLowerCase();
		filtered = telegrams.filter(
			(telegram) =>
				telegram.senderName?.toLowerCase().includes(searchText) ||
				telegram.senderOrganization?.toLowerCase().includes(searchText) ||
				telegram.senderPosition?.toLowerCase().includes(searchText) ||
				telegram.message?.toLowerCase().includes(searchText),
		);
		console.log("filteredAndSortedTelegramsAtom - after filter:", filtered);
	}

	// ソートの適用
	const sorted = [...filtered].sort((a, b) => {
		const aValue = a[sortState.field] as string | number | null;
		const bValue = b[sortState.field] as string | number | null;

		if (aValue === bValue) return 0;
		if (aValue === null) return 1;
		if (bValue === null) return -1;

		const comparison = aValue < bValue ? -1 : 1;
		const result = sortState.direction === "asc" ? comparison : -comparison;
		console.log("filteredAndSortedTelegramsAtom - sorting comparison:", {
			a: aValue,
			b: bValue,
			result,
		});
		return result;
	});

	console.log("filteredAndSortedTelegramsAtom - final result:", sorted);
	return sorted;
});

// ページネーション用のatom
export interface TelegramPaginationState {
	currentPage: number;
	itemsPerPage: number;
}

export const telegramPaginationStateAtom = atom<TelegramPaginationState>({
	currentPage: 1,
	itemsPerPage: 10,
});

// 現在のページのデータを取得するatom
export const currentPageTelegramsAtom = atom((get) => {
	const telegrams = get(filteredAndSortedTelegramsAtom);
	const { currentPage, itemsPerPage } = get(telegramPaginationStateAtom);

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	return telegrams.slice(startIndex, endIndex);
});

// 総ページ数を計算するatom
export const totalTelegramPagesAtom = atom((get) => {
	const telegrams = get(filteredAndSortedTelegramsAtom);
	const { itemsPerPage } = get(telegramPaginationStateAtom);

	return Math.ceil(telegrams.length / itemsPerPage);
});

// UI状態を管理するatom
export const telegramDialogAtom = atom<{
	isOpen: boolean;
	selectedTelegram: Telegram | null;
}>({
	isOpen: false,
	selectedTelegram: null,
});

// ローディング状態を管理するatom
export const telegramLoadingAtom = atom<boolean>(false);

// エラー状態を管理するatom
export const telegramErrorAtom = atom<Error | null>(null);

// フォームの状態を管理するatom
export const telegramFormStateAtom = atom<{
	isSubmitting: boolean;
	error: string | null;
}>({
	isSubmitting: false,
	error: null,
});
