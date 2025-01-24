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
import {
	getTelegrams,
	createTelegram,
	updateTelegram,
	deleteTelegram,
} from "@/app/_actions/telegrams";

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

const handleCreateTelegram = async (input: {
	koudenId: string;
	koudenEntryId?: string;
	senderName: string;
	senderOrganization?: string;
	senderPosition?: string;
	message?: string;
	notes?: string;
}) => {
	"use server";
	const { koudenId, koudenEntryId, ...rest } = input;
	return createTelegram({
		...rest,
		koudenId: koudenId,
		koudenEntryId: koudenEntryId,
	});
};

const wrappedUpdateTelegram = async (
	id: string,
	input: {
		koudenId: string;
		koudenEntryId?: string;
		senderName: string;
		senderOrganization?: string;
		senderPosition?: string;
		message?: string;
		notes?: string;
	},
) => {
	"use server";
	return updateTelegram(id, input);
};

const wrappedDeleteTelegram = async (id: string) => {
	"use server";
	return deleteTelegram(id);
};

export default async function KoudenDetailPage({ params }: Props) {
	const { id } = await params;
	const data = await getKoudenWithEntries(id);
	const telegrams = await getTelegrams(id);

	if (!data) {
		notFound();
	}

	return (
		<KoudenDetail
			kouden={data.kouden}
			entries={data.entries}
			telegrams={telegrams}
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
			createTelegram={handleCreateTelegram}
			updateTelegram={wrappedUpdateTelegram}
			deleteTelegram={wrappedDeleteTelegram}
		/>
	);
}
