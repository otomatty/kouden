import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
	createKoudenEntry,
	updateKoudenEntry,
	deleteKoudenEntry,
	type CreateKoudenEntryInput,
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

	const wrappedCreateKoudenEntry = async (input: {
		kouden_id: string;
		name?: string | null;
		organization?: string | null;
		position?: string | null;
		amount: number;
		postal_code?: string | null;
		address: string | null;
		phone_number?: string | null;
		attendance_type: "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT" | null;
		has_offering: boolean;
		is_return_completed: boolean;
		notes?: string | null;
		relationship_id?: string | null;
	}) => {
		const transformedInput = {
			...input,
			name: input.name ?? null,
			organization: input.organization ?? null,
			position: input.position ?? null,
			postal_code: input.postal_code ?? null,
			address: input.address ?? null,
			phone_number: input.phone_number ?? null,
			notes: input.notes ?? null,
			relationship_id: input.relationship_id ?? null,
		};
		return createKoudenEntry(transformedInput);
	};

	return (
		<KoudenDetail
			kouden={data.kouden}
			entries={data.entries}
			createKoudenEntry={wrappedCreateKoudenEntry}
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
