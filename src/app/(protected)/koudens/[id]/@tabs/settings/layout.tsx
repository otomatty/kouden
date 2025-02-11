import type { ReactNode } from "react";

import { SidebarProvider, SidebarInset, SidebarTrigger, Sidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SettingsLayoutProps {
	children: ReactNode;
	menu: ReactNode;
	contents: ReactNode;
}

/**
 * 設定画面のレイアウトコンポーネント
 * - デスクトップではサイドメニューとコンテンツエリアを横並びに配置
 * - モバイルではchildrenのみ表示
 */
export default function SettingsLayout({ children, menu, contents }: SettingsLayoutProps) {
	return (
		<SidebarProvider>
			{/* デスクトップ表示: menuとcontentsを表示、モバイルではhidden */}
			<div className="hidden md:flex relative w-full h-full">
				<Sidebar className={cn("w-60 py-6 border-r absolute")}>{menu}</Sidebar>
				<SidebarInset className="flex-1 p-6">
					<SidebarTrigger />
					<Separator className="mt-4" />
					{contents}
				</SidebarInset>
			</div>

			{/* モバイル表示: menu, contentsはhidden、childrenのみ表示 */}
			<div className="md:hidden">{children}</div>
		</SidebarProvider>
	);
}
