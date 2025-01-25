"use client";

import { useAtom } from "jotai";
import {
	telegramDialogAtom,
	telegramsActionsAtom,
	filteredAndSortedTelegramsAtom,
} from "@/atoms/telegrams";
import { useTelegrams } from "@/hooks/useTelegrams";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { KoudenEntry } from "@/types/kouden";
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
import { useState, useEffect } from "react";

import { TelegramBulkActions } from "./telegram-bulk-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { TelegramActions } from "./telegram-actions";

interface TelegramsTableProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
}

export function TelegramsTable({
	koudenId,
	koudenEntries,
}: TelegramsTableProps) {
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [, setDialogState] = useAtom(telegramDialogAtom);
	const [, dispatch] = useAtom(telegramsActionsAtom);
	const [telegrams] = useAtom(filteredAndSortedTelegramsAtom);
	const { deleteTelegram } = useTelegrams(koudenId);

	console.log("TelegramsTable - telegrams:", telegrams);
	console.log("TelegramsTable - telegrams length:", telegrams?.length);
	console.log("TelegramsTable - first telegram:", telegrams?.[0]);

	useEffect(() => {
		console.log("TelegramsTable - telegrams updated:", telegrams);
	}, [telegrams]);

	const getEntryName = (entryId: string | null | undefined) => {
		if (!entryId) return "-";
		const entry = koudenEntries.find((entry) => entry.id === entryId);
		return entry ? entry.name : "-";
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteTelegram(id);
			dispatch({ type: "delete", payload: id });
			setDeleteTarget(null);
		} catch (error) {
			console.error("弔電の削除に失敗しました:", error);
		}
	};

	return (
		<>
			<div className="space-y-4">
				<TelegramBulkActions koudenId={koudenId} selectedIds={selectedIds} />
				<div className="border rounded-md overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-[40px]">
									<Checkbox
										checked={
											selectedIds.size === telegrams.length &&
											telegrams.length > 0
										}
										onCheckedChange={() => {
											if (selectedIds.size === telegrams.length) {
												setSelectedIds(new Set());
											} else {
												setSelectedIds(new Set(telegrams.map((t) => t.id)));
											}
										}}
										aria-label="全て選択"
									/>
								</TableHead>
								<TableHead>差出人</TableHead>
								<TableHead>所属</TableHead>
								<TableHead>役職</TableHead>
								<TableHead>関連する香典</TableHead>
								<TableHead>メッセージ</TableHead>
								<TableHead>備考</TableHead>
								<TableHead className="w-[100px]">操作</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{telegrams.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} className="text-center h-24">
										弔電が登録されていません
									</TableCell>
								</TableRow>
							) : (
								telegrams.map((telegram) => {
									console.log("Mapping telegram:", telegram);
									return (
										<TableRow key={telegram.id}>
											<TableCell className="w-[40px]">
												<Checkbox
													checked={selectedIds.has(telegram.id)}
													onCheckedChange={(checked) => {
														if (checked) {
															setSelectedIds(
																new Set([...selectedIds, telegram.id]),
															);
														} else {
															const newSelectedIds = new Set(selectedIds);
															newSelectedIds.delete(telegram.id);
															setSelectedIds(newSelectedIds);
														}
													}}
													aria-label="選択"
												/>
											</TableCell>
											<TableCell>{telegram.senderName || "-"}</TableCell>
											<TableCell>
												{telegram.senderOrganization || "-"}
											</TableCell>
											<TableCell>{telegram.senderPosition || "-"}</TableCell>
											<TableCell>
												{getEntryName(telegram.koudenEntryId)}
											</TableCell>
											<TableCell>{telegram.message || "-"}</TableCell>
											<TableCell>{telegram.notes || "-"}</TableCell>
											<TableCell>
												<TelegramActions
													telegram={telegram}
													koudenId={koudenId}
												/>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}
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
							onClick={() => deleteTarget && handleDelete(deleteTarget)}
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
