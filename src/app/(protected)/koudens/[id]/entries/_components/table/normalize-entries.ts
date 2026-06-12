import type { AttendanceType, Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";

export type NormalizedEntry = Entry & {
	attendanceType: AttendanceType;
	hasOffering: boolean;
	isReturnCompleted: boolean;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	lastModifiedAt: string | null;
	lastModifiedBy: string | null;
	postalCode: string | null;
	phoneNumber: string | null;
};

export function normalizeRelationships(relationships: Relationship[]): Relationship[] {
	if (!Array.isArray(relationships)) {
		console.error("[ERROR] Invalid relationships data:", relationships);
		return [];
	}
	return relationships;
}

export function normalizeEntries(entries: Entry[]): NormalizedEntry[] {
	if (!Array.isArray(entries)) {
		console.error("[ERROR] Invalid entries data:", entries);
		return [];
	}

	return entries
		.map((entry) => {
			if (!entry) {
				console.error("[ERROR] Invalid entry:", entry);
				return null;
			}

			return {
				...entry,
				relationshipId: entry.relationship_id ?? null,
				attendanceType: entry.attendance_type as AttendanceType,
				hasOffering: entry.has_offering ?? false,
				isReturnCompleted:
					entry.return_status === "COMPLETED" ||
					(!entry.return_status && (entry.is_return_completed ?? false)),
				createdAt: entry.created_at,
				updatedAt: entry.updated_at,
				createdBy: entry.created_by,
				lastModifiedAt: entry.last_modified_at ?? null,
				lastModifiedBy: entry.last_modified_by ?? null,
				postalCode: entry.postal_code ?? null,
				phoneNumber: entry.phone_number ?? null,
			};
		})
		.filter((entry): entry is NormalizedEntry => entry !== null);
}
