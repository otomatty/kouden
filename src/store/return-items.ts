import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import type { ReturnItem } from "@/types/return-records/return-items";

// 返礼品データを管理するatom（香典帳IDごと）
export const returnItemsAtom = atom<Record<string, ReturnItem[]>>({});

// atomFamilyを使用して安定したatomを作成
export const returnItemsByKoudenAtomFamily = atomFamily((koudenId: string) =>
	atom(
		(get) => {
			const allReturnItems = get(returnItemsAtom);
			return allReturnItems[koudenId] || [];
		},
		(get, set, items: ReturnItem[]) => {
			const current = get(returnItemsAtom);
			set(returnItemsAtom, {
				...current,
				[koudenId]: items,
			});
		},
	),
);

// アクティブな返礼品のみを取得するatomFamily
export const activeReturnItemsByKoudenAtomFamily = atomFamily((koudenId: string) =>
	atom((get) => {
		const items = get(returnItemsByKoudenAtomFamily(koudenId));
		return items.filter((item) => item.is_active);
	}),
);

// 後方互換性のためのエクスポート（deprecated）
export const getReturnItemsByKoudenAtom = returnItemsByKoudenAtomFamily;
export const setReturnItemsByKoudenAtom = returnItemsByKoudenAtomFamily;
export const getActiveReturnItemsByKoudenAtom = activeReturnItemsByKoudenAtomFamily;
