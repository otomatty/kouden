import {
	can,
	type FieldErrors,
	GIFT_KINDS,
	giftEntrySchema,
	giftSchema,
	personLabel,
	personSchema,
	SHEET_COLUMNS,
	type SheetColumn,
	type SheetRowInput,
	sheetRequestSchema,
	toFieldErrors,
} from "@kouden/domain";
import type { Hono } from "hono";
import type { GiftView, PersonView } from "../ledger/types.ts";
import type { AppEnv } from "../types.ts";
import { giftFormValues } from "../views/kouden/gift-edit.tsx";
import { GiftSheetPage, type SheetRowView } from "../views/kouden/gift-sheet.tsx";
import { personFormValues } from "../views/kouden/persons.tsx";
import {
	commonFailure,
	type Ctx,
	entrySummary,
	errorResponse,
	koudenPage,
	ledger,
} from "./helpers.tsx";

/**
 * 表で入力（08 案 C、ADR-P19）。PC だけで使う。
 * 画面は表を出すだけで、保存は gift-sheet.js が JSON で送る（行ごとに作成・更新し、行ごとに結果を返す）。
 * 写真で登録（08 案 D）の下書きも、同じ API で新しい行として保存する
 */

/** 保存の結果（行ごと）。values は保存した形（金額の書き方・郵便番号のハイフンをそろえたもの） */
type SheetRowResult =
	| {
			key: string;
			status: "saved";
			giftId: string;
			giftVersion: number;
			personId: string;
			personVersion: number;
			receiptNo: number | null;
			values: Partial<Record<SheetColumn, string>>;
	  }
	| { key: string; status: "skipped" }
	| SheetRowFailure;

/** 保存できなかった行。差出人だけ保存できた場合は、新しい差出人の version を返す */
type SheetRowFailure =
	| { key: string; status: "invalid"; errors: FieldErrors; personVersion?: number }
	| {
			key: string;
			status: "conflict" | "limit" | "error";
			message: string;
			personVersion?: number;
	  };

const formatAmount = (amount: number | null | undefined) =>
	amount === null || amount === undefined ? "" : amount.toLocaleString("ja-JP");

/** 表で直せる行か（単名の香典だけ。連名・香典以外は 1 件ずつの画面で直す） */
function readOnlyReason(gift: GiftView): string | undefined {
	if (gift.contributors.length !== 1) return "連名";
	if (gift.kind !== "koden") return GIFT_KINDS[gift.kind];
	return undefined;
}

/**
 * 表に出す値。氏名の欄は差出人の氏名だけを入れる（団体名だけの差出人は空にし、団体名は薄く見せる。
 * 団体名を氏名の欄に入れると、ほかの列を直したときに氏名として保存してしまうため）。読み取り専用の行は表示名
 */
function sheetValues(
	person: PersonView | undefined,
	gift: GiftView,
	readOnly: boolean,
): Record<SheetColumn, string> {
	const primary = gift.contributors[0];
	return {
		name: readOnly ? (primary ? personLabel(primary) : "") : (person?.name ?? ""),
		nameKana: person?.nameKana ?? "",
		amount: formatAmount(gift.amount),
		postalCode: person?.postalCode ?? "",
		address: person?.address ?? "",
		relationshipId: person?.relationshipId ?? "",
	};
}

/** 何も入れていない行（保存しない） */
const isBlank = (row: SheetRowInput) =>
	SHEET_COLUMNS.every((c) => row[c].trim() === "") && row.organization.trim() === "";

async function createRow(c: Ctx, eventId: string, row: SheetRowInput): Promise<SheetRowResult> {
	if (isBlank(row)) return { key: row.key, status: "skipped" };
	const parsed = giftEntrySchema.safeParse({
		eventId,
		kind: "koden",
		name: row.name,
		nameKana: row.nameKana,
		organization: row.organization,
		amount: row.amount,
		postalCode: row.postalCode,
		address: row.address,
		relationshipId: row.relationshipId,
	});
	if (!parsed.success)
		return { key: row.key, status: "invalid", errors: toFieldErrors(parsed.error) };
	const result = await ledger(c).createGift(c.get("caller"), parsed.data);
	if (!result.ok) {
		const { error } = result;
		if (error.code === "limit_reached") {
			return {
				key: row.key,
				status: "limit",
				message: `無料版で登録できる ${error.limit} 件に達しました。有料版にすると続けて登録できます`,
			};
		}
		if (error.code === "invalid") {
			return { key: row.key, status: "invalid", errors: { [error.field]: error.message } };
		}
		return { key: row.key, status: "error", message: "保存できませんでした" };
	}
	const person = parsed.data.person.type === "new" ? parsed.data.person.input : undefined;
	return {
		key: row.key,
		status: "saved",
		giftId: result.value.giftId,
		giftVersion: 1,
		personId: result.value.personId,
		personVersion: 1,
		receiptNo: result.value.receiptNo,
		values: {
			name: person?.name ?? "",
			nameKana: person?.nameKana ?? "",
			amount: formatAmount(parsed.data.gift.amount),
			postalCode: person?.postalCode ?? "",
			address: person?.address ?? "",
		},
	};
}

/**
 * 保存済みの行を直す。表の列だけを今の内容に重ね、ほかの項目（電話・備考・品名など）は残す。
 * 差出人と香典はそれぞれ version で、開いた後の他の人の変更を検出する
 */
async function updateRow(c: Ctx, row: SheetRowInput): Promise<SheetRowResult> {
	const caller = c.get("caller");
	const { giftId, personId } = row;
	if (!giftId || !personId || row.giftVersion === undefined || row.personVersion === undefined) {
		return { key: row.key, status: "error", message: "画面を読み込み直してください" };
	}
	const [gift, person] = await Promise.all([
		ledger(c).getGift(caller, giftId),
		ledger(c).getPerson(caller, personId),
	]);
	if (!gift.ok || !person.ok) {
		return { key: row.key, status: "error", message: "この記録は削除されたか、見つかりません" };
	}
	if (readOnlyReason(gift.value) || gift.value.contributors[0]?.personId !== personId) {
		return { key: row.key, status: "error", message: "この記録は表では直せません" };
	}

	const personParsed = personSchema.safeParse({
		...personFormValues(person.value),
		name: row.name,
		nameKana: row.nameKana,
		postalCode: row.postalCode,
		address: row.address,
		relationshipId: row.relationshipId,
	});
	const giftParsed = giftSchema.safeParse({ ...giftFormValues(gift.value), amount: row.amount });
	if (!personParsed.success || !giftParsed.success) {
		return {
			key: row.key,
			status: "invalid",
			errors: {
				...(personParsed.success ? {} : toFieldErrors(personParsed.error)),
				...(giftParsed.success ? {} : toFieldErrors(giftParsed.error)),
			},
		};
	}

	const p = personParsed.data;
	const current = person.value;
	const personChanged =
		(p.name ?? null) !== current.name ||
		(p.nameKana ?? null) !== current.nameKana ||
		(p.postalCode ?? null) !== current.postalCode ||
		(p.address ?? null) !== current.address ||
		(p.relationshipId ?? null) !== current.relationshipId;
	const giftChanged = (giftParsed.data.amount ?? null) !== gift.value.amount;

	let personVersion = row.personVersion;
	if (personChanged) {
		const r = await ledger(c).updatePerson(caller, personId, row.personVersion, p);
		if (!r.ok) return failure(row.key, r.error);
		personVersion = r.value.version;
	}
	let giftVersion = row.giftVersion;
	if (giftChanged) {
		const r = await ledger(c).updateGift(caller, giftId, row.giftVersion, giftParsed.data);
		if (!r.ok) return { ...failure(row.key, r.error), personVersion };
		giftVersion = r.value.version;
	}
	return {
		key: row.key,
		status: "saved",
		giftId,
		giftVersion,
		personId,
		personVersion,
		receiptNo: gift.value.receiptNo,
		values: {
			name: p.name ?? "",
			nameKana: p.nameKana ?? "",
			amount: formatAmount(giftParsed.data.amount),
			postalCode: p.postalCode ?? "",
			address: p.address ?? "",
		},
	};
}

function failure(
	key: string,
	error: { code: string; field?: string; message?: string },
): SheetRowFailure {
	if (error.code === "conflict") {
		return {
			key,
			status: "conflict",
			message: "開いている間に他の人が更新しました。画面を読み込み直してください",
		};
	}
	if (error.code === "invalid" && error.field && error.message) {
		return { key, status: "invalid", errors: { [error.field]: error.message } };
	}
	return { key, status: "error", message: "保存できませんでした" };
}

export function registerSheetRoutes(k: Hono<AppEnv>) {
	k.get("/gifts/sheet", async (c) => {
		const caller = c.get("caller");
		if (!can(caller.role, "ledger.write")) return errorResponse(c, 403);
		const [events, relationships, overview] = await Promise.all([
			ledger(c).listEvents(caller),
			ledger(c).listRelationships(caller),
			ledger(c).overview(caller),
		]);
		if (!events.ok) return commonFailure(c, events.error);
		if (!relationships.ok) return commonFailure(c, relationships.error);
		if (!overview.ok) return commonFailure(c, overview.error);
		const event = events.value.find((e) => e.id === c.req.query("event")) ?? events.value[0];
		if (!event) return errorResponse(c, 404);
		const [gifts, persons] = await Promise.all([
			ledger(c).listGifts(caller, { eventId: event.id }),
			ledger(c).listPersons(caller, {}),
		]);
		if (!gifts.ok) return commonFailure(c, gifts.error);
		if (!persons.ok) return commonFailure(c, persons.error);
		const byId = new Map(persons.value.map((p) => [p.id, p]));
		const rows: SheetRowView[] = gifts.value.map((g) => {
			const person = byId.get(g.contributors[0]?.personId ?? "");
			const reason = readOnlyReason(g) ?? (person ? undefined : "差出人のない記録");
			return {
				namePlaceholder: person && !person.name ? (person.organization ?? undefined) : undefined,
				key: `g-${g.id}`,
				giftId: g.id,
				giftVersion: g.version,
				personId: person?.id,
				personVersion: person?.version,
				receiptNo: g.receiptNo,
				values: sheetValues(person, g, reason !== undefined),
				readOnlyReason: reason,
				amount: g.amount,
			};
		});
		return koudenPage(
			c,
			"表で入力",
			"gifts",
			<GiftSheetPage
				kouden={c.get("kouden")}
				events={events.value}
				eventId={event.id}
				relationships={relationships.value}
				summary={entrySummary(c, overview.value, event)}
				rows={rows}
			/>,
			{ wide: true },
		);
	});

	k.post("/gifts/sheet", async (c) => {
		if (!can(c.get("caller").role, "ledger.write")) return c.json({ error: "forbidden" }, 403);
		const body = await c.req.json().catch(() => null);
		const parsed = sheetRequestSchema.safeParse(body);
		if (!parsed.success) return c.json({ error: "invalid_request" }, 400);
		const { eventId, rows } = parsed.data;
		// 行の順に 1 つずつ保存する（番号を表の順に振る。1 行の失敗でほかの行を止めない）
		const results: SheetRowResult[] = [];
		for (const row of rows) {
			results.push(row.giftId ? await updateRow(c, row) : await createRow(c, eventId, row));
		}
		return c.json({ rows: results });
	});
}
