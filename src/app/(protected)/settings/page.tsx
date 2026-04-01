import { redirect } from "next/navigation";
import { getUserSettings } from "@/app/_actions/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	const { settings, error } = await getUserSettings(user.id);

	if (error || !settings) {
		throw new Error(error || "設定の取得に失敗しました");
	}

	return (
		<div className="container max-w-2xl py-8">
			<Card>
				<CardHeader>
					<CardTitle>アプリケーション設定</CardTitle>
				</CardHeader>
				<CardContent>
					<SettingsForm
						userId={user.id}
						initialSettings={{
							guide_mode: settings.guide_mode ?? true,
							theme: settings.theme as "light" | "dark" | "system",
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
