import { atom } from "jotai";
import type { Database } from "@/types/supabase";
import type { Telegram, TelegramRow, UpdateTelegramInput } from "@/types/telegrams";

// スネークケースからキャメルケースへの変換
export const toCamelCase = (row: TelegramRow): Telegram => ({
	id: row.id,
	koudenId: row.kouden_id,
	koudenEntryId: row.kouden_entry_id,
	senderName: row.sender_name,
	senderOrganization: row.sender_organization,
	senderPosition: row.sender_position,
	message: row.message,
	notes: row.notes,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
	createdBy: row.created_by,
});

// キャメルケースからスネークケースへの変換
export const toSnakeCase = (telegram: Partial<Telegram>): Partial<TelegramRow> => {
	const result: Partial<TelegramRow> = {};
	if (telegram.id !== undefined) result.id = telegram.id;
	if (telegram.koudenId !== undefined) result.kouden_id = telegram.koudenId;
	if (telegram.koudenEntryId !== undefined) result.kouden_entry_id = telegram.koudenEntryId;
	if (telegram.senderName !== undefined) result.sender_name = telegram.senderName;
	if (telegram.senderOrganization !== undefined)
		result.sender_organization = telegram.senderOrganization;
	if (telegram.senderPosition !== undefined) result.sender_position = telegram.senderPosition;
	if (telegram.message !== undefined) result.message = telegram.message;
	if (telegram.notes !== undefined) result.notes = telegram.notes;
	if (telegram.createdAt !== undefined) result.created_at = telegram.createdAt;
	if (telegram.updatedAt !== undefined) result.updated_at = telegram.updatedAt;
	if (telegram.createdBy !== undefined) result.created_by = telegram.createdBy;
	return result;
};

// アクション型の定義
type TelegramAction =
	| { type: "setLoading"; payload: boolean }
	| { type: "setError"; payload: Error | null }
	| { type: "setItems"; payload: Telegram[] }
	| { type: "updateOptimistic"; payload: { id: string; data: Telegram } }
	| { type: "clearOptimistic"; payload: string }
	| {
			type: "setDialog";
			payload: {
				dialog: keyof TelegramState["dialogs"];
				props: TelegramState["dialogs"][keyof TelegramState["dialogs"]];
			};
	  }
	| { type: "setFilter"; payload: Partial<TelegramState["data"]["filter"]> }
	| { type: "setSort"; payload: Partial<TelegramState["data"]["sort"]> }
	| {
			type: "setPagination";
			payload: Partial<TelegramState["data"]["pagination"]>;
	  };

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
export const telegramsActionsAtom = atom(null, (get, set, action: TelegramAction) => {
	const state = get(telegramStateAtom);

	switch (action.type) {
		case "setLoading":
			set(telegramStateAtom, { ...state, isLoading: action.payload });
			break;
		case "setError":
			set(telegramStateAtom, {
				...state,
				error: action.payload as Error | null,
			});
			break;
		case "setItems":
			set(telegramStateAtom, {
				...state,
				data: { ...state.data, items: action.payload as Telegram[] },
			});
			break;
		case "updateOptimistic": {
			const { id, data } = action.payload;
			const newOptimisticUpdates = new Map(state.data.optimisticUpdates);
			newOptimisticUpdates.set(id, data);
			set(telegramStateAtom, {
				...state,
				data: {
					...state.data,
					optimisticUpdates: newOptimisticUpdates,
				},
			});
			break;
		}
		case "clearOptimistic": {
			const optimisticUpdates = new Map(state.data.optimisticUpdates);
			optimisticUpdates.delete(action.payload);
			set(telegramStateAtom, {
				...state,
				data: { ...state.data, optimisticUpdates },
			});
			break;
		}
		case "setDialog": {
			const { dialog, props } = action.payload;
			set(telegramStateAtom, {
				...state,
				dialogs: { ...state.dialogs, [dialog]: props },
			});
			break;
		}
		case "setFilter":
			set(telegramStateAtom, {
				...state,
				data: {
					...state.data,
					filter: { ...state.data.filter, ...action.payload },
				},
			});
			break;
		case "setSort":
			set(telegramStateAtom, {
				...state,
				data: {
					...state.data,
					sort: { ...state.data.sort, ...action.payload },
				},
			});
			break;
		case "setPagination":
			set(telegramStateAtom, {
				...state,
				data: {
					...state.data,
					pagination: { ...state.data.pagination, ...action.payload },
				},
			});
			break;
	}
});

// 実際のデータと楽観的更新データを統合するatom
export const mergedTelegramsAtom = atom((get) => {
	const realTelegrams = get(telegramsAtom);
	const optimisticTelegrams = get(optimisticTelegramsAtom);

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
export const filteredTelegramsAtom = atom((get) => {
	const telegrams = get(telegramsAtom);
	const optimisticTelegrams = get(optimisticTelegramsAtom);
	const filterText = get(telegramFilterTextAtom);
	const sortState = get(telegramSortStateAtom);

	// 楽観的更新を適用
	let mergedItems = [...telegrams];
	for (const optimistic of optimisticTelegrams) {
		const index = mergedItems.findIndex((item) => item.id === optimistic.id);
		if (index !== -1) {
			if (optimistic.isDeleted) {
				mergedItems.splice(index, 1);
			} else {
				mergedItems[index] = optimistic;
			}
		} else if (!optimistic.isDeleted) {
			mergedItems.push(optimistic);
		}
	}

	// フィルタリング
	if (filterText) {
		const searchText = filterText.toLowerCase();
		mergedItems = mergedItems.filter(
			(telegram) =>
				telegram.senderName?.toLowerCase().includes(searchText) ||
				telegram.senderOrganization?.toLowerCase().includes(searchText) ||
				telegram.senderPosition?.toLowerCase().includes(searchText) ||
				telegram.message?.toLowerCase().includes(searchText),
		);
	}

	// ソート
	return [...mergedItems].sort((a, b) => {
		const aValue = a[sortState.field];
		const bValue = b[sortState.field];

		if (aValue === bValue) return 0;
		if (aValue === null) return 1;
		if (bValue === null) return -1;

		const comparison = aValue < bValue ? -1 : 1;
		return sortState.direction === "asc" ? comparison : -comparison;
	});
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

// フォームの送信状態を管理するatom
export const formSubmissionAtom = atom<{
	isSubmitting: boolean;
	error: string | null;
}>({
	isSubmitting: false,
	error: null,
});

// 削除ダイアログの状態を管理するatom
export const deleteDialogAtom = atom<{
	isOpen: boolean;
	telegramId: string | null;
}>({
	isOpen: false,
	telegramId: null,
});

// 基本的な状態管理の構造
export interface TelegramState {
	isLoading: boolean;
	error: Error | null;
	dialogs: {
		create: {
			isOpen: boolean;
			defaultValues: Partial<Telegram> | null;
		};
		edit: {
			isOpen: boolean;
			selectedTelegram: Telegram | null;
		};
		delete: {
			isOpen: boolean;
			selectedIds: string[];
		};
	};
	data: {
		items: Telegram[];
		optimisticUpdates: Map<string, Telegram>;
		filter: {
			searchQuery: string;
			searchField: keyof Telegram;
		};
		sort: {
			field: keyof Telegram;
			direction: "asc" | "desc";
		};
		pagination: {
			currentPage: number;
			itemsPerPage: number;
		};
	};
}

// 基本的なデータを管理するatom
export const telegramStateAtom = atom<TelegramState>({
	isLoading: false,
	error: null,
	dialogs: {
		create: {
			isOpen: false,
			defaultValues: null,
		},
		edit: {
			isOpen: false,
			selectedTelegram: null,
		},
		delete: {
			isOpen: false,
			selectedIds: [],
		},
	},
	data: {
		items: [],
		optimisticUpdates: new Map(),
		filter: {
			searchQuery: "",
			searchField: "senderName",
		},
		sort: {
			field: "createdAt",
			direction: "desc",
		},
		pagination: {
			currentPage: 1,
			itemsPerPage: 10,
		},
	},
});

// 派生state - 現在のページのデータ
export const currentPageTelegramsAtom = atom((get) => {
	const filteredTelegrams = get(filteredTelegramsAtom);
	const { currentPage, itemsPerPage } = get(telegramStateAtom).data.pagination;

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	return filteredTelegrams.slice(startIndex, endIndex);
});

// 派生state - 総ページ数
export const totalTelegramPagesAtom = atom((get) => {
	const filteredTelegrams = get(filteredTelegramsAtom);
	const { itemsPerPage } = get(telegramStateAtom).data.pagination;

	return Math.ceil(filteredTelegrams.length / itemsPerPage);
});

// アクション用のatom
export const telegramActionsAtom = atom(null, (get, set, action: TelegramAction) => {
	const state = get(telegramStateAtom);

	switch (action.type) {
		case "setLoading":
			set(telegramStateAtom, {
				...state,
				isLoading: action.payload as boolean,
			});
			break;
		case "setError":
			set(telegramStateAtom, {
				...state,
				error: action.payload as Error | null,
			});
			break;
		case "setItems":
			set(telegramStateAtom, {
				...state,
				data: { ...state.data, items: action.payload as Telegram[] },
			});
			break;
		case "updateOptimistic": {
			const { id, data } = action.payload;
			const newOptimisticUpdates = new Map(state.data.optimisticUpdates);
			newOptimisticUpdates.set(id, data);
			set(telegramStateAtom, {
				...state,
				data: {
					...state.data,
					optimisticUpdates: newOptimisticUpdates,
				},
			});
			break;
		}
		case "clearOptimistic": {
			const optimisticUpdates = new Map(state.data.optimisticUpdates);
			optimisticUpdates.delete(action.payload);
			set(telegramStateAtom, {
				...state,
				data: { ...state.data, optimisticUpdates },
			});
			break;
		}
		case "setDialog": {
			const { dialog, props } = action.payload;
			set(telegramStateAtom, {
				...state,
				dialogs: { ...state.dialogs, [dialog]: props },
			});
			break;
		}
		case "setFilter":
			set(telegramStateAtom, {
				...state,
				data: {
					...state.data,
					filter: { ...state.data.filter, ...action.payload },
				},
			});
			break;
		case "setSort":
			set(telegramStateAtom, {
				...state,
				data: {
					...state.data,
					sort: { ...state.data.sort, ...action.payload },
				},
			});
			break;
		case "setPagination":
			set(telegramStateAtom, {
				...state,
				data: {
					...state.data,
					pagination: { ...state.data.pagination, ...action.payload },
				},
			});
			break;
	}
});

export const updateTelegramAtom = atom<
	((id: string, input: UpdateTelegramInput) => Promise<void>) | null
>(null);

export const deleteTelegramAtom = atom<((ids: string[]) => Promise<void>) | null>(null);
