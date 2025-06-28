"use client";

import { KoudenTitle } from "./kouden-title";
import { KoudenActionsMenu } from "../actions/kouden-actions-menu";
import type { KoudenPermission } from "@/types/role";
import type { Database } from "@/types/supabase";
import { useState } from "react";
import PlanUpgradeAlert from "./plan-upgrade-alert";
import { BackLink } from "@/components/custom/back-link";
import { Badge } from "@/components/ui/badge";

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
	remainingDays,
	plan,
	expired,
	backLinkHref = "/koudens",
	backLinkText = "香典帳一覧に戻る",
}: KoudenHeaderProps) {
	const [showAlert, setShowAlert] = useState(true);

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
				<div className="flex items-center gap-4">
					<KoudenTitle koudenId={koudenId} title={title} description={description} />
					{plan && (
						<div className="flex items-center space-x-2">
							<Badge variant={plan.code === "free" ? "outline" : "default"}>
								{plan.name}プラン
							</Badge>
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
				</div>
				<KoudenActionsMenu
					koudenId={koudenId}
					koudenTitle={title}
					fullAccess={fullAccess}
					permission={permission}
					enableExcel={enableExcel}
				/>
			</div>
		</div>
	);
}
