import { atom } from "jotai";

/**
 * 香典帳詳細画面のタブの種類を定義
 */
export type KoudenTab = "entries" | "offerings" | "telegrams" | "statistics" | "settings";

/**
 * 香典帳詳細画面の現在選択中のタブを管理するatom
 * @default 'entries'
 */
export const koudenTabAtom = atom<KoudenTab>("entries");
