import type { Meta, StoryObj } from "@storybook/react";
import { BackLink } from "./back-link";

const meta = {
	title: "Components/BackLink",
	component: BackLink,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof BackLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "戻る",
	},
};

export const CustomLabel: Story = {
	args: {
		label: "前のページへ",
	},
};
