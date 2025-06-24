import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/app/_actions/auth";
import { isAdmin } from "@/app/_actions/admin/permissions";
import { getUserSettings } from "@/app/_actions/settings";
import { InitializeGuideMode } from "@/components/providers/initialize-guide-mode";
import { TourGuide } from "@/components/custom/tour-guide";
import { WelcomeTourInitializer } from "@/components/custom/tour-guide/welcome-tour-initializer";
import { LoadingProvider } from "@/components/custom/loading-provider";
import { Toaster } from "@/components/ui/sonner";
import { Provider } from "jotai";
import { getNotifications } from "@/app/_actions/notifications";
import ProtectedClientLayout from "./ProtectedClientLayout";

// Version fetched from environment variable
const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

interface ProtectedLayoutProps {
	children: React.ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	// プロフィールの確認
	const result = await ensureProfile();
	if (result.error) {
		console.error("[ERROR] Failed to ensure profile:", result.error);
	}

	let guideMode = true;

	if (user) {
		// デフォルト値

		const { settings } = await getUserSettings(user.id);
		if (settings) {
			guideMode = settings.guide_mode ?? true;
		}
	}

	// 管理者権限の確認
	const isAdminUser = await isAdmin();

	// ユーザー通知事前取得
	const { notifications: userNotifications } = await getNotifications();

	return (
		<LoadingProvider>
			<Toaster />
			<Provider>
				<InitializeGuideMode initialValue={guideMode}>
					<TourGuide>
						<WelcomeTourInitializer />
						<ProtectedClientLayout
							user={user}
							isAdminUser={isAdminUser}
							version={version}
							userNotifications={userNotifications || []}
						>
							{children}
						</ProtectedClientLayout>
					</TourGuide>
				</InitializeGuideMode>
			</Provider>
		</LoadingProvider>
	);
}
