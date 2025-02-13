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
		<>
			<SidebarProvider>
				{/* デスクトップ表示: menuとcontentsを表示、モバイルではhidden */}
				<div className="hidden md:flex relative w-full h-full">
					<Sidebar className={cn("py-12 border-r absolute bg-sidebar")}>{menu}</Sidebar>
					<SidebarInset>
						<div className="flex items-center gap-2 ml-4 mt-4">
							<SidebarTrigger />
							<Separator orientation="vertical" className="h-full" />
						</div>
						<Separator className="m-4" />
						{contents}
					</SidebarInset>
				</div>
			</SidebarProvider>
			{/* モバイル表示: menu, contentsはhidden、childrenのみ表示 */}
			<div className="md:hidden mt-0">{children}</div>
		</>
	);
}
