import type { Offering, OfferingFormValues } from "@/types/offerings";
import { createOffering, updateOffering } from "./offerings";
import type { OfferingResponse } from "@/types/offerings";
import type { DatabaseOffering } from "@/types/offerings";

/**
 * データベースのレスポンスをOffering型に変換する
 * @param response データベースのレスポンス
 * @returns Offering型
 * Offering {offering_photos: OfferingPhoto[], offering_entries: OfferingEntry[]}
 */
const convertToOffering = (response: OfferingResponse): Offering => {
	if (!response) {
		throw new Error("レスポンスが空です");
	}

	return {
		...response,
		offeringPhotos: response.offering_photos ?? [],
		offeringEntries: (response.offering_entries ?? []).map((entry) => ({
			...entry,
			koudenEntry: null,
		})),
	};
};

export const handleOfferingSubmission = async (
	values: OfferingFormValues,
	koudenId: string,
	existingOffering?: Offering,
): Promise<Offering> => {
	const input = {
		...values,
		koudenId,
		offeringPhotos: values.photos,
		offeringEntries: values.entries,
	};

	const response = existingOffering?.id
		? await updateOffering(existingOffering.id, input)
		: await createOffering(input);

	return convertToOffering({
		...response,
		offering_photos: [],
		offering_entries: [],
	} as DatabaseOffering);
};
