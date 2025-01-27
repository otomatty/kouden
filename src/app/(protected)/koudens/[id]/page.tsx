import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOfferings } from "@/app/_actions/offerings";
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
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { KoudenDetail } from "./_components/kouden-detail";
import { getTelegrams } from "@/app/_actions/telegrams";
import type { OfferingType } from "@/types/offering";

export const metadata: Metadata = {
	title: "香典帳詳細",
	description: "香典帳詳細",
};

type Props = {
	params: Promise<{ id: string }>;
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
	const telegrams = await getTelegrams(id);
	const rawOfferings = await getOfferings(id);
	const offerings = rawOfferings.map((offering) => ({
		...offering,
		type: offering.type as OfferingType,
	}));
	const permission = await checkKoudenPermission(id);

	console.log("Current user permission:", {
		koudenId: id,
		permission,
		canEdit: permission === "owner" || permission === "editor",
		canDelete: permission === "owner",
	});

	if (!data) {
		notFound();
	}

	return (
		<KoudenDetail
			kouden={data.kouden}
			entries={data.entries}
			telegrams={telegrams}
			offerings={offerings}
			permission={permission}
			createReturnItem={wrappedCreateReturnItem}
			updateReturnItem={wrappedUpdateReturnItem}
			deleteReturnItem={wrappedDeleteReturnItem}
		/>
	);
}
