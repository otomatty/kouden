/**
 * 旧アプリ（Supabase）からの移行データの形（05 §2・§3）。
 * 移行ツール（tools/migrate-from-supabase）が作り、利用者向けアプリの取り込み用の内部エンドポイントが受け取る。
 * ID はすべて移行ツールが旧 ID から決定的に作る（再実行しても同じ ID になる）。
 */
import { z } from "zod";
import {
	ATTENDANCE_VALUES,
	EVENT_KIND_VALUES,
	GIFT_KIND_VALUES,
	RETURN_METHOD_VALUES,
	RETURN_STATUS_VALUES,
} from "./labels.ts";

const id = z.string().min(1).max(64);
/**
 * 旧データの文字列（PostgreSQL の TEXT）には長さの上限がない。1 件の長い備考で香典帳ごと取り込めなくならないよう、
 * 取り込みでは長さを制限しない（画面の入力欄の上限は、取り込んだ後に編集するときに検証される）
 */
const name = z.string().min(1);
const text = z.string().nullable();
const isoTime = z.iso.datetime({ offset: true });
const isoDate = z.iso.date();
/** 旧データの金額は PostgreSQL の integer。その範囲はすべて受け付ける */
const yen = z.number().int().min(0).max(2_147_483_647);

// ---- D1（ユーザー） --------------------------------------------------------------

export const importUserSchema = z.object({
	id,
	/** 旧 auth.users.id */
	legacyUserId: id,
	email: z.string(),
	displayName: name,
	/** Google でログインしていた人の sub。メールログインだった人は null（ADR-P17） */
	googleSub: z.string().min(1).max(255).nullable(),
	createdAt: isoTime,
});
export type ImportUser = z.infer<typeof importUserSchema>;

export const importUsersPayloadSchema = z.object({
	users: z.array(importUserSchema).max(1000),
});
export type ImportUsersPayload = z.infer<typeof importUsersPayloadSchema>;

// ---- 台帳（DO） ------------------------------------------------------------------

const audit = {
	createdBy: id,
	createdAt: isoTime,
	updatedBy: id,
	updatedAt: isoTime,
};

export const ledgerSnapshotSchema = z.object({
	events: z.array(
		z.object({
			id,
			kind: z.enum(EVENT_KIND_VALUES),
			name,
			date: isoDate.nullable(),
			sortOrder: z.number().int(),
		}),
	),
	relationships: z.array(
		z.object({
			id,
			name,
			sortOrder: z.number().int(),
			isHidden: z.boolean(),
		}),
	),
	persons: z.array(
		z
			.object({
				id,
				name: text,
				nameKana: text,
				organization: text,
				position: text,
				relationshipId: id.nullable(),
				postalCode: text,
				address: text,
				phone: text,
				notes: text,
				...audit,
			})
			.refine((p) => p.name !== null || p.organization !== null, {
				message: "氏名か団体名のどちらかが必要です",
			}),
	),
	gifts: z.array(
		z
			.object({
				id,
				eventId: id,
				kind: z.enum(GIFT_KIND_VALUES),
				amount: yen.nullable(),
				itemName: text,
				quantity: z.number().int().min(0).nullable(),
				message: text,
				attendance: z.enum(ATTENDANCE_VALUES).nullable(),
				notes: text,
				...audit,
			})
			.refine((g) => g.kind !== "koden" || g.amount !== null, {
				message: "香典は金額が必要です",
			}),
	),
	contributors: z.array(
		z.object({
			giftId: id,
			personId: id,
			isPrimary: z.boolean(),
			shareAmount: yen.nullable(),
		}),
	),
	returnItems: z.array(
		z.object({
			id,
			name,
			category: text,
			price: yen,
			description: text,
			/** R2 のキー（koudens/{koudenId}/…）。画像のコピーは移行ツールが行う */
			imageR2Key: z.string().max(500).nullable(),
			isActive: z.boolean(),
			sortOrder: z.number().int(),
			createdAt: isoTime,
			updatedAt: isoTime,
		}),
	),
	returnRules: z.array(
		z.object({
			id,
			minAmount: yen,
			maxAmount: yen.nullable(),
			ratioNumerator: z.number().int().min(1),
			ratioDenominator: z.number().int().min(1),
			suggestedItemId: id.nullable(),
			sortOrder: z.number().int(),
		}),
	),
	returns: z.array(
		z.object({
			id,
			personId: id,
			status: z.enum(RETURN_STATUS_VALUES),
			method: z.enum(RETURN_METHOD_VALUES).nullable(),
			onDayAmount: yen,
			arrangedAt: isoDate.nullable(),
			shippedAt: isoDate.nullable(),
			shipName: text,
			shipPostalCode: text,
			shipAddress: text,
			shipPhone: text,
			notes: text,
			...audit,
		}),
	),
	returnLines: z.array(
		z.object({
			id,
			returnId: id,
			returnItemId: id.nullable(),
			name,
			unitPrice: yen,
			quantity: z.number().int().min(1),
		}),
	),
});
export type LedgerSnapshot = z.infer<typeof ledgerSnapshotSchema>;

// ---- 香典帳 1 冊分（D1 + DO） ----------------------------------------------------

export const importKoudenPayloadSchema = z.object({
	kouden: z.object({
		/** 旧 koudens.id */
		legacyKoudenId: id,
		title: name,
		deceasedName: name,
		ownerUserId: id,
		status: z.enum(["active", "archived"]),
		createdAt: isoTime,
		updatedAt: isoTime,
	}),
	members: z.array(
		z.object({
			userId: id,
			role: z.enum(["owner", "editor", "viewer"]),
			joinedAt: isoTime,
			invitedBy: id.nullable(),
		}),
	),
	purchases: z.array(
		z.object({
			id,
			userId: id,
			amount: yen,
			stripeCheckoutSessionId: z.string().max(255).nullable(),
			createdAt: isoTime,
		}),
	),
	ledger: ledgerSnapshotSchema,
});
export type ImportKoudenPayload = z.infer<typeof importKoudenPayloadSchema>;

/** 取り込んだ後の件数（05 §5 の検証で旧データと比べる） */
export interface LedgerImportSummary {
	events: number;
	relationships: number;
	persons: number;
	gifts: Record<(typeof GIFT_KIND_VALUES)[number], number>;
	kodenTotal: number;
	returns: Record<(typeof RETURN_STATUS_VALUES)[number], number>;
	returnLines: number;
	returnItems: number;
	returnRules: number;
	reminders: number;
}
