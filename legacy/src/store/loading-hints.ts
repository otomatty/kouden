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

// 返礼記録の一括更新用のTips
export const returnRecordsBulkUpdateHints = [
	{
		id: "bulk-efficiency",
		text: "一括更新機能を使用することで、数百件の返礼記録を一度に効率的に処理できます。",
	},
	{
		id: "amount-grouping",
		text: "香典の金額ごとにグループ化されるため、同じ金額の参列者に統一した返礼品を簡単に設定できます。",
	},
	{
		id: "return-items",
		text: "返礼品マスタに登録した商品を選択するだけで、名前や価格が自動で入力されます。",
	},
	{
		id: "status-management",
		text: "返礼状況（準備中・一部返礼・完了・不要）を一括で変更できるため、進捗管理が簡単です。",
	},
	{
		id: "cost-calculation",
		text: "選択した返礼品の合計コストと香典金額の差額が自動計算され、収支が一目で分かります。",
	},
	{
		id: "batch-processing",
		text: "大量データの処理中です。この間に他の香典帳の作業を進めることも可能です。",
	},
	{
		id: "data-integrity",
		text: "更新処理はトランザクション処理により、途中でエラーが発生してもデータの整合性が保たれます。",
	},
	{
		id: "performance-tip",
		text: "処理時間は対象件数により変動します。大量データの場合は数分かかることがあります。",
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
