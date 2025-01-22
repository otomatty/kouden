"use client";

import { useState, useEffect } from "react";
import { KoudenEntryTable } from "./entry-table";
import { KoudenStatistics } from "./kouden-statistics";
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
	Table2,
	BarChart3,
	Gift,
	Mail,
	Package,
	Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfferingView } from "./offering-view";
import { TelegramTable } from "./telegram-table";
import { ReturnItemTable } from "./return-item-table";
import { MemberTable } from "./member-table";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MobileMenu } from "./mobile-menu";
import { cn } from "@/lib/utils";
import { KoudenTitle } from "./kouden-title";
import { KoudenActionsMenu } from "./kouden-actions-menu";
import type { OfferingType } from "@/types/offering";

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

	// entriesの更新を監視
	useEffect(() => {
		setEntries(initialEntries);
	}, [initialEntries]);

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
					<KoudenActionsMenu
						koudenId={kouden.id}
						koudenTitle={kouden.title}
						permission={permission}
						onDelete={deleteKouden}
					/>
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
						<Table2 className="h-5 w-5" />
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
						<Gift className="h-5 w-5" />
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
							offerings: entry.offerings?.map((offering) => ({
								...offering,
								type: offering.type as OfferingType,
								offering_photos: [],
								kouden_entry_id: entry.id,
							})),
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
								setEntries((prevEntries) =>
									prevEntries.map((entry) =>
										entry.id === id
											? ({
													...entry,
													...response,
													attendance_type: (response.attendance_type ||
														"ABSENT") as AttendanceType,
												} as KoudenEntry)
											: entry,
									),
								);
								return {
									...response,
									attendance_type: (response.attendance_type ||
										"ABSENT") as AttendanceType,
								};
							} catch (error) {
								console.error("更新エラー:", error);
								throw error;
							}
						}}
						createKoudenEntry={async (data) => {
							const input = {
								kouden_id: kouden.id,
								name: data.name || null,
								organization: data.organization || null,
								position: data.position || null,
								address: data.address || null,
								phone_number: data.phone_number || null,
								relationship_id: data.relationship_id || null,
								attendance_type: data.attendance_type || "FUNERAL",
								has_offering: data.has_offering || false,
								is_return_completed: data.is_return_completed || false,
								notes: data.notes || null,
								amount: data.amount !== undefined ? Number(data.amount) : 0,
							};
							try {
								const response = await createKoudenEntry(input);
								// 新しいエントリーを追加
								setEntries((prevEntries) => [
									{
										...response,
										attendance_type: (response.attendance_type ||
											"ABSENT") as AttendanceType,
									} as KoudenEntry,
									...prevEntries,
								]);
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
							try {
								await Promise.all(
									ids.map((id) => deleteKoudenEntry(id, kouden.id)),
								);
								setEntries((prevEntries) =>
									prevEntries.filter((entry) => !ids.includes(entry.id)),
								);
							} catch (error) {
								console.error("削除エラー:", error);
								throw error;
							}
						}}
					/>
				</TabsContent>
				<TabsContent value="offerings">
					<OfferingView koudenId={kouden.id} />
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
					onAddEntry={async (data) => {
						const response = await createKoudenEntry({
							...data,
							kouden_id: kouden.id,
							amount: data.amount !== undefined ? Number(data.amount) : 0,
							address: data.address || null,
							attendance_type: data.attendance_type || "FUNERAL",
							has_offering: data.has_offering || false,
							is_return_completed: data.is_return_completed || false,
						});

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
