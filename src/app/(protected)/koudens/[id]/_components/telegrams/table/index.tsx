"use client";

import * as React from "react";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import type { Telegram } from "@/types/telegram";
import type { KoudenPermission } from "@/types/role";
import { TelegramDialog } from "../dialog";
import { toast } from "@/hooks/use-toast";
import { useTelegrams } from "@/hooks/useTelegrams";
import type { KoudenEntry } from "@/types/kouden";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TelegramTableProps {
	telegrams: Telegram[];
	permission?: KoudenPermission;
	koudenId: string;
	koudenEntries: KoudenEntry[];
}

export function TelegramTable({
	telegrams,
	permission,
	koudenId,
	koudenEntries,
}: TelegramTableProps) {
	const [editingTelegram, setEditingTelegram] = React.useState<Telegram | null>(
		null,
	);

	const { state, updateTelegram, deleteTelegram } = useTelegrams(koudenId);

	const isTablet = useMediaQuery("(max-width: 1024px)");

	// 弔電の更新
	const handleUpdate = async (id: string, data: Partial<Telegram>) => {
		try {
			// nullをundefinedに変換
			const sanitizedData = Object.fromEntries(
				Object.entries(data).map(([key, value]) => [
					key,
					value === null ? undefined : value,
				]),
			);

			await updateTelegram(id, {
				...sanitizedData,
				senderName: sanitizedData.sender_name as string,
				senderOrganization: sanitizedData.sender_organization as
					| string
					| undefined,
				senderPosition: sanitizedData.sender_position as string | undefined,
				notes: sanitizedData.notes as string | undefined,
			});

			toast({
				title: "更新完了",
				description: "データを更新しました",
			});
		} catch (error) {
			console.error("Failed to update telegram:", error);
			toast({
				title: "エラーが発生しました",
				description:
					typeof error === "string" ? error : "データの更新に失敗しました",
				variant: "destructive",
			});
		}
	};

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
				permission,
				koudenEntries,
			}),
		[permission, handleDelete, koudenEntries],
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
				permission={permission}
				koudenId={koudenId}
				koudenEntries={koudenEntries}
			/>
			{editingTelegram && !isTablet && (
				<TelegramDialog koudenId={koudenId} koudenEntries={koudenEntries} />
			)}
		</>
	);
}
