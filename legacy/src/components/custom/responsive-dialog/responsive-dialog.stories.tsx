import type { Meta, StoryObj } from "@storybook/react";
import { ResponsiveDialog } from ".";
import { Button } from "@/components/ui/button";

const meta = {
	title: "Components/ResponsiveDialog",
	component: ResponsiveDialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ResponsiveDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		trigger: <Button>ダイアログを開く</Button>,
		title: "ダイアログのタイトル",
		description: "ダイアログの説明文が入ります。",
		children: (
			<div className="p-4">
				<p>ダイアログの内容がここに入ります。</p>
			</div>
		),
	},
};

export const WithFunctionChildren: Story = {
	args: {
		trigger: <Button>ダイアログを開く</Button>,
		title: "確認",
		description: "アクションを実行しますか？",
		children: ({ close }) => (
			<div className="p-4 space-y-4">
				<p>アクションの内容がここに入ります。</p>
				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={close}>
						キャンセル
					</Button>
					<Button
						onClick={() => {
							console.log("アクションを実行");
							close();
						}}
					>
						実行
					</Button>
				</div>
			</div>
		),
	},
};

export const CustomStyles: Story = {
	args: {
		trigger: <Button>カスタムスタイル</Button>,
		title: "カスタムスタイル",
		className: "bg-slate-50 p-6 rounded-lg",
		contentClassName: "sm:max-w-[600px]",
		children: (
			<div className="space-y-4">
				<p>カスタムスタイルを適用したコンテンツ</p>
			</div>
		),
	},
};
