import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./_components/profile-form";
import { AvatarUpload } from "./_components/avatar-upload";
import { ActivityStats } from "./_components/activity-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, getActivityStats } from "@/app/_actions/profiles";

export default async function ProfilePage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const [profileResult, statsResult] = await Promise.all([
		getProfile(user.id),
		getActivityStats(user.id),
	]);

	if (profileResult.error || !profileResult.profile) {
		throw new Error(profileResult.error || "プロフィールの取得に失敗しました");
	}

	if (statsResult.error || !statsResult.stats) {
		throw new Error(statsResult.error || "活動統計の取得に失敗しました");
	}

	const { profile } = profileResult;
	const { stats } = statsResult;

	return (
		<div className="container py-8">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>プロフィール設定</CardTitle>
						</CardHeader>
						<CardContent className="space-y-8">
							<div className="flex flex-col items-center space-y-4">
								<AvatarUpload
									userId={user.id}
									avatarUrl={profile.avatar_url}
									displayName={profile.display_name}
								/>
							</div>
							<ProfileForm
								userId={user.id}
								initialData={{
									display_name: profile.display_name,
								}}
							/>
						</CardContent>
					</Card>
				</div>
				<div className="space-y-6">
					<ActivityStats
						ownedKoudensCount={stats.ownedKoudensCount}
						participatingKoudensCount={stats.participatingKoudensCount}
						totalEntriesCount={stats.totalEntriesCount}
						lastActivityAt={stats.lastActivityAt}
					/>
				</div>
			</div>
		</div>
	);
}
