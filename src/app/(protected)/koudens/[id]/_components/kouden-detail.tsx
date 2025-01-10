"use client";

import { useState } from "react";
import { KoudenEntrySpreadsheet } from "./spreadsheet/kouden-entry-spreadsheet";
import { ExportExcelButton } from "./export-excel-button";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import type { Database } from "@/types/supabase";
import type { KoudenEntry } from "@/types/kouden";
import type {
	CreateKoudenEntryInput,
	UpdateKoudenEntryInput,
	KoudenEntryResponse,
	CreateOfferingInput,
	UpdateOfferingInput,
	OfferingResponse,
	CreateReturnItemInput,
	UpdateReturnItemInput,
	ReturnItemResponse,
} from "@/types/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

interface KoudenDetailProps {
	kouden: Kouden;
	entries: KoudenEntry[];
	createKoudenEntry: (
		input: CreateKoudenEntryInput,
	) => Promise<KoudenEntryResponse>;
	updateKoudenEntry: (
		id: string,
		input: UpdateKoudenEntryInput,
	) => Promise<KoudenEntryResponse>;
	deleteKoudenEntry: (id: string, koudenId: string) => Promise<void>;
	createOffering: (input: CreateOfferingInput) => Promise<OfferingResponse>;
	updateOffering: (
		id: string,
		input: UpdateOfferingInput,
	) => Promise<OfferingResponse>;
	deleteOffering: (id: string, koudenEntryId: string) => Promise<void>;
	createReturnItem: (
		input: CreateReturnItemInput,
	) => Promise<ReturnItemResponse>;
	updateReturnItem: (
		id: string,
		input: UpdateReturnItemInput,
	) => Promise<ReturnItemResponse>;
	deleteReturnItem: (id: string, koudenEntryId: string) => Promise<void>;
	updateKouden: (
		id: string,
		input: { title: string; description?: string },
	) => Promise<void>;
	deleteKouden: (id: string) => Promise<void>;
}

export function KoudenDetail({
	kouden,
	entries,
	createKoudenEntry,
	updateKoudenEntry,
	deleteKoudenEntry,
	createOffering,
	updateOffering,
	deleteOffering,
	createReturnItem,
	updateReturnItem,
	deleteReturnItem,
	updateKouden,
	deleteKouden,
}: KoudenDetailProps) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState(kouden.title);
	const [description, setDescription] = useState(kouden.description || "");

	const handleSave = async () => {
		try {
			await updateKouden(kouden.id, {
				title,
				description: description || undefined,
			});
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to update kouden:", error);
		}
	};

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-start">
				<div className="space-y-2 flex-1 mr-4">
					{isEditing ? (
						<div className="space-y-4">
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="text-2xl font-bold"
							/>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="説明を入力"
								className="resize-none"
								rows={3}
							/>
							<div className="flex gap-2">
								<Button size="sm" onClick={handleSave}>
									保存
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setTitle(kouden.title);
										setDescription(kouden.description || "");
										setIsEditing(false);
									}}
								>
									キャンセル
								</Button>
							</div>
						</div>
					) : (
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-2xl font-bold">{kouden.title}</h2>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setIsEditing(true)}
									className="h-8 w-8"
								>
									<Pencil className="h-4 w-4" />
								</Button>
							</div>
							{kouden.description && (
								<p className="text-gray-500 mt-2">{kouden.description}</p>
							)}
						</div>
					)}
				</div>
				<div className="flex items-center gap-2">
					<DeleteKoudenDialog
						koudenId={kouden.id}
						koudenTitle={kouden.title}
						onDelete={deleteKouden}
					/>
					<ExportExcelButton koudenId={kouden.id} />
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push("/koudens")}
						className="flex items-center gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>一覧に戻る</span>
					</Button>
				</div>
			</div>

			<KoudenEntrySpreadsheet
				entries={entries}
				koudenId={kouden.id}
				updateKoudenEntry={updateKoudenEntry}
				createKoudenEntry={createKoudenEntry}
				deleteKoudenEntries={async (ids) => {
					await Promise.all(ids.map((id) => deleteKoudenEntry(id, kouden.id)));
				}}
			/>
		</div>
	);
}
