import type { Meta, StoryObj } from "@storybook/react";
import { GuideCard } from "./guide-card";
import { Button } from "@/components/ui/button";

const meta = {
	title: "Components/GuideCard",
	component: GuideCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof GuideCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: <Button>ホバーしてください</Button>,
		content: (
			<div className="p-2">
				<h4 className="font-semibold">ガイド</h4>
				<p>このボタンは重要な機能です。</p>
			</div>
		),
	},
};

export const WithAlignment: Story = {
	args: {
		children: <Button>位置調整</Button>,
		content: <p>右寄せのガイド</p>,
		align: "end",
		sideOffset: 10,
	},
};

export const WithRichContent: Story = {
	args: {
		children: <Button>詳細ガイド</Button>,
		content: (
			<div className="p-4 space-y-2">
				<h4 className="text-lg font-bold">機能の使い方</h4>
				<ul className="list-disc list-inside">
					<li>ステップ1: ボタンをクリック</li>
					<li>ステップ2: 設定を確認</li>
					<li>ステップ3: 完了</li>
				</ul>
			</div>
		),
	},
};
