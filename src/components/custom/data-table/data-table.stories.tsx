import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./index";
import type { ColumnDef } from "@tanstack/react-table";

interface TestData {
	id: string;
	name: string;
	age: number;
	status: "active" | "inactive";
}

const columns: ColumnDef<TestData>[] = [
	{
		accessorKey: "id",
		header: "ID",
	},
	{
		accessorKey: "name",
		header: "名前",
	},
	{
		accessorKey: "age",
		header: "年齢",
	},
	{
		accessorKey: "status",
		header: "ステータス",
	},
];

const sampleData: TestData[] = [
	{ id: "1", name: "山田太郎", age: 30, status: "active" },
	{ id: "2", name: "鈴木花子", age: 25, status: "inactive" },
	{ id: "3", name: "佐藤一郎", age: 35, status: "active" },
];

const meta = {
	title: "Components/DataTable",
	component: DataTable,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof DataTable<TestData>>;

export const Default: Story = {
	args: {
		columns,
		data: sampleData,
		permission: "viewer",
	},
};

export const Editable: Story = {
	args: {
		columns,
		data: sampleData,
		editableColumns: {
			name: { type: "text" },
			age: { type: "number" },
			status: {
				type: "select",
				options: [
					{ value: "active", label: "アクティブ" },
					{ value: "inactive", label: "非アクティブ" },
				],
			},
		},
		permission: "editor",
		onCellEdit: async (columnId, rowId, newValue) => {
			console.log(`Cell edited: ${columnId}, ${rowId}, ${newValue}`);
		},
	},
};

export const Empty: Story = {
	args: {
		columns,
		data: [],
		emptyMessage: "データが存在しません",
		permission: "viewer",
	},
};

export const WithSelection: Story = {
	args: {
		columns,
		data: sampleData,
		rowSelection: {},
		permission: "viewer",
		onRowSelectionChange: (selection) => {
			console.log("Selection changed:", selection);
		},
	},
};
