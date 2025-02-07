import type { Meta, StoryObj } from "@storybook/react";
import { RoleSelect } from "./RoleSelect";

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
			console.log("Selected value:", value);
		},
	},
};

export const WithPreselectedValue: Story = {
	args: {
		koudenId: "sample-kouden-id",
		value: "role-1",
		onValueChange: (value) => {
			console.log("Selected value:", value);
		},
	},
};

// モック用のデータを設定
const mockRoles = [
	{ id: "role-1", name: "管理者" },
	{ id: "role-2", name: "編集者" },
	{ id: "role-3", name: "閲覧者" },
];

// Supabaseのモックを設定
const mockSupabase = {
	from: () => ({
		select: () => ({
			eq: () => ({
				order: () => ({
					data: mockRoles,
					error: null,
				}),
			}),
		}),
	}),
};

// モックを適用
jest.mock("@/lib/supabase/client", () => ({
	createClient: () => mockSupabase,
}));
