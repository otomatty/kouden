import type { Metadata } from "next";

// Server Actions
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { getOfferings } from "@/app/_actions/offerings";
import { getKoudenWithEntries } from "@/app/_actions/koudens";
import { getTelegrams } from "@/app/_actions/telegrams";
import { getReturnItems } from "@/app/_actions/return-items";
// import { getMembers } from "@/app/_actions/members";
// コンポーネント
import { KoudenDetail } from "./_components/kouden-detail";
import type { OfferingType } from "@/types/offering";

export const metadata: Metadata = {
	title: "香典帳詳細",
	description: "香典帳詳細",
};

type Props = {
	params: Promise<{ id: string }>;
};

export default async function KoudenDetailPage({ params }: Props) {
	const { id } = await params;

	const data = await getKoudenWithEntries(id);

	const returnItems = await getReturnItems(id);

	const telegrams = await getTelegrams(id);

	const rawOfferings = await getOfferings(id);

	const offerings = rawOfferings.map((offering) => ({
		...offering,
		type: offering.type as OfferingType,
	}));

	const permission = await checkKoudenPermission(id);

	return (
		<KoudenDetail
			kouden={data.kouden}
			entries={data.entries}
			telegrams={telegrams}
			offerings={offerings}
			returnItems={returnItems}
			permission={permission}
		/>
	);
}
