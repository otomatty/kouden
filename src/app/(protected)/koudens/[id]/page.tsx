import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
	type CreateOfferingInput,
	type UpdateOfferingInput,
} from "@/app/_actions/offerings";
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

export const metadata: Metadata = {
	title: "香典帳詳細",
	description: "香典帳詳細",
};

type Props = {
	params: Promise<{ id: string }>;
};

const wrappedCreateKoudenEntry = async (input: CreateKoudenEntryInput) => {
	"use server";
	return createKoudenEntry(input);
};

const wrappedUpdateKoudenEntry = async (
	id: string,
	input: UpdateKoudenEntryInput,
) => {
	"use server";
	return updateKoudenEntry(id, input);
};

const wrappedDeleteKoudenEntry = async (id: string, koudenId: string) => {
	"use server";
	return deleteKoudenEntry(id, koudenId);
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

const wrappedDeleteOffering = async (id: string, koudenEntryId: string) => {
	"use server";
	return deleteOffering(id, koudenEntryId);
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

	if (!data) {
		notFound();
	}

	return (
		<KoudenDetail
			kouden={data.kouden}
			entries={data.entries}
			createKoudenEntry={wrappedCreateKoudenEntry}
			updateKoudenEntry={wrappedUpdateKoudenEntry}
			deleteKoudenEntry={wrappedDeleteKoudenEntry}
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
