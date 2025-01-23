import { atom } from "jotai";

interface TourState {
	isActive: boolean;
	currentPage: string;
}

export const tourStateAtom = atom<TourState>({
	isActive: false,
	currentPage: "",
});
