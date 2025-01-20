"use client";

import { useState, useEffect } from "react";
import { KoudenEntryTable } from "./entry-table";
import { KoudenStatistics } from "./kouden-statistics";
import { ExportExcelButton } from "./export-excel-button";
import { DeleteKoudenDialog } from "./delete-kouden-dialog";
import { DuplicateKoudenButton } from "./duplicate-kouden-button";
import type { Database } from "@/types/supabase";
import type { KoudenEntry } from "@/types/kouden";
import type { AttendanceType } from "./entry-table/types";
import type { KoudenPermission } from "@/app/_actions/koudens";
import { checkKoudenPermission } from "@/app/_actions/koudens";
import type {
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
import {
	ArrowLeft,
	Pencil,
	Table2,
	BarChart3,
	Gift,
	Mail,
	Package,
	Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfferingTable } from "./offering-table";
import { TelegramTable } from "./telegram-table";
import { ReturnItemTable } from "./return-item-table";
import { MemberTable } from "./member-table";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MobileMenu } from "./mobile-menu";
import { cn } from "@/lib/utils";
import { KoudenTitle } from "./kouden-title";

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
	entries: initialEntries,
	createKoudenEntry,
	updateKoudenEntry,
	deleteKoudenEntry,
	updateKouden,
	deleteKouden,
}: KoudenDetailProps) {
	const router = useRouter();
	const [entries, setEntries] = useState(initialEntries);
	const [viewMode, setViewMode] = useState<
		| "table"
		| "statistics"
		| "offerings"
		| "telegrams"
		| "return-items"
		| "members"
	>("table");
	const [permission, setPermission] = useState<KoudenPermission>(null);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	useEffect(() => {
		const checkPermission = async () => {
			const userPermission = await checkKoudenPermission(kouden.id);
			setPermission(userPermission);
		};
		checkPermission();
	}, [kouden.id]);

	return (
		<>
			<div className="space-y-4 py-4">
				<Button
					variant="ghost"
					onClick={() => router.push("/koudens")}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					<span>一覧に戻る</span>
				</Button>
				<div className="flex items-center justify-between">
					<KoudenTitle
						title={kouden.title}
						description={kouden.description}
						permission={permission}
						onUpdate={async (data) => {
							await updateKouden(kouden.id, data);
						}}
					/>
					{/* デスクトップでのみ表示 */}
					{isDesktop && (
						<div className="flex items-center gap-2">
							<ExportExcelButton koudenId={kouden.id} />
							{(permission === "owner" || permission === "editor") && (
								<>
									<DuplicateKoudenButton koudenId={kouden.id} />
									{permission === "owner" && (
										<DeleteKoudenDialog
											koudenId={kouden.id}
											koudenTitle={kouden.title}
											onDelete={deleteKouden}
										/>
									)}
								</>
							)}
						</div>
					)}
				</div>
			</div>

			<Tabs
				value={viewMode}
				onValueChange={(value) => setViewMode(value as typeof viewMode)}
			>
				<TabsList className="max-w-screen-sm">
					<TabsTrigger
						value="table"
						className={cn(
							"flex items-center gap-2",
							!isDesktop && viewMode !== "table" && "sm:px-3",
						)}
					>
						<Table2 className="h-4 w-4" />
						<span
							className={cn(
								isDesktop ? "inline" : "hidden",
								viewMode === "table" && "inline",
							)}
						>
							香典帳
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="offerings"
						className={cn(
							"flex items-center gap-2",
							!isDesktop && viewMode !== "offerings" && "sm:px-3",
						)}
					>
						<Gift className="h-4 w-4" />
						<span
							className={cn(
								isDesktop ? "inline" : "hidden",
								viewMode === "offerings" && "inline",
							)}
						>
							お供物
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="telegrams"
						className={cn(
							"flex items-center gap-2",
							!isDesktop && viewMode !== "telegrams" && "sm:px-3",
						)}
					>
						<Mail className="h-4 w-4" />
						<span
							className={cn(
								isDesktop ? "inline" : "hidden",
								viewMode === "telegrams" && "inline",
							)}
						>
							弔電
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="return-items"
						className={cn(
							"flex items-center gap-2",
							!isDesktop && viewMode !== "return-items" && "sm:px-3",
						)}
					>
						<Package className="h-4 w-4" />
						<span
							className={cn(
								isDesktop ? "inline" : "hidden",
								viewMode === "return-items" && "inline",
							)}
						>
							返礼品
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="statistics"
						className={cn(
							"flex items-center gap-2",
							!isDesktop && viewMode !== "statistics" && "sm:px-3",
						)}
					>
						<BarChart3 className="h-4 w-4" />
						<span
							className={cn(
								isDesktop ? "inline" : "hidden",
								viewMode === "statistics" && "inline",
							)}
						>
							統計
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="members"
						className={cn(
							"flex items-center gap-2",
							!isDesktop && viewMode !== "members" && "sm:px-3",
						)}
					>
						<Users className="h-4 w-4" />
						<span
							className={cn(
								isDesktop ? "inline" : "hidden",
								viewMode === "members" && "inline",
							)}
						>
							メンバー
						</span>
					</TabsTrigger>
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
									attendance_type: (response.attendance_type ||
										"ABSENT") as AttendanceType,
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

			{/* モバイルメニュー */}
			{!isDesktop && (
				<MobileMenu
					koudenId={kouden.id}
					koudenTitle={kouden.title}
					permission={permission}
					onDelete={deleteKouden}
					onAddEntry={async (data) => {
						console.log("KoudenDetail: Creating new entry", data);
						const response = await createKoudenEntry({
							...data,
							kouden_id: kouden.id,
						});
						console.log("KoudenDetail: Entry created", response);

						// 新しいエントリーをステートに追加
						setEntries((prev) => [
							{
								...response,
								attendance_type: (response.attendance_type ||
									"ABSENT") as AttendanceType,
							} as KoudenEntry,
							...prev,
						]);

						return {
							...response,
							attendance_type: (response.attendance_type ||
								"ABSENT") as AttendanceType,
						};
					}}
				/>
			)}
		</>
	);
}
