"use client";

import { useState } from "react";
import { KoudenEntryTable } from "./kouden-entry-table";
import { KoudenStatistics } from "./kouden-statistics";
import { ExportExcelButton } from "./export-excel-button";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import type { Database } from "@/types/supabase";
import type { KoudenEntry } from "@/types/kouden";
import type { AttendanceType } from "./data-table/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfferingTable } from "./offering-table";
import { TelegramTable } from "./telegram-table";
import { ReturnItemTable } from "./return-item-table";
import { MemberTable } from "./member-table";

type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

interface KoudenDetailProps {
	kouden: Kouden;
	entries: KoudenEntry[];
	createKoudenEntry: (input: {
		kouden_id: string;
		name?: string | null;
		organization?: string | null;
		position?: string | null;
		amount: number;
		postal_code?: string | null;
		address: string | null;
		phone_number?: string | null;
		attendance_type: "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT" | null;
		has_offering: boolean;
		is_return_completed: boolean;
		notes?: string | null;
		relationship_id?: string | null;
	}) => Promise<KoudenEntryResponse>;
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
	updateKouden,
	deleteKouden,
}: KoudenDetailProps) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState(kouden.title);
	const [description, setDescription] = useState(kouden.description || "");
	const [viewMode, setViewMode] = useState<
		| "table"
		| "statistics"
		| "offerings"
		| "telegrams"
		| "return-items"
		| "members"
	>("table");

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
			<Button
				variant="ghost"
				onClick={() => router.push("/koudens")}
				className="flex items-center gap-2"
			>
				<ArrowLeft className="h-4 w-4" />
				<span>一覧に戻る</span>
			</Button>

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
					<ExportExcelButton koudenId={kouden.id} />
					<DeleteKoudenDialog
						koudenId={kouden.id}
						koudenTitle={kouden.title}
						onDelete={deleteKouden}
					/>
				</div>
			</div>

			<Tabs
				value={viewMode}
				onValueChange={(value) => setViewMode(value as typeof viewMode)}
			>
				<TabsList>
					<TabsTrigger value="table">香典帳</TabsTrigger>
					<TabsTrigger value="offerings">お供物</TabsTrigger>
					<TabsTrigger value="telegrams">弔電</TabsTrigger>
					<TabsTrigger value="return-items">返礼品</TabsTrigger>
					<TabsTrigger value="statistics">統計</TabsTrigger>
					<TabsTrigger value="members">メンバー</TabsTrigger>
				</TabsList>

				<TabsContent value="table">
					<KoudenEntryTable
						entries={entries.map((entry) => ({
							...entry,
							attendance_type: entry.attendance_type as AttendanceType,
						}))}
						koudenId={kouden.id}
						updateKoudenEntry={async (id, data) => {
							const input = {
								...data,
								address: data.address ?? null,
								attendance_type:
									data.attendance_type === "ABSENT"
										? null
										: data.attendance_type,
							};
							try {
								const response = await updateKoudenEntry(id, input);
								return {
									...response,
									attendance_type: response.attendance_type as AttendanceType,
								};
							} catch (error) {
								console.error("更新エラー:", error);
								throw error;
							}
						}}
						createKoudenEntry={async (data) => {
							const input = {
								...data,
								name: data.name ?? null,
								address: data.address ?? null,
								attendance_type:
									data.attendance_type === "ABSENT"
										? null
										: data.attendance_type,
							};
							try {
								const response = await createKoudenEntry(input);
								return {
									...response,
									attendance_type: response.attendance_type as AttendanceType,
								};
							} catch (error) {
								console.error("作成エラー:", error);
								throw error;
							}
						}}
						deleteKoudenEntries={async (ids) => {
							await Promise.all(
								ids.map((id) => deleteKoudenEntry(id, kouden.id)),
							);
						}}
					/>
				</TabsContent>
				<TabsContent value="offerings">
					<OfferingTable koudenId={kouden.id} />
				</TabsContent>
				<TabsContent value="telegrams">
					<TelegramTable koudenId={kouden.id} />
				</TabsContent>
				<TabsContent value="return-items">
					<ReturnItemTable koudenId={kouden.id} />
				</TabsContent>
				<TabsContent value="statistics">
					<KoudenStatistics entries={entries} />
				</TabsContent>
				<TabsContent value="members">
					<MemberTable koudenId={kouden.id} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
