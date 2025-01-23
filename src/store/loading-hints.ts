import { atom } from "jotai";

export const loadingHints = [
	{ id: "manage", text: "香典帳では、参列者の情報を簡単に管理できます。" },
	{
		id: "address",
		text: "参列者の住所は自動で補完されるので、入力の手間が省けます。",
	},
	{ id: "money", text: "香典の金額や品物の記録も簡単にできます。" },
	{ id: "print", text: "参列者へのお礼状の宛名印刷にも対応しています。" },
	{
		id: "suggest",
		text: "過去の香典帳データを参考に、適切な香典の金額を提案します。",
	},
];

interface LoadingState {
	isLoading: boolean;
	title: string;
}

export const loadingStateAtom = atom<LoadingState>({
	isLoading: false,
	title: "",
});
