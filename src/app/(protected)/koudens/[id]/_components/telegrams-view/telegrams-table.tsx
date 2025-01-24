import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import type { KoudenEntry } from "@/types/kouden";
import type { Telegram } from "@/types/telegram";

interface TelegramsTableProps {
	telegrams: Telegram[];
	koudenEntries: KoudenEntry[];
	onEdit: (telegram: Telegram) => void;
	onDelete: (id: string) => Promise<void>;
}

export function TelegramsTable({
	telegrams,
	koudenEntries,
	onEdit,
	onDelete,
}: TelegramsTableProps) {
	const getEntryName = (entryId?: string) => {
		if (!entryId) return "-";
		const entry = koudenEntries.find((entry) => entry.id === entryId);
		return entry ? entry.name : "-";
	};

	return (
		<div className="border rounded-md">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>送信者名</TableHead>
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
							<TableCell colSpan={7} className="text-center h-24">
								弔電が登録されていません
							</TableCell>
						</TableRow>
					) : (
						telegrams.map((telegram) => (
							<TableRow key={telegram.id}>
								<TableCell>{telegram.senderName}</TableCell>
								<TableCell>{telegram.senderOrganization || "-"}</TableCell>
								<TableCell>{telegram.senderPosition || "-"}</TableCell>
								<TableCell>{getEntryName(telegram.koudenEntryId)}</TableCell>
								<TableCell className="max-w-[200px] truncate">
									{telegram.message || "-"}
								</TableCell>
								<TableCell className="max-w-[200px] truncate">
									{telegram.notes || "-"}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onEdit(telegram)}
										>
											<Edit2 className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onDelete(telegram.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
