"use client";
import { NavigationModeProvider } from "@/context/navigation-mode";
import { BottomNavigation } from "@/app/(protected)/koudens/[id]/_components/_common/bottom-navigation";
import { Header } from "./_components/header";
import { AppFooter } from "./_components/app-footer";
import { FeedbackButton } from "@/components/custom/feedback-button";
import { OneWeekSurveyTrigger } from "@/components/survey";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { NotificationItem } from "@/types/notifications";
import { usePathname } from "next/navigation";

interface ProtectedClientLayoutProps {
	children: ReactNode;
	user: User;
	isAdminUser: boolean;
	version: string;
	userNotifications: NotificationItem[];
}

export default function ProtectedClientLayout({
	children,
	user,
	isAdminUser,
	version,
	userNotifications,
}: ProtectedClientLayoutProps) {
	const pathname = usePathname();
	const pathSegments = pathname.split("/").filter(Boolean);
	const isDetailPage = pathSegments[0] === "koudens" && pathSegments[1] !== undefined;
	return (
		<NavigationModeProvider value="global">
			<div className="min-h-screen bg-muted flex flex-col">
				<Header
					user={user}
					isAdmin={isAdminUser}
					version={version}
					notifications={userNotifications}
				/>
				<div className="app-body container mx-auto px-4 pt-8 md:py-8 md:my-12 flex-1">
					<main>{children}</main>
				</div>
				<div className="fixed bottom-6 right-6 z-50 hidden md:block">
					<FeedbackButton user={user} />
				</div>
				<AppFooter />
				{!isDetailPage && <BottomNavigation />}

				{/* 1週間経過後のアンケートトリガー */}
				<OneWeekSurveyTrigger onShown={() => console.log("1週間後アンケート表示完了")} />
			</div>
		</NavigationModeProvider>
	);
}
