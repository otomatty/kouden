"use client";

import * as React from "react";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import type { Telegram } from "@/types/telegram";
import { toast } from "@/hooks/use-toast";
import { useTelegrams } from "@/hooks/useTelegrams";
import type { KoudenEntry } from "@/types/kouden";

interface TelegramTableProps {
	telegrams: Telegram[];
	koudenId: string;
	koudenEntries: KoudenEntry[];
}

export function TelegramTable({
	telegrams,
	koudenId,
	koudenEntries,
}: TelegramTableProps) {
	const [editingTelegram, setEditingTelegram] = React.useState<Telegram | null>(
		null,
	);

	const { state, deleteTelegram } = useTelegrams(koudenId);

	// 弔電の削除
	const handleDelete = React.useCallback(
		async (ids: string[]) => {
			try {
				await Promise.all(ids.map((id) => deleteTelegram(id)));
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
			} catch (error) {
				console.error("Failed to delete telegrams:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[deleteTelegram],
	);

	const columns = React.useMemo(
		() =>
			createColumns({
				onEditRow: async (telegram) => {
					setEditingTelegram(telegram);
					return Promise.resolve();
				},
				onDeleteRows: handleDelete,
				selectedRows: [],
				koudenEntries,
			}),
		[handleDelete, koudenEntries],
	);

	if (state.error) {
		toast({
			title: "エラーが発生しました",
			description:
				typeof state.error === "string"
					? state.error
					: "データの操作に失敗しました",
			variant: "destructive",
		});
	}

	return (
		<>
			<DataTable
				columns={columns}
				data={telegrams}
				koudenId={koudenId}
				koudenEntries={koudenEntries}
			/>
		</>
	);
}
