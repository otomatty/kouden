"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import type { KoudenPermission } from "@/types/role";
import { KoudenActionsMenuDesktop } from "./kouden-actions-menu-desktop";
import { KoudenActionsMenuMobile } from "./kouden-actions-menu-mobile";

interface KoudenActionsMenuProps {
	koudenId: string;
	koudenTitle: string;
	/** 全機能アクセス許可 */
	fullAccess?: boolean;
	/** ユーザーの香典帳に対する権限 */
	permission: KoudenPermission;
	/** Excel出力が有効かどうか */
	enableExcel: boolean;
}

export function KoudenActionsMenu({
	koudenId,
	koudenTitle,
	fullAccess = true,
	permission,
	enableExcel,
}: KoudenActionsMenuProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	if (isDesktop) {
		return (
			<KoudenActionsMenuDesktop
				koudenId={koudenId}
				koudenTitle={koudenTitle}
				fullAccess={fullAccess}
				permission={permission}
				enableExcel={enableExcel}
			/>
		);
	}

	return (
		<KoudenActionsMenuMobile
			koudenId={koudenId}
			koudenTitle={koudenTitle}
			fullAccess={fullAccess}
			permission={permission}
			enableExcel={enableExcel}
		/>
	);
}
