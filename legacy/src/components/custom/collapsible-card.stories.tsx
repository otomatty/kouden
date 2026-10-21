import type { Meta, StoryObj } from "@storybook/react";
import { CollapsibleCard } from "./collapsible-card";

const meta = {
	title: "Components/CollapsibleCard",
	component: CollapsibleCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof CollapsibleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "設定",
		description: "この設定は重要な機能です。",
		children: (
			<div className="space-y-4">
				<p>設定内容がここに表示されます。</p>
				<p>複数行の内容を表示することができます。</p>
			</div>
		),
	},
};

export const WithoutDescription: Story = {
	args: {
		title: "シンプルな設定",
		children: <p>説明文なしのシンプルな設定です。</p>,
	},
};

export const InitiallyClosed: Story = {
	args: {
		title: "閉じた状態",
		description: "初期状態で閉じています。",
		defaultOpen: false,
		children: <p>開くと内容が表示されます。</p>,
	},
};
