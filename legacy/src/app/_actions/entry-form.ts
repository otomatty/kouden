import { type ActionResult, KoudenError, withActionResult } from "@/lib/errors";
import type { AttendanceType, Entry, EntryFormValues, EntryResponse } from "@/types/entries";
import { createEntry, updateEntry } from "./entries";

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
): Promise<ActionResult<Entry>> => {
	return withActionResult(async () => {
		const input = {
			...values,
			koudenId,
			// relationshipIdが未設定の場合はnullを設定
			relationshipId: values.relationshipId ?? null,
			hasOffering: false,
		};

		const result = existingEntry?.id
			? await updateEntry(existingEntry.id, { ...input, id: existingEntry.id })
			: await createEntry(input);

		if (!result.ok) {
			throw new KoudenError(result.error.message, result.error.code, {
				status: result.error.status,
			});
		}

		return convertToEntry(result.data);
	}, "香典情報の保存");
};
