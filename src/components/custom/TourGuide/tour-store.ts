import { atom } from "jotai";
import type { TourState } from "@/types/tour";

const initialState: TourState = {
	isActive: false,
	isCompleted: false,
};

// ローカルストレージから初期状態を読み込む
if (typeof window !== "undefined") {
	const completed = localStorage.getItem("tourCompleted");
	if (completed === "true") {
		initialState.isCompleted = true;
	}
}

export const tourStateAtom = atom<TourState>(initialState);
