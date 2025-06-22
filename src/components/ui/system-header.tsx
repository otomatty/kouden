"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { OrganizationSwitcher } from "@/components/ui/organization-switcher";
import { UserMenu } from "@/app/(protected)/_components/user-menu";
import { SystemNavigation } from "@/components/ui/system-navigation";
import { useOrganization } from "@/context/organization";
import { useEffect } from "react";
import Container from "./container";
import {
	funeralManagementNavigation,
	funeralQuickAccessNavigation,
} from "@/config/navigation/funeral-management";
import {
	giftManagementNavigation,
	giftQuickAccessNavigation,
} from "@/config/navigation/gift-management";

type SystemType = "funeral" | "gift" | "default";

interface SystemHeaderProps {
	user: User;
	isAdmin: boolean;
	version: string;
	systemType?: SystemType;
}

/**
 * システム用の共通ヘッダーコンポーネント
 * 葬儀会社向け機能とギフトショップ向け機能で共通利用
 */
export function SystemHeader({
	user,
	isAdmin,
	version,
	systemType = "default",
}: SystemHeaderProps) {
	const { setSystemType } = useOrganization();

	// システムタイプをコンテキストに設定
	useEffect(() => {
		setSystemType(systemType);
	}, [systemType, setSystemType]);

	const getLogoConfig = (type: SystemType) => {
		switch (type) {
			case "funeral":
				return {
					title: "葬儀管理システム",
					href: "/funeral-management",
				};
			case "gift":
				return {
					title: "ギフト管理システム",
					href: "/gift-management",
				};
			default:
				return {
					title: "香典帳",
					href: "/koudens",
				};
		}
	};

	const getNavigationConfig = (type: SystemType) => {
		switch (type) {
			case "funeral":
				return {
					sections: funeralManagementNavigation,
					quickAccess: funeralQuickAccessNavigation,
				};
			case "gift":
				return {
					sections: giftManagementNavigation,
					quickAccess: giftQuickAccessNavigation,
				};
			default:
				return null;
		}
	};

	const logoConfig = getLogoConfig(systemType);
	const navigationConfig = getNavigationConfig(systemType);

	return (
		<header className="border-b bg-white shadow-sm">
			{/* メインヘッダー */}
			<div className="p-4">
				<Container className="flex items-center justify-between">
					<Link href={logoConfig.href} className="hover:opacity-80 transition-opacity">
						<h1 className="text-xl font-semibold flex items-center gap-2">
							{logoConfig.title}
							<span className="text-xs">β版</span>
							<span className="text-xs">v{version}</span>
						</h1>
					</Link>
					<div className="flex items-center gap-4">
						<OrganizationSwitcher />
						<UserMenu user={user} isAdmin={isAdmin} />
					</div>
				</Container>
			</div>

			{/* ナビゲーションメニュー */}
			{navigationConfig && (
				<div className="border-t bg-slate-50/50">
					<Container className="py-2">
						<SystemNavigation
							sections={navigationConfig.sections}
							quickAccess={navigationConfig.quickAccess}
						/>
					</Container>
				</div>
			)}
		</header>
	);
}
