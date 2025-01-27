"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { DataTable } from "./table/data-table";
import { createColumns } from "./table/columns";
import { useTelegrams } from "@/hooks/useTelegrams";
import type { Telegram } from "@/types/telegram";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MobileFilters } from "./card-list/mobile-filters";
import { TelegramCard } from "./card-list/telegram-card";
import {
	telegramsAtom,
	telegramFilterTextAtom,
	telegramSortStateAtom,
	updateTelegramAtom,
	deleteTelegramAtom,
	deleteDialogAtom,
} from "@/store/telegrams";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { KoudenPermission } from "@/types/role";
import type { KoudenEntry } from "@/types/kouden";

interface TelegramsViewProps {
	telegrams: Telegram[];
	koudenId: string;
	permission: KoudenPermission;
	koudenEntries: KoudenEntry[];
}

export function TelegramsView({
	telegrams,
	koudenId,
	permission,
	koudenEntries,
}: TelegramsViewProps) {
	const [storedTelegrams, setTelegrams] = useAtom(telegramsAtom);
	const [filterText, setFilterText] = useAtom(telegramFilterTextAtom);
	const [sortState, setSortState] = useAtom(telegramSortStateAtom);
	const [, setUpdateTelegram] = useAtom(updateTelegramAtom);
	const [, setDeleteTelegram] = useAtom(deleteTelegramAtom);
	const [deleteDialog, setDeleteDialog] = useAtom(deleteDialogAtom);

	const { deleteTelegram, updateTelegram } = useTelegrams(koudenId);

	// 初期データをセット
	useEffect(() => {
		if (telegrams) {
			setTelegrams(telegrams);
		}
	}, [telegrams, setTelegrams]);

	// モバイルビューかどうかを判定
	const isMobile = useMediaQuery("(max-width: 767px)");

	// updateTelegramAtomを設定
	useEffect(() => {
		setUpdateTelegram(() => updateTelegram);
		setDeleteTelegram(() => async (ids: string[]) => {
			console.log("handleDeleteSelectedRows called with ids:", ids);
			try {
				for (const id of ids) {
					console.log("Attempting to delete telegram with id:", id);
					await deleteTelegram(id);
					console.log("Telegram deleted successfully:", id);
				}
			} catch (error) {
				console.error("Error in handleDeleteSelectedRows:", error);
			}
		});
	}, [updateTelegram, setUpdateTelegram, deleteTelegram, setDeleteTelegram]);

	const handleDeleteSelectedRows = async (ids: string[]) => {
		console.log("handleDeleteSelectedRows called with ids:", ids);
		try {
			for (const id of ids) {
				console.log("Attempting to delete telegram with id:", id);
				await deleteTelegram(id);
				console.log("Telegram deleted successfully:", id);
			}
		} catch (error) {
			console.error("Error in handleDeleteSelectedRows:", error);
		}
	};

	const columns = createColumns({
		onEditRow: async (telegram: Telegram) => {
			console.log("onEditRow called with telegram:", telegram);
			const { id, createdAt, updatedAt, ...rest } = telegram;
			const data = {
				senderName: rest.senderName,
				senderOrganization: rest.senderOrganization || undefined,
				senderPosition: rest.senderPosition || undefined,
				message: rest.message || undefined,
				notes: rest.notes || undefined,
				koudenEntryId: rest.koudenEntryId || undefined,
			};
			console.log("Prepared update data:", data);
			await updateTelegram(id, data);
		},
		onDeleteRows: handleDeleteSelectedRows,
		selectedRows: [],
		koudenEntries,
		permission,
	});

	const table = useReactTable({
		data: storedTelegrams,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			globalFilter: filterText,
			sorting: [{ id: sortState.field, desc: sortState.direction === "desc" }],
		},
	});

	return (
		<>
			{isMobile ? (
				<div className="flex flex-col h-[100vh]">
					<MobileFilters
						table={table}
						searchQuery={filterText}
						onSearchChange={setFilterText}
						searchField="senderName"
						onSearchFieldChange={(value) => setFilterText(value)}
						sortOrder={`${sortState.field}_${sortState.direction}`}
						onSortOrderChange={(value) => {
							const [field, direction] = value.split("_");
							setSortState({
								field: field as keyof Telegram,
								direction: direction as "asc" | "desc",
							});
						}}
					/>
					<div className="flex-1 overflow-auto">
						<div className="space-y-2 py-4">
							{storedTelegrams.map((telegram) => (
								<TelegramCard
									key={telegram.id}
									telegram={telegram}
									onDelete={async () => {
										await handleDeleteSelectedRows([telegram.id]);
									}}
								/>
							))}
							{storedTelegrams.length === 0 && (
								<div className="text-center py-8 text-muted-foreground">
									データがありません
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={storedTelegrams}
					koudenId={koudenId}
					koudenEntries={koudenEntries}
					permission={permission}
				/>
			)}

			<AlertDialog
				open={deleteDialog.isOpen}
				onOpenChange={(isOpen) => setDeleteDialog({ isOpen, telegramId: null })}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>弔電を削除</AlertDialogTitle>
						<AlertDialogDescription>
							この弔電を削除してもよろしいですか？この操作は取り消せません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							onClick={async () => {
								if (deleteDialog.telegramId) {
									await handleDeleteSelectedRows([deleteDialog.telegramId]);
									setDeleteDialog({ isOpen: false, telegramId: null });
								}
							}}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							削除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
