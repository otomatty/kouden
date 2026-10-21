"use client";

import { usePathname } from "next/navigation";
import { CreateButton } from "./create-button";
import { EntryDialog } from "../../entries/_components/dialog/entry-dialog";
import { OfferingDialog } from "../../offerings/_components/dialog/offering-dialog";
import { TelegramDialog } from "../../telegrams/_components/dialog/telegram-dialog";
import Link from "next/link";

import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";

interface CreateButtonContainerProps {
	koudenId: string;
	entries: Entry[];
	relationships: Relationship[];
	onEntryCreated?: (entry: Entry) => void;
}

/**
 * 新規作成ボタンとダイアログの制御を行うコンテナコンポーネント
 * - 現在のパスに基づいて適切なダイアログを表示
 * - CreateButtonをトリガーとして使用
 */
export function CreateButtonContainer({
	koudenId,
	entries,
	relationships,
	onEntryCreated,
}: CreateButtonContainerProps) {
	const pathname = usePathname();
	const segment = pathname.split("/").pop();

	const renderDialog = () => {
		switch (segment) {
			case "entries":
				return (
					<div data-tour="add-entry-button">
						<EntryDialog
							variant="create"
							koudenId={koudenId}
							relationships={relationships}
							defaultValues={undefined}
							onSuccess={onEntryCreated}
							trigger={<CreateButton />}
						/>
					</div>
				);
			case "offerings":
				return (
					<OfferingDialog
						variant="create"
						koudenId={koudenId}
						entries={entries}
						trigger={<CreateButton />}
					/>
				);
			case "telegrams":
				return <TelegramDialog koudenId={koudenId} entries={entries} trigger={<CreateButton />} />;
			case "koudens":
				return (
					<Link href="/koudens/new">
						<CreateButton />
					</Link>
				);
			default:
				return null;
		}
	};

	return renderDialog();
}
