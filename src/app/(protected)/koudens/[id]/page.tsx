import type { Metadata } from "next";

// Server Actions
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { getOfferings } from "@/app/_actions/offerings";
import { getKouden } from "@/app/_actions/koudens";
import { getEntries } from "@/app/_actions/entries";
import { getRelationships } from "@/app/_actions/relationships";
import { getTelegrams } from "@/app/_actions/telegrams";
import { getReturnItems } from "@/app/_actions/return-items";
// import { getMembers } from "@/app/_actions/members";
// コンポーネント
import { KoudenDetail } from "./_components/kouden-detail";
import type { OfferingType } from "@/types/offerings";

export const metadata: Metadata = {
	title: "香典帳詳細",
	description: "香典帳詳細",
};

type Props = {
	params: Promise<{ id: string }>;
};

export default async function KoudenDetailPage({ params }: Props) {
	const { id } = await params;

	const kouden = await getKouden(id);

	const entries = await getEntries(id);

	const relationships = await getRelationships(id);

	const returnItems = await getReturnItems(id);

	const telegrams = await getTelegrams(id);

	const rawOfferings = await getOfferings(id);

	const offerings = rawOfferings.map((offering) => ({
		...offering,
		type: offering.type as OfferingType,
		entries: entries.filter((entry) =>
			offering.offeringEntries.some((oe) => oe.koudenEntry?.id === entry.id),
		),
	}));

	const permission = await checkKoudenPermission(id);

	return (
		<KoudenDetail
			kouden={kouden}
			entries={entries}
			relationships={relationships}
			telegrams={telegrams}
			offerings={offerings}
			returnItems={returnItems}
			permission={permission}
		/>
	);
}
