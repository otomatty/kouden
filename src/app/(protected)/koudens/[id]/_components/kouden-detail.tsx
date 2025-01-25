"use client";

import { useState, useEffect } from "react";

import type { Database } from "@/types/supabase";
import type { KoudenEntry } from "@/types/kouden";
import type { Offering } from "@/types/offering";
import type { AttendanceType } from "./entries/types";
import type { KoudenPermission } from "@/app/_actions/koudens";
import type { Telegram } from "@/atoms/telegrams";
import { checkKoudenPermission } from "@/app/_actions/koudens";
import type {
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
// 各タブのコンポーネント
// _componentsディレクトリにディレクトリを分けて配置している
import { KoudenEntryTable } from "./entries";
import { KoudenStatistics } from "./statistics";
import { OfferingView } from "./offerings";
import { ReturnItemTable } from "./return-items";
import { MemberTable } from "./members";
import { TelegramsView } from "./telegrams";
// カスタムフック
import { useMediaQuery } from "@/hooks/use-media-query";
// 共通UI(common)
import { MobileMenu } from "./_common/mobile-menu";
import { KoudenTitle } from "./_common/kouden-title";
import { KoudenActionsMenu } from "./actions/kouden-actions-menu";

import { cn } from "@/lib/utils";

type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

interface KoudenDetailProps {
	kouden: Kouden;
	entries: KoudenEntry[];
	telegrams: Telegram[];
	offerings: Offering[];

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
	telegrams,
	offerings,
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
				className="w-full"
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

				<div className="mt-4">
					<TabsContent value="table" className="m-0">
						<KoudenEntryTable
							koudenId={kouden.id}
							entries={entries.map((entry) => ({
								...entry,
								attendance_type: entry.attendance_type as AttendanceType,
							}))}
						/>
					</TabsContent>
					<TabsContent value="offerings" className="m-0">
						<OfferingView
							offerings={offerings}
							koudenId={kouden.id}
							koudenEntries={entries}
						/>
					</TabsContent>
					<TabsContent value="telegrams" className="m-0">
						<TelegramsView koudenId={kouden.id} telegrams={telegrams} />
					</TabsContent>
					<TabsContent value="return-items" className="m-0">
						<ReturnItemTable koudenId={kouden.id} />
					</TabsContent>
					<TabsContent value="statistics" className="m-0">
						<KoudenStatistics entries={entries} />
					</TabsContent>
					<TabsContent value="members" className="m-0">
						<MemberTable koudenId={kouden.id} />
					</TabsContent>
				</div>
			</Tabs>

			{/* モバイルメニュー */}
			{!isDesktop && (
				<MobileMenu
					koudenId={kouden.id}
					viewMode={viewMode}
					koudenEntries={entries}
				/>
			)}
		</>
	);
}
