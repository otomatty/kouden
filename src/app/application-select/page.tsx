import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApplicationCard from "./_components/ApplicationCard";
import { Users, Gift, BookOpen } from "lucide-react";
import Container from "@/components/ui/container";

export default async function ApplicationSelectPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/auth/login");
	}
	// fetch organization types via relational nesting (using slug)
	const { data: membershipsWithTypes, error: typeError } = await supabase
		.from("organization_members")
		.select(`
			organizations (
				organization_types ( slug )
			)
		`)
		.eq("user_id", user.id);
	if (typeError) {
		console.error("Error fetching organization types:", typeError);
	}
	const typeSlugs =
		membershipsWithTypes?.map((m) => m.organizations.organization_types.slug).filter(Boolean) ?? [];

	return (
		<Container className="py-8" maxWidthClassName="max-w-4xl">
			<h1 className="text-2xl font-bold mb-6">アプリケーションを選択</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{typeSlugs.includes("funeral_company") && (
					<ApplicationCard
						href="/funeral-management"
						title="葬儀会社管理"
						description="葬儀会社向けの管理画面にアクセスします。"
						icon={Users}
						iconColor="text-red-600"
					/>
				)}
				{typeSlugs.includes("gift_shop") && (
					<ApplicationCard
						href="/gift-management"
						title="ギフトショップ管理"
						description="ギフトショップ向けの管理画面にアクセスします。"
						icon={Gift}
						iconColor="text-pink-600"
					/>
				)}
				<ApplicationCard
					href="/koudens"
					title="香典帳アプリ"
					description="通常の香典帳アプリ画面に戻ります。"
					icon={BookOpen}
					iconColor="text-blue-600"
				/>
			</div>
		</Container>
	);
}
