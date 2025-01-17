import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/app/_actions/auth";
import { Header } from "./_components/header";
import { TourGuide } from "@/components/custom/TourGuide/TourGuide";
import { FeedbackButton } from "@/components/custom/feedback-button";

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

	return (
		<TourGuide>
			<div className="min-h-screen bg-gray-50">
				<Header user={user} />
				<div className="app-body container mx-auto px-4 py-8">
					<main>{children}</main>
				</div>
				<FeedbackButton />
			</div>
		</TourGuide>
	);
}
