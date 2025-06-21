"use client";

import { KoudenTitle } from "./kouden-title";
import { KoudenActionsMenu } from "../actions/kouden-actions-menu";
import type { KoudenPermission } from "@/types/role";
import { useState } from "react";
import PlanUpgradeAlert from "./plan-upgrade-alert";
import { BackLink } from "@/components/custom/back-link";

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
			<div className="flex items-center justify-between">
				<KoudenTitle koudenId={koudenId} title={title} description={description} />
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
