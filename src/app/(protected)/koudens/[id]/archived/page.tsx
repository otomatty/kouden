import { getKouden, getKoudenWithPlan } from "@/app/_actions/koudens/read";
import { notFound } from "next/navigation";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { ArchivedPageClient } from "./_components/archived-page-client";
import type { KoudenPermission } from "@/types/role";

interface ArchivedPageProps {
	params: Promise<{ id: string }>;
}

export default async function ArchivedPage({ params }: ArchivedPageProps) {
	const { id } = await params;
	let permission: KoudenPermission;
	try {
		permission = await checkKoudenPermission(id);
	} catch {
		notFound();
	}
	const [kouden, planInfo] = await Promise.all([getKouden(id), getKoudenWithPlan(id)]);
	if (!kouden) notFound();
	const { plan, expired } = planInfo;
	const enableExcel = plan.code !== "free" && !expired;
	const enableCsv = plan.code !== "free" && !expired;
	return (
		<ArchivedPageClient
			id={id}
			title={kouden.title}
			description={kouden.description}
			permission={permission}
			enableExcel={enableExcel}
			enableCsv={enableCsv}
		/>
	);
}
