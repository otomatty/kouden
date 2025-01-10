import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
	createKoudenEntry,
	updateKoudenEntry,
	deleteKoudenEntry,
} from "@/app/_actions/kouden-entries";
import {
	createOffering,
	updateOffering,
	deleteOffering,
} from "@/app/_actions/offerings";
import {
	createReturnItem,
	updateReturnItem,
	deleteReturnItem,
} from "@/app/_actions/return-items";
import {
	getKoudenWithEntries,
	updateKouden,
	deleteKouden,
} from "@/app/_actions/koudens";
import { KoudenDetail } from "./_components/kouden-detail";

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

	if (!data) {
		notFound();
	}

	return (
		<KoudenDetail
			kouden={data.kouden}
			entries={data.entries}
			createKoudenEntry={createKoudenEntry}
			updateKoudenEntry={updateKoudenEntry}
			deleteKoudenEntry={deleteKoudenEntry}
			createOffering={createOffering}
			updateOffering={updateOffering}
			deleteOffering={deleteOffering}
			createReturnItem={createReturnItem}
			updateReturnItem={updateReturnItem}
			deleteReturnItem={deleteReturnItem}
			updateKouden={updateKouden}
			deleteKouden={deleteKouden}
		/>
	);
}
