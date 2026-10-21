import type { Meta, StoryObj } from "@storybook/react";
import { RoleSelect } from "./role-select";

const meta = {
	title: "Components/RoleSelect",
	component: RoleSelect,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof RoleSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		koudenId: "sample-kouden-id",
		value: "",
		onValueChange: (value) => {
			// biome-ignore lint/suspicious/noConsoleLog: テスト用
			console.log("Selected value:", value);
		},
	},
};

export const WithPreselectedValue: Story = {
	args: {
		koudenId: "sample-kouden-id",
		value: "role-1",
		onValueChange: (value) => {
			// biome-ignore lint/suspicious/noConsoleLog: テスト用
			console.log("Selected value:", value);
		},
	},
};
