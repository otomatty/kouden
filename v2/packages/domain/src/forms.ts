/**
 * 画面のフォーム入力の検証。HTML フォームの値（文字列）を受け取り、保存できる形に変換する。
 * 空欄は undefined に、全角数字や「10,000円」のような金額は数値にそろえる。
 */
import { z } from "zod";
import { ATTENDANCE_VALUES, EVENT_KIND_VALUES, EVENT_KINDS, GIFT_KIND_VALUES } from "./labels.ts";

z.config(z.locales.ja());

/** 金額の上限（1 件あたり 1 億円未満） */
export const MAX_AMOUNT = 99_999_999;

function blankToUndefined(value: unknown): unknown {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed === "" ? undefined : trimmed;
}

/** 「１０，０００円」「¥10,000」などを数値にする。数値にできない文字列はそのまま返して検証で弾く */
function toInteger(value: unknown): unknown {
	if (typeof value !== "string") return value;
	const normalized = value.normalize("NFKC").replace(/[\s,円¥]/g, "");
	if (normalized === "") return undefined;
	return /^\d+$/.test(normalized) ? Number(normalized) : normalized;
}

const requiredText = (label: string, max: number) =>
	z.preprocess(
		blankToUndefined,
		z
			.string({ error: `${label}を入力してください` })
			.max(max, { error: `${label}は ${max} 文字以内で入力してください` }),
	);

const optionalText = (label: string, max: number) =>
	z.preprocess(
		blankToUndefined,
		z
			.string()
			.max(max, { error: `${label}は ${max} 文字以内で入力してください` })
			.optional(),
	);

const optionalId = z.preprocess(blankToUndefined, z.string().max(64).optional());

const optionalYen = (label: string) =>
	z.preprocess(
		toInteger,
		z
			.number({ error: `${label}は数字で入力してください` })
			.int({ error: `${label}は整数で入力してください` })
			.min(0, { error: `${label}は 0 以上で入力してください` })
			.max(MAX_AMOUNT, { error: `${label}が大きすぎます` })
			.optional(),
	);

const optionalCount = (label: string) =>
	z.preprocess(
		toInteger,
		z
			.number({ error: `${label}は数字で入力してください` })
			.int()
			.min(1, { error: `${label}は 1 以上で入力してください` })
			.max(9999, { error: `${label}が大きすぎます` })
			.optional(),
	);

const postalCode = z.preprocess(
	(v) => blankToUndefined(typeof v === "string" ? v.normalize("NFKC").replace(/[\s〒]/g, "") : v),
	z
		.string()
		.regex(/^\d{3}-?\d{4}$/, { error: "郵便番号は 7 桁の数字で入力してください（例: 100-0001）" })
		.transform((v) => `${v.replace("-", "").slice(0, 3)}-${v.replace("-", "").slice(3)}`)
		.optional(),
);

const phone = z.preprocess(
	(v) => blankToUndefined(typeof v === "string" ? v.normalize("NFKC") : v),
	z
		.string()
		.regex(/^[0-9+\-() ]{6,20}$/, { error: "電話番号は数字とハイフンで入力してください" })
		.optional(),
);

// ---- 香典帳 ----------------------------------------------------------------

export const koudenSchema = z
	.object({
		deceasedName: requiredText("故人のお名前", 50),
		title: optionalText("香典帳の名前", 100),
	})
	.transform((v) => ({
		deceasedName: v.deceasedName,
		title: v.title ?? `故 ${v.deceasedName} 様`,
	}));
export type KoudenInput = z.output<typeof koudenSchema>;

// ---- 行事・関係 ------------------------------------------------------------

export const eventSchema = z
	.object({
		kind: z.enum(EVENT_KIND_VALUES, { error: "行事の種類を選んでください" }),
		name: optionalText("行事の名前", 50),
		date: z.preprocess(
			blankToUndefined,
			z.iso.date({ error: "日付は YYYY-MM-DD の形式で入力してください" }).optional(),
		),
	})
	.transform((v) => ({ kind: v.kind, name: v.name ?? EVENT_KINDS[v.kind], date: v.date ?? null }));
export type EventInput = z.output<typeof eventSchema>;

export const relationshipSchema = z.object({
	name: requiredText("関係の名前", 30),
});
export type RelationshipInput = z.output<typeof relationshipSchema>;

// ---- 差出人 ----------------------------------------------------------------

const personFields = {
	name: optionalText("氏名", 50),
	nameKana: optionalText("ふりがな", 100),
	organization: optionalText("団体名", 100),
	position: optionalText("役職", 50),
	relationshipId: optionalId,
	postalCode,
	address: optionalText("住所", 200),
	phone,
	notes: optionalText("備考", 1000),
};

const PERSON_NAME_REQUIRED = "氏名か団体名のどちらかを入力してください";

export const personSchema = z.object(personFields).superRefine((v, ctx) => {
	if (v.name === undefined && v.organization === undefined) {
		ctx.addIssue({ code: "custom", path: ["name"], message: PERSON_NAME_REQUIRED });
	}
});
export type PersonInput = z.output<typeof personSchema>;

// ---- いただきもの ----------------------------------------------------------

const giftFields = {
	eventId: z.preprocess(blankToUndefined, z.string({ error: "行事を選んでください" }).max(64)),
	kind: z.enum(GIFT_KIND_VALUES, { error: "種別を選んでください" }),
	amount: optionalYen("金額"),
	itemName: optionalText("品名", 100),
	quantity: optionalCount("数量"),
	message: optionalText("弔電の文面", 2000),
	attendance: z.preprocess(
		blankToUndefined,
		z.enum(ATTENDANCE_VALUES, { error: "参列の区分を選んでください" }).optional(),
	),
	notes: optionalText("備考", 1000),
};

/** 種別ごとの条件（E4-3）: 香典は金額が必須、弔電は金額を持たない */
function refineGift(v: { kind: string; amount?: number | undefined }, ctx: z.RefinementCtx): void {
	if (v.kind === "koden" && v.amount === undefined) {
		ctx.addIssue({ code: "custom", path: ["amount"], message: "香典の金額を入力してください" });
	}
	if (v.kind === "choden" && v.amount !== undefined) {
		ctx.addIssue({ code: "custom", path: ["amount"], message: "弔電には金額を入力できません" });
	}
}

export const giftSchema = z.object(giftFields).superRefine(refineGift);
export type GiftInput = z.output<typeof giftSchema>;

/**
 * 受付での登録。いただきものと差出人を一度に入力する。
 * 既存の差出人を選んだ場合（personId あり）は、差出人の入力欄は使わない（E5-1）。
 */
export const receptionSchema = z
	.object({ ...giftFields, personId: optionalId, ...personFields })
	.superRefine((v, ctx) => {
		refineGift(v, ctx);
		if (v.personId === undefined && v.name === undefined && v.organization === undefined) {
			ctx.addIssue({ code: "custom", path: ["name"], message: PERSON_NAME_REQUIRED });
		}
	})
	.transform(
		({
			personId,
			eventId,
			kind,
			amount,
			itemName,
			quantity,
			message,
			attendance,
			notes,
			...person
		}) => ({
			gift: { eventId, kind, amount, itemName, quantity, message, attendance, notes },
			person:
				personId === undefined
					? ({ type: "new", input: person } as const)
					: ({ type: "existing", personId } as const),
		}),
	);
export type ReceptionInput = z.output<typeof receptionSchema>;
export type ContributorRef = ReceptionInput["person"];

/** 連名の差出人を追加する（既存の差出人を選ぶか、氏名・団体名で新規作成） */
export const contributorAddSchema = z
	.object({
		personId: optionalId,
		name: optionalText("氏名", 50),
		organization: optionalText("団体名", 100),
		shareAmount: optionalYen("負担額"),
	})
	.superRefine((v, ctx) => {
		if (v.personId === undefined && v.name === undefined && v.organization === undefined) {
			ctx.addIssue({ code: "custom", path: ["name"], message: PERSON_NAME_REQUIRED });
		}
	})
	.transform((v) => ({
		person:
			v.personId === undefined
				? ({ type: "new", input: { name: v.name, organization: v.organization } } as const)
				: ({ type: "existing", personId: v.personId } as const),
		shareAmount: v.shareAmount ?? null,
	}));
export type ContributorAddInput = z.output<typeof contributorAddSchema>;

export const contributorShareSchema = z.object({
	shareAmount: optionalYen("負担額"),
});

/** 楽観ロック用の version（フォームの hidden） */
export const versionSchema = z.preprocess(
	toInteger,
	z.number({ error: "画面を読み込み直してください" }).int().min(1),
);

// ---- 絞り込み（一覧の検索条件） ------------------------------------------

export interface GiftFilter {
	eventId?: string;
	kind?: (typeof GIFT_KIND_VALUES)[number];
	relationshipId?: string;
	q?: string;
	minAmount?: number;
	maxAmount?: number;
}

/** 一覧の検索条件。不正な値はエラーにせず、その条件を無視する */
export function parseGiftFilter(params: Record<string, string | undefined>): GiftFilter {
	const filter: GiftFilter = {};
	const eventId = blankToUndefined(params.event);
	if (typeof eventId === "string") filter.eventId = eventId;
	const kind = GIFT_KIND_VALUES.find((k) => k === params.kind);
	if (kind) filter.kind = kind;
	const rel = blankToUndefined(params.relationship);
	if (typeof rel === "string") filter.relationshipId = rel;
	const q = blankToUndefined(params.q);
	if (typeof q === "string") filter.q = q.slice(0, 100);
	const min = toInteger(params.min);
	if (typeof min === "number") filter.minAmount = min;
	const max = toInteger(params.max);
	if (typeof max === "number") filter.maxAmount = max;
	return filter;
}

// ---- エラー表示 ------------------------------------------------------------

/** 項目名 → 最初のエラーメッセージ。項目に属さないエラーは `_form` に入れる */
export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
	const out: FieldErrors = {};
	for (const issue of error.issues) {
		const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
		if (!(key in out)) out[key] = issue.message;
	}
	return out;
}
