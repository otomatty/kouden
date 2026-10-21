import type { Meta, StoryObj } from "@storybook/react";
import { DeleteDialog } from "./delete-dialog";

const meta = {
	title: "Components/DeleteDialog",
	component: DeleteDialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof DeleteDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "項目の削除",
		description: "この項目を削除してもよろしいですか？",
		targetName: "サンプル項目",
		onDelete: async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		},
	},
};

export const WithCustomMessages: Story = {
	args: {
		title: "ユーザーの削除",
		description:
			"このユーザーを削除すると、関連するデータもすべて削除されます。この操作は取り消せません。",
		targetName: "山田太郎",
		buttonLabel: "アカウントを削除",
		successMessage: "ユーザーを削除しました",
		errorMessage: "ユーザーの削除に失敗しました",
		onDelete: async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		},
		onSuccess: () => {
			console.log("削除成功後の処理");
		},
	},
};

export const WithError: Story = {
	args: {
		title: "エラーケース",
		description: "この操作は失敗します",
		targetName: "エラーテスト",
		onDelete: async () => {
			await new Promise((_, reject) => setTimeout(() => reject(new Error("削除エラー")), 1000));
		},
	},
};
