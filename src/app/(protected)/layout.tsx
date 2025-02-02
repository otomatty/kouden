import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/app/_actions/auth";
import { isAdmin } from "@/app/_actions/admin/admin-users";
import { Header } from "./_components/header";
import { TourGuide } from "@/components/custom/TourGuide/TourGuide";
import { FeedbackButton } from "@/components/custom/feedback-button";
import { LoadingProvider } from "@/components/custom/loading-provider";
import { Toaster } from "@/components/ui/toaster";

interface ProtectedLayoutProps {
	children: React.ReactNode;
}

export default async function ProtectedLayout({
	children,
}: ProtectedLayoutProps) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// プロフィールの確認
	const result = await ensureProfile();
	if (result.error) {
		console.error("[ERROR] Failed to ensure profile:", result.error);
	}

	// 管理者権限の確認
	const isAdminUser = await isAdmin();

	return (
		<LoadingProvider>
			<Toaster />
			<TourGuide>
				<div className="min-h-screen bg-gray-50">
					<Header user={user} isAdmin={isAdminUser} />
					<div className="app-body container mx-auto px-4 py-8">
						<main>{children}</main>
					</div>
					{/* デスクトップのみ表示 */}
					{/* モバイルは/(protected)/_components/header.tsxに配置 */}
					<div className="fixed bottom-8 right-8 z-50 hidden md:block">
						<FeedbackButton />
					</div>
				</div>
			</TourGuide>
		</LoadingProvider>
	);
}
