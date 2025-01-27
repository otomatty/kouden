"use client";

import { useAtom, useSetAtom } from "jotai";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Relationship } from "@/types/kouden";
import { entryFormAtom, updateEntryFormAtom } from "@/store/entries";

interface EntryFormAdditionalProps {
	relationships: Relationship[];
}

export function EntryFormAdditional({
	relationships,
}: EntryFormAdditionalProps) {
	const [formData] = useAtom(entryFormAtom);
	const updateForm = useSetAtom(updateEntryFormAtom);

	return (
		<div className="grid gap-4">
			<div className="grid gap-2">
				<Label htmlFor="phone_number">電話番号</Label>
				<Input
					id="phone_number"
					value={formData.phone_number || ""}
					onChange={(e) =>
						updateForm({ field: "phone_number", value: e.target.value })
					}
					placeholder="000-0000-0000"
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="relationship_id">ご関係</Label>
				<Select
					value={formData.relationship_id || ""}
					onValueChange={(value) =>
						updateForm({
							field: "relationship_id",
							value: value === "none" ? null : value,
						})
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="関係性を選択" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">未選択</SelectItem>
						{relationships?.map((relationship) => (
							<SelectItem key={relationship.id} value={relationship.id}>
								{relationship.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="has_offering">供物</Label>
				<Select
					value={String(formData.has_offering)}
					onValueChange={(value) =>
						updateForm({ field: "has_offering", value: value === "true" })
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="true">あり</SelectItem>
						<SelectItem value="false">なし</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="is_return_completed">返礼</Label>
				<Select
					value={String(formData.is_return_completed)}
					onValueChange={(value) =>
						updateForm({
							field: "is_return_completed",
							value: value === "true",
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="true">完了</SelectItem>
						<SelectItem value="false">未完了</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="notes">備考</Label>
				<Input
					id="notes"
					value={formData.notes || ""}
					onChange={(e) =>
						updateForm({ field: "notes", value: e.target.value })
					}
				/>
			</div>
		</div>
	);
}
