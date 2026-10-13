import { z } from "zod";
import { importKoudenPayloadSchema, importUserSchema } from "@kouden/domain";
import type { LegacyKoudenSource } from "./source.ts";

const str = z.string();
const nullable = str.nullable();
const number = z.number().finite();
const audit = { created_by: str, created_at: str, updated_at: str };
export const legacyUsersSchema = z.array(
	z.object({
		id: str,
		email: nullable,
		created_at: str,
		identities: z.array(z.object({ provider: str, provider_id: str })),
	}),
);
export const legacyProfilesSchema = z.array(z.object({ id: str, display_name: nullable }));

export const legacySourceSchema: z.ZodType<LegacyKoudenSource> = z.object({
	kouden: z.object({
		id: str,
		title: str,
		description: nullable.optional(),
		owner_id: str,
		status: str,
		created_at: str,
		updated_at: str,
	}),
	roles: z.array(z.object({ id: str, permissions: z.array(str) })),
	members: z.array(z.object({ user_id: str, role_id: str, added_by: nullable, created_at: str })),
	purchases: z.array(
		z.object({
			id: str,
			user_id: str,
			amount_paid: number,
			stripe_session_id: nullable,
			purchased_at: str,
		}),
	),
	relationships: z.array(
		z.object({
			id: str,
			name: str,
			description: nullable.optional(),
			is_enabled: z.boolean(),
			created_at: str,
		}),
	),
	entries: z.array(
		z.object({
			id: str,
			name: nullable,
			organization: nullable,
			position: nullable,
			amount: number,
			postal_code: nullable,
			address: nullable,
			phone_number: nullable,
			relationship_id: nullable,
			attendance_type: str,
			notes: nullable,
			last_modified_by: nullable,
			is_return_completed: z.boolean().nullable().optional(),
			...audit,
		}),
	),
	offerings: z.array(
		z.object({
			id: str,
			type: str,
			description: nullable,
			quantity: number,
			price: number,
			provider_name: str,
			notes: nullable,
			...audit,
		}),
	),
	offeringAllocations: z.array(
		z.object({
			offering_id: nullable,
			kouden_entry_id: nullable,
			allocated_amount: number,
			is_primary_contributor: z.boolean().nullable(),
			contribution_notes: nullable.optional(),
			created_at: nullable,
		}),
	),
	offeringEntries: z.array(z.object({ offering_id: str, kouden_entry_id: str, created_at: str })),
	telegrams: z.array(
		z.object({
			id: str,
			kouden_entry_id: nullable,
			sender_name: str,
			sender_organization: nullable,
			sender_position: nullable,
			message: nullable,
			notes: nullable,
			...audit,
		}),
	),
	returnItems: z.array(
		z.object({
			id: str,
			name: str,
			category: nullable,
			price: number,
			description: nullable,
			image_url: nullable,
			is_active: z.boolean().nullable(),
			sort_order: number.nullable(),
			recommended_amount_min: number.nullable(),
			recommended_amount_max: number.nullable(),
			created_at: str,
			updated_at: str,
		}),
	),
	returnRecords: z.array(
		z.object({
			id: str,
			kouden_entry_id: str,
			return_status: str,
			return_method: nullable,
			funeral_gift_amount: number,
			arrangement_date: nullable,
			shipping_postal_code: nullable,
			shipping_address: nullable,
			shipping_phone_number: nullable,
			remarks: nullable,
			return_items: z.unknown(),
			...audit,
		}),
	),
	returnRecordItems: z.array(
		z.object({
			id: str,
			return_record_id: str,
			return_item_master_id: str,
			price: number,
			quantity: number,
			notes: nullable.optional(),
		}),
	),
});

export const snapshotSchema = z.object({
	format_version: z.literal(1),
	project_ref: str,
	extracted_at: str,
	row_counts: z.record(str, z.number().int().nonnegative()),
	data: z.record(str, z.array(z.record(str, z.unknown()))),
});
export const fileMapSchema = z.array(z.object({ source: str, path: str }));
const digest = z.string().regex(/^[0-9a-f]{64}$/);
export const preparedFileSchema = z.object({
	key: z.string().regex(/^koudens\/[a-zA-Z0-9_-]{1,64}\/return-items\/[0-9a-f-]{36}$/),
	sha256: digest,
	size: z
		.number()
		.int()
		.positive()
		.max(5 * 1024 * 1024),
});
export const planSchema = z.object({
	version: z.literal(1),
	sourceSha256: digest,
	sourceProject: str,
	extractedAt: str,
	users: z.array(importUserSchema),
	koudens: z.array(
		z.object({ payload: importKoudenPayloadSchema, files: z.array(preparedFileSchema) }),
	),
	warnings: z.array(z.object({ code: str, legacyId: str, message: str })),
});
export type MigrationPlan = z.infer<typeof planSchema>;
export type PreparedFile = z.infer<typeof preparedFileSchema>;
