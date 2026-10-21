import { atom } from "jotai";
import type { TourState } from "@/types/tour";

export const tourStateAtom = atom<TourState>({
	isActive: false,
	currentPage: "",
});
