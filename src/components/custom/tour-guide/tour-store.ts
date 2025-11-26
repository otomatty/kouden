import type { TourState } from "@/types/tour";
import { atom } from "jotai";

export const tourStateAtom = atom<TourState>({
	isActive: false,
	currentPage: "",
});
