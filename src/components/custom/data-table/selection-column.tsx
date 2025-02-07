import { Checkbox } from "@/components/ui/checkbox";
import type { Table, Row } from "@tanstack/react-table";
import type { KoudenPermission } from "@/types/role";
import { canUpdateKouden } from "@/store/permission";

interface SelectionColumnProps<TData> {
	table: Table<TData>;
	row?: Row<TData>;
	permission?: KoudenPermission;
	showSelection?: boolean;
}

/**
 * テーブルの行選択を管理するコンポーネント
 * @param table - テーブルインスタンス
 * @param row - 行データ（セル用）
 * @param permission - ユーザーの権限
 * @param showSelection - 選択機能の表示制御（デフォルトtrue）
 */
export function SelectionColumn<TData>({
	table,
	row,
	permission = "viewer",
	showSelection = true,
}: SelectionColumnProps<TData>) {
	// 権限チェック
	const canEdit = permission ? canUpdateKouden(permission) : false;

	// 選択機能を表示しない場合、または編集権限がない場合は null を返す
	if (showSelection || canEdit) {
		return null;
	}

	// ヘッダー用のチェックボックス（全選択）
	if (!row) {
		return (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="全選択"
			/>
		);
	}

	// 行用のチェックボックス
	return (
		<Checkbox
			checked={row.getIsSelected()}
			onCheckedChange={(value) => row.toggleSelected(!!value)}
			aria-label="行を選択"
		/>
	);
}
