/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "./index";
import type { ColumnDef } from "@tanstack/react-table";
import { vi } from "vitest";

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
];

describe("DataTable", () => {
	it("renders table headers correctly", () => {
		render(<DataTable columns={columns} data={sampleData} permission="viewer" />);
		expect(screen.getByText("ID")).toBeInTheDocument();
		expect(screen.getByText("名前")).toBeInTheDocument();
		expect(screen.getByText("年齢")).toBeInTheDocument();
		expect(screen.getByText("ステータス")).toBeInTheDocument();
	});

	it("renders data correctly", () => {
		render(<DataTable columns={columns} data={sampleData} permission="viewer" />);
		expect(screen.getByText("山田太郎")).toBeInTheDocument();
		expect(screen.getByText("30")).toBeInTheDocument();
		expect(screen.getByText("active")).toBeInTheDocument();
	});

	it("shows empty message when no data", () => {
		const emptyMessage = "データがありません";
		render(
			<DataTable columns={columns} data={[]} emptyMessage={emptyMessage} permission="viewer" />,
		);
		expect(screen.getByText(emptyMessage)).toBeInTheDocument();
	});

	it("handles editable cells correctly", () => {
		const onCellEdit = vi.fn();
		render(
			<DataTable
				columns={columns}
				data={sampleData}
				editableColumns={{
					name: { type: "text" },
				}}
				permission="editor"
				onCellEdit={onCellEdit}
			/>,
		);

		// 編集可能なセルをクリックして編集モードに入る
		const cell = screen.getByText("山田太郎");
		fireEvent.click(cell);

		// 入力を変更
		const input = screen.getByDisplayValue("山田太郎");
		fireEvent.change(input, { target: { value: "新しい名前" } });
		fireEvent.blur(input);

		// onCellEditが正しく呼び出されたことを確認
		expect(onCellEdit).toHaveBeenCalledWith("name", "0", "新しい名前");
	});

	it("handles row selection correctly", () => {
		const onRowSelectionChange = vi.fn();
		render(
			<DataTable
				columns={columns}
				data={sampleData}
				permission="viewer"
				rowSelection={{}}
				onRowSelectionChange={onRowSelectionChange}
			/>,
		);

		// 最初の行のチェックボックスをクリック
		const checkboxes = screen.getAllByRole("checkbox");
		expect(checkboxes.length).toBeGreaterThan(1);
		if (checkboxes[1]) {
			fireEvent.click(checkboxes[1]);
		}

		// onRowSelectionChangeが正しく呼び出されたことを確認
		expect(onRowSelectionChange).toHaveBeenCalled();
	});
});
