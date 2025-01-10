import { notFound } from "next/navigation";

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

interface KoudenDetailPageProps {
	params: {
		id: string;
	};
	searchParams: { [key: string]: string | string[] | undefined };
}

export default async function KoudenDetailPage({
	params,
	searchParams,
}: KoudenDetailPageProps) {
	const { id } = await Promise.resolve(params);
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
