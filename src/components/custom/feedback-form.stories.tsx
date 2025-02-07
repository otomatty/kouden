import type { Meta, StoryObj } from "@storybook/react";
import { FeedbackForm } from "./feedback-form";

// sendFeedbackアクションをモック化
const mockSendFeedback = async () => {
	// 成功をシミュレート
	return { success: true };
};

const meta = {
	title: "Components/FeedbackForm",
	component: FeedbackForm,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof FeedbackForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		sendFeedback: mockSendFeedback,
	},
};

export const WithError: Story = {
	args: {
		sendFeedback: async () => {
			// エラーをシミュレート
			throw new Error("送信に失敗しました");
		},
	},
};

export const WithLoading: Story = {
	args: {
		sendFeedback: async () => {
			// ローディング状態をシミュレート
			await new Promise((resolve) => setTimeout(resolve, 2000));
			return { success: true };
		},
	},
};
