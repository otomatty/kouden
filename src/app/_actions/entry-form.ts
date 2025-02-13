import type { Entry, EntryFormValues, EntryResponse } from "@/types/entries";
import { createEntry, updateEntry } from "./entries";
import type { AttendanceType } from "@/types/entries";

const convertToEntry = (response: EntryResponse): Entry => {
	if (!response) {
		throw new Error("レスポンスが空です");
	}

	return {
		...response,
		attendanceType: response.attendanceType as AttendanceType,
		relationshipId: response.relationshipId,
	};
};

export const handleEntrySubmission = async (
	values: EntryFormValues,
	koudenId: string,
	existingEntry?: Entry,
): Promise<Entry> => {
	const input = {
		...values,
		koudenId,
		// relationshipIdが未設定の場合はnullを設定
		relationshipId: values.relationshipId ?? null,
		hasOffering: false,
		isReturnCompleted: false,
	};

	const response = existingEntry?.id
		? await updateEntry(existingEntry.id, { ...input, id: existingEntry.id })
		: await createEntry(input);

	return convertToEntry(response);
};
