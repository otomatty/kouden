import type { Meta, StoryObj } from "@storybook/react";
import { LoadingScreen } from "./loading-screen";

const meta = {
	title: "Components/LoadingScreen",
	component: LoadingScreen,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof LoadingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleHints = [
	{ id: "1", text: "データを読み込んでいます..." },
	{ id: "2", text: "もう少しお待ちください..." },
	{ id: "3", text: "準備中です..." },
];

export const Default: Story = {
	args: {
		title: "読み込み中",
		hints: sampleHints,
		onLoadingComplete: () => {
			console.log("Loading complete!");
		},
	},
};

export const CustomTitle: Story = {
	args: {
		title: "データを処理しています",
		hints: sampleHints,
	},
};

export const SingleHint: Story = {
	args: {
		title: "読み込み中",
		hints: [{ id: "1", text: "データを読み込んでいます..." }],
	},
};
