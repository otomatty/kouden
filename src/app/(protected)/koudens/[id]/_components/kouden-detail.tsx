"use client";

import { useState, useEffect } from "react";
// ライブラリ
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";

// UIコンポーネント/アイコン
import { ArrowLeft, Table2, BarChart3, Gift, Mail, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
// 型定義
import type { Kouden } from "@/types/kouden";
import type { Entry } from "@/types/entries";
import type { Offering } from "@/types/offerings";
import type { AttendanceType } from "@/types/entries";
import type { KoudenPermission } from "@/types/role";
import type { Telegram } from "@/types/telegram";
import type { ReturnItem } from "@/types/return-item";
import type { Relationship } from "@/types/relationships";
// 状態管理
import { permissionAtom } from "@/store/permission";
// 共通UI(common)
import { MobileMenu } from "./_common/mobile-menu";
import { KoudenTitle } from "./_common/kouden-title";
import { KoudenActionsMenu } from "./actions/kouden-actions-menu";
// 各タブのコンポーネント
// _componentsディレクトリにディレクトリを分けて配置している
import { EntryView } from "./entries";
import { KoudenStatistics } from "./statistics";
import { OfferingView } from "./offerings";
import { ReturnItemTable } from "./return-items";
import { MemberView } from "./members";
import { TelegramsView } from "./telegrams";
// カスタムフック
import { useMediaQuery } from "@/hooks/use-media-query";

interface KoudenDetailProps {
	kouden: Kouden;
	entries: Entry[];
	relationships: Relationship[];
	telegrams: Telegram[];
	offerings: Offering[];
	permission: KoudenPermission;
	returnItems: ReturnItem[];
}

export function KoudenDetail({
	kouden,
	entries: initialEntries,
	relationships,
	telegrams,
	offerings,
	permission,
}: KoudenDetailProps) {
	const router = useRouter();
	const setPermission = useSetAtom(permissionAtom);

	const [entries, setEntries] = useState(initialEntries);
	const [viewMode, setViewMode] = useState<
		"table" | "statistics" | "offerings" | "telegrams" | "return-items" | "members"
	>("table");
	const isDesktop = useMediaQuery("(min-width: 768px)");

	// entriesの更新を監視
	useEffect(() => {
		setEntries(initialEntries);
	}, [initialEntries]);

	// 権限の更新
	useEffect(() => {
		setPermission(permission);
	}, [permission, setPermission]);

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
					<KoudenTitle koudenId={kouden.id} title={kouden.title} description={kouden.description} />
					<KoudenActionsMenu koudenId={kouden.id} koudenTitle={kouden.title} />
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
						<span className={cn(isDesktop ? "inline" : "hidden", viewMode === "table" && "inline")}>
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
							className={cn(isDesktop ? "inline" : "hidden", viewMode === "offerings" && "inline")}
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
							className={cn(isDesktop ? "inline" : "hidden", viewMode === "telegrams" && "inline")}
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
							className={cn(isDesktop ? "inline" : "hidden", viewMode === "statistics" && "inline")}
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
							className={cn(isDesktop ? "inline" : "hidden", viewMode === "members" && "inline")}
						>
							メンバー
						</span>
					</TabsTrigger>
				</TabsList>

				<div className="mt-4">
					<TabsContent value="table" className="m-0">
						<EntryView
							koudenId={kouden.id}
							relationships={relationships}
							entries={entries.map((entry) => ({
								...entry,
								attendanceType: entry.attendance_type as AttendanceType,
								relationship: relationships.find(
									(relationship) => relationship.kouden_id === kouden.id,
								),
							}))}
						/>
					</TabsContent>
					<TabsContent value="offerings" className="m-0">
						<OfferingView koudenId={kouden.id} entries={entries} offerings={offerings} />
					</TabsContent>
					<TabsContent value="telegrams" className="m-0">
						<TelegramsView koudenId={kouden.id} telegrams={telegrams} entries={entries} />
					</TabsContent>
					<TabsContent value="return-items" className="m-0">
						<ReturnItemTable koudenId={kouden.id} />
					</TabsContent>
					<TabsContent value="statistics" className="m-0">
						<KoudenStatistics entries={entries} />
					</TabsContent>
					<TabsContent value="members" className="m-0">
						<MemberView koudenId={kouden.id} permission={permission} />
					</TabsContent>
				</div>
			</Tabs>

			{/* モバイルメニュー */}
			{!isDesktop && (
				<MobileMenu
					koudenId={kouden.id}
					viewMode={viewMode}
					entries={entries}
					relationships={relationships}
					onEntryCreated={(newEntry) => {
						setEntries((prev) => {
							const updated = [newEntry, ...prev];
							return updated;
						});
					}}
				/>
			)}
		</>
	);
}
