import OrganizationRequestForm from "./OrganizationRequestForm";
import Container from "@/components/ui/container";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/custom/BackLink";

export default async function RequestPage() {
	const supabase = await createClient();
	// Redirect to login if not authenticated
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect(`/auth/login?redirectTo=${encodeURIComponent("/organizations/request")}`);
	}
	const { data: types } = await supabase.from("organization_types").select("id, name");
	return (
		<Container className="py-8">
			<OrganizationRequestForm types={types ?? []} />
			<div className="mt-6 text-center">
				<Link href="/organizations/status" className="text-blue-500 underline">
					現在申請中の組織を確認する
				</Link>
			</div>
		</Container>
	);
}
