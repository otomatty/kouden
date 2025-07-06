"use client";

import { KoudenTitle } from "./kouden-title";
import { KoudenActionsMenu } from "../actions/kouden-actions-menu";
import type { KoudenPermission } from "@/types/role";
import type { Database } from "@/types/supabase";
import { useState } from "react";
import PlanUpgradeAlert from "./plan-upgrade-alert";
import { BackLink } from "@/components/custom/back-link";
import { Badge } from "@/components/ui/badge";
import { PlanHoverCard } from "@/components/custom/plan-hover-card";

type Plan = Database["public"]["Tables"]["plans"]["Row"];

interface KoudenHeaderProps {
	koudenId: string;
	title: string;
	description?: string | null;
	/** 全機能アクセスを有効化するか */
	fullAccess?: boolean;
	/** ユーザーの香典帳に対する権限 */
	permission: KoudenPermission;
	/** Excel出力が有効かどうか */
	enableExcel: boolean;
	/** CSV出力が有効かどうか（Excel出力と同じ制限を適用） */
	enableCsv?: boolean;
	/** 無料プランの残り日数（表示用） */
	remainingDays?: number;
	/** プラン情報 */
	plan?: Plan;
	/** プランが期限切れかどうか */
	expired?: boolean;
	/** 戻るリンクのURL */
	backLinkHref?: string;
	/** 戻るリンクのテキスト */
	backLinkText?: string;
}

export default function KoudenHeader({
	koudenId,
	title,
	description,
	fullAccess = true,
	permission,
	enableExcel,
	enableCsv,
	remainingDays,
	plan,
	expired,
	backLinkHref = "/koudens",
	backLinkText = "香典帳一覧に戻る",
}: KoudenHeaderProps) {
	const [showAlert, setShowAlert] = useState(true);

	// enableCsvが明示的に指定されていない場合はenableExcelと同じ値を使用
	const csvEnabled = enableCsv ?? enableExcel;

	return (
		<div className="space-y-4 py-4">
			<BackLink href={backLinkHref} label={backLinkText} />
			{remainingDays != null && showAlert && (
				<PlanUpgradeAlert
					remainingDays={remainingDays}
					koudenId={koudenId}
					onClose={() => setShowAlert(false)}
				/>
			)}
			<div className="flex items-center justify-between" data-tour="kouden-detail">
				<div className="space-y-2">
					{plan && (
						<div className="flex items-center space-x-2">
							<PlanHoverCard
								plan={plan}
								badgeVariant={plan.code === "free" ? "outline" : "default"}
							/>
							{plan.code === "free" &&
								(expired ? (
									<Badge variant="destructive">期限切れ</Badge>
								) : (
									remainingDays != null && (
										<Badge variant="secondary">残り {remainingDays} 日</Badge>
									)
								))}
						</div>
					)}
					<KoudenTitle koudenId={koudenId} title={title} description={description} />
				</div>
				<KoudenActionsMenu
					koudenId={koudenId}
					koudenTitle={title}
					fullAccess={fullAccess}
					permission={permission}
					enableExcel={enableExcel}
					enableCsv={csvEnabled}
				/>
			</div>
		</div>
	);
}
