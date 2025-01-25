import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Telegram } from "@/atoms/telegrams";
import {
	createKoudenEntry,
	updateKoudenEntry,
	deleteKoudenEntry,
	type CreateKoudenEntryInput,
	type UpdateKoudenEntryInput,
} from "@/app/_actions/kouden-entries";
import {
	createOffering,
	updateOffering,
	deleteOffering,
} from "@/app/_actions/offerings";
import type { CreateOfferingInput, UpdateOfferingInput } from "@/types/actions";
import {
	createReturnItem,
	updateReturnItem,
	deleteReturnItem,
	type CreateReturnItemInput,
	type UpdateReturnItemInput,
} from "@/app/_actions/return-items";
import {
	getKoudenWithEntries,
	updateKouden,
	deleteKouden,
} from "@/app/_actions/koudens";
import { KoudenDetail } from "./_components/kouden-detail";
import { getTelegrams } from "@/app/_actions/telegrams";

export const metadata: Metadata = {
	title: "香典帳詳細",
	description: "香典帳詳細",
};

type Props = {
	params: Promise<{ id: string }>;
};

const wrappedCreateOffering = async (input: CreateOfferingInput) => {
	"use server";
	return createOffering(input);
};

const wrappedUpdateOffering = async (
	id: string,
	input: UpdateOfferingInput,
) => {
	"use server";
	return updateOffering(id, input);
};

const wrappedDeleteOffering = async (id: string) => {
	"use server";
	return deleteOffering(id);
};

const wrappedCreateReturnItem = async (input: CreateReturnItemInput) => {
	"use server";
	return createReturnItem(input);
};

const wrappedUpdateReturnItem = async (
	id: string,
	input: UpdateReturnItemInput,
) => {
	"use server";
	return updateReturnItem(id, input);
};

const wrappedDeleteReturnItem = async (id: string, koudenEntryId: string) => {
	"use server";
	return deleteReturnItem(id, koudenEntryId);
};

const wrappedUpdateKouden = async (
	id: string,
	input: { title: string; description?: string },
) => {
	"use server";
	return updateKouden(id, input);
};

const wrappedDeleteKouden = async (id: string) => {
	"use server";
	return deleteKouden(id);
};

export default async function KoudenDetailPage({ params }: Props) {
	const { id } = await params;
	const data = await getKoudenWithEntries(id);
	const telegrams = (await getTelegrams(id)) as unknown as Telegram[];

	if (!data) {
		notFound();
	}

	return (
		<KoudenDetail
			kouden={data.kouden}
			entries={data.entries}
			telegrams={telegrams}
			createOffering={wrappedCreateOffering}
			updateOffering={wrappedUpdateOffering}
			deleteOffering={wrappedDeleteOffering}
			createReturnItem={wrappedCreateReturnItem}
			updateReturnItem={wrappedUpdateReturnItem}
			deleteReturnItem={wrappedDeleteReturnItem}
			updateKouden={wrappedUpdateKouden}
			deleteKouden={wrappedDeleteKouden}
		/>
	);
}
