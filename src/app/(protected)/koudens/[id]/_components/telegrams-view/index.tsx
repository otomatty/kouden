import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TelegramsTable } from "./telegrams-table";
import { TelegramDialog } from "./telegram-dialog";
import type { KoudenEntry } from "@/types/kouden";
import type { Telegram } from "@/types/telegram";

interface TelegramsViewProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
	telegrams: Telegram[];
	createTelegram: (input: {
		koudenId: string;
		koudenEntryId?: string;
		senderName: string;
		senderOrganization?: string;
		senderPosition?: string;
		message?: string;
		notes?: string;
	}) => Promise<Telegram>;
	updateTelegram: (
		id: string,
		input: {
			koudenId: string;
			senderName: string;
			koudenEntryId?: string;
			senderOrganization?: string;
			senderPosition?: string;
			message?: string;
			notes?: string;
		},
	) => Promise<Telegram>;
	deleteTelegram: (id: string) => Promise<void>;
}

export function TelegramsView({
	koudenId,
	koudenEntries,
	telegrams,
	createTelegram,
	updateTelegram,
	deleteTelegram,
}: TelegramsViewProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedTelegram, setSelectedTelegram] = useState<Telegram | null>(
		null,
	);

	const handleCreate = async (data: {
		koudenEntryId?: string;
		senderName: string;
		senderOrganization?: string;
		senderPosition?: string;
		message?: string;
		notes?: string;
	}) => {
		await createTelegram({
			koudenId,
			...data,
		});
		setIsDialogOpen(false);
	};

	const handleUpdate = async (data: {
		koudenEntryId?: string;
		senderName: string;
		senderOrganization?: string;
		senderPosition?: string;
		message?: string;
		notes?: string;
	}) => {
		if (!selectedTelegram) return;
		await updateTelegram(selectedTelegram.id, {
			koudenId,
			...data,
		});
		setSelectedTelegram(null);
	};

	const handleDelete = async (id: string) => {
		await deleteTelegram(id);
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">弔電一覧</h2>
				<Button
					onClick={() => {
						setSelectedTelegram(null);
						setIsDialogOpen(true);
					}}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					<span>弔電を追加</span>
				</Button>
			</div>

			<TelegramsTable
				telegrams={telegrams}
				koudenEntries={koudenEntries}
				onEdit={(telegram) => {
					setSelectedTelegram(telegram);
					setIsDialogOpen(true);
				}}
				onDelete={handleDelete}
			/>

			<TelegramDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				koudenEntries={koudenEntries}
				selectedTelegram={selectedTelegram}
				onSubmit={selectedTelegram ? handleUpdate : handleCreate}
			/>
		</div>
	);
}
