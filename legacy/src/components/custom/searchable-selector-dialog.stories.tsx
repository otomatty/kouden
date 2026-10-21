import type { Meta, StoryObj } from "@storybook/react";
import { SearchableSelectorDialog } from "./searchable-selector-dialog";
import { Button } from "@/components/ui/button";

const meta = {
	title: "Components/SearchableSelectorDialog",
	component: SearchableSelectorDialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof SearchableSelectorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
	{
		id: "1",
		name: "山田太郎",
		organization: "株式会社サンプル",
		position: "代表取締役",
		amount: 50000,
		notes: "特別な備考",
	},
	{
		id: "2",
		name: "鈴木花子",
		organization: "有限会社テスト",
		position: "部長",
		amount: 30000,
	},
	{
		id: "3",
		name: "佐藤一郎",
		organization: "サンプル工業",
		amount: 10000,
	},
];

export const Default: Story = {
	args: {
		items: sampleItems,
		selectedIds: [],
		trigger: <Button>香典を選択</Button>,
		onSelectionChange: (selectedIds) => {
			console.log("Selected IDs:", selectedIds);
		},
	},
};

export const WithPreselected: Story = {
	args: {
		items: sampleItems,
		selectedIds: ["1", "2"],
		trigger: <Button>選択済みの香典</Button>,
		onSelectionChange: (selectedIds) => {
			console.log("Selected IDs:", selectedIds);
		},
	},
};

export const CustomLabels: Story = {
	args: {
		items: sampleItems,
		selectedIds: [],
		trigger: <Button>カスタムラベル</Button>,
		title: "関連項目の選択",
		description: "必要な項目を選択してください",
		searchPlaceholder: "項目を検索...",
		onSelectionChange: (selectedIds) => {
			console.log("Selected IDs:", selectedIds);
		},
	},
};
