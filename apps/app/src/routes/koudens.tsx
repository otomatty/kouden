import {
	can,
	confirmDeceasedNameSchema,
	contributorAddSchema,
	contributorShareSchema,
	eventSchema,
	type FieldErrors,
	findDuplicatePersons,
	giftEntrySchema,
	giftSchema,
	giftPhotoKey,
	groupDuplicates,
	koudenSchema,
	parseGiftFilter,
	personLabel,
	personSchema,
	pickGiftEntryFields,
	relationshipSchema,
	toFieldErrors,
	versionSchema,
} from "@kouden/domain";
import { Hono } from "hono";
import { paidPurchase } from "../billing/purchases.ts";
import { isObjectId } from "../kouden/files.ts";
import {
	confirmDeceasedName,
	createKouden,
	deleteKouden,
	updateKoudenInfo,
} from "../kouden/store.ts";
import { ledgerFor } from "../ledger/client.ts";
import {
	CALLER_HEADER,
	type GiftView,
	type LedgerResult,
	type PersonView,
} from "../ledger/types.ts";
import { koudenAccess, writeRateLimit } from "../middleware/kouden-access.tsx";
import { requireUser } from "../middleware/session.ts";
import type { AppEnv } from "../types.ts";
import type { FormValues } from "@kouden/ui";
import { GiftEditPage, giftFormValues } from "../views/kouden/gift-edit.tsx";
import {
	type CreatedGiftNotice,
	createdGiftMessage,
	EntrySummary,
	type GiftEntryProps,
	GiftEntryPanel,
	GiftNewPage,
} from "../views/kouden/gift-new.tsx";
import { GiftResults, GiftsPage } from "../views/kouden/gifts.tsx";
import { candidatesAnnouncement, PersonCandidates } from "../views/kouden/person-candidates.tsx";
import {
	PersonEditRow,
	PersonPage,
	PersonReturnPanel,
	PersonRow,
	PersonsPage,
	PersonsTable,
	personFormValues,
} from "../views/kouden/persons.tsx";
import { SrStatus } from "../views/kouden/shell.tsx";
import { EventsSection, RelationshipsSection, SettingsPage } from "../views/kouden/settings.tsx";
import { KoudenTopPage } from "../views/kouden/top.tsx";
import { Layout } from "../views/layout.tsx";
import { NewKoudenPage } from "../views/pages/dashboard.tsx";

import {
	basePath,
	commonFailure,
	CONFLICT_MESSAGE,
	type Ctx,
	entrySummary,
	errorResponse,
	formValues,
	isHtmx,
	koudenPage,
	ledger,
	limitMessage,
	noticeOf,
	unwrap,
} from "./helpers.tsx";
import { registerMemberRoutes, setStatusAndNotify } from "./members.tsx";
import { registerBillingRoutes } from "./billing.tsx";
import { registerOutputRoutes } from "./output.tsx";
import { registerReturnRoutes } from "./returns.tsx";
import { registerMergeRoutes } from "./merge.tsx";
import { registerSheetRoutes } from "./sheet.tsx";

// ---- 香典帳の作成 -------------------------------------------------------------

export const koudenRoutes = new Hono<AppEnv>();

koudenRoutes.get("/k/new", requireUser, (c) =>
	c.html(
		<Layout title="新しい香典帳" user={c.get("user")}>
			<NewKoudenPage values={{}} />
		</Layout>,
	),
);

koudenRoutes.post("/k", requireUser, writeRateLimit, async (c) => {
	const user = c.get("user");
	if (!user) return c.redirect("/login");
	const values = await formValues(c);
	const parsed = koudenSchema.safeParse(values);
	if (!parsed.success) {
		return c.html(
			<Layout title="新しい香典帳" user={user}>
				<NewKoudenPage values={values} errors={toFieldErrors(parsed.error)} />
			</Layout>,
			422,
		);
	}
	const id = await createKouden(c.env.DB, user.id, parsed.data, c.get("now"));
	return c.redirect(`/k/${id}`, 303);
});

// ---- 香典帳の中 ---------------------------------------------------------------

const k = new Hono<AppEnv>();
k.use(requireUser, koudenAccess, writeRateLimit);

k.get("/", async (c) => {
	const r = unwrap(c, await ledger(c).overview(c.get("caller")));
	if ("response" in r) return r.response;
	const page = (
		<KoudenTopPage kouden={c.get("kouden")} caller={c.get("caller")} overview={r.value} />
	);
	// 他の人の変更を受けて取り直す場合（ledger-live.js）は部分だけを返す
	if (c.req.query("partial") === "overview") return c.html(page);
	return koudenPage(
		c,
		"トップ",
		"top",
		<KoudenTopPage kouden={c.get("kouden")} caller={c.get("caller")} overview={r.value} />,
	);
});

// ---- いただきものの登録 -------------------------------------------------------

/**
 * 入力エラーで再表示するときの差出人の候補。選んでいた候補は、氏名欄が空でも必ず残す
 * （候補のラジオボタンだけが personId を送るので、消えると選び直せなくなる）
 */
async function candidatesForRetry(c: Ctx, values: FormValues): Promise<PersonView[]> {
	const caller = c.get("caller");
	const q = values.name || values.organization;
	const found = q ? await ledger(c).listPersons(caller, { q, limit: 8 }) : null;
	const list = found?.ok ? found.value : [];
	if (values.personId && !list.some((p) => p.id === values.personId)) {
		const selected = await ledger(c).getPerson(caller, values.personId);
		if (selected.ok) {
			const { gifts: _gifts, ...view } = selected.value;
			list.unshift(view);
		}
	}
	return list;
}

type EntryOptions = Omit<GiftEntryProps, "kouden" | "events" | "relationships" | "recent">;

/** 登録画面に要るもの（行事・関係・選んだ行事の合計・自分の最近の登録）。行事は指定がなければ先頭 */
async function entryContext(c: Ctx, requestedEventId: string | undefined) {
	const caller = c.get("caller");
	const [events, relationships, overview, recent] = await Promise.all([
		ledger(c).listEvents(caller),
		ledger(c).listRelationships(caller),
		ledger(c).overview(caller),
		ledger(c).listMyRecentGifts(caller),
	]);
	if (!events.ok) return { failure: commonFailure(c, events.error) };
	if (!relationships.ok) return { failure: commonFailure(c, relationships.error) };
	if (!overview.ok) return { failure: commonFailure(c, overview.error) };
	if (!recent.ok) return { failure: commonFailure(c, recent.error) };
	const event = events.value.find((e) => e.id === requestedEventId) ?? events.value[0];
	if (!event) return { failure: errorResponse(c, 404) };
	return {
		events: events.value,
		relationships: relationships.value,
		recent: recent.value,
		summary: entrySummary(c, overview.value, event),
	};
}

/**
 * 登録画面を描画する。htmx の要求には差し替える部分（入力欄と最近の登録）だけを返し、
 * 合計は out-of-band で差し替え、結果を読み上げ領域に入れる
 */
async function renderGiftNew(
	c: Ctx,
	options: EntryOptions,
	{ status = 200, announce }: { status?: 200 | 409 | 422; announce?: string } = {},
) {
	const ctx = await entryContext(c, options.values.eventId);
	if ("failure" in ctx) return ctx.failure;
	const props = {
		kouden: c.get("kouden"),
		events: ctx.events,
		relationships: ctx.relationships,
		recent: ctx.recent,
		...options,
		values: { ...options.values, eventId: ctx.summary.eventId },
	};
	if (isHtmx(c)) {
		return c.html(
			<>
				<GiftEntryPanel {...props} />
				<EntrySummary kouden={c.get("kouden")} summary={ctx.summary} oob />
				{announce && <SrStatus oob>{announce}</SrStatus>}
			</>,
			status,
		);
	}
	return koudenPage(
		c,
		"いただきものの登録",
		"gifts",
		<GiftNewPage {...props} summary={ctx.summary} describeCreated />,
		{ status },
	);
}

function createdNotice(gift: GiftView): CreatedGiftNotice {
	const primary = gift.contributors[0];
	return {
		giftId: gift.id,
		receiptNo: gift.receiptNo,
		eventName: gift.eventName,
		personLabel: primary ? personLabel(primary) : "",
		kind: gift.kind,
		amount: gift.amount,
	};
}

k.get("/gifts/new", async (c) => {
	const caller = c.get("caller");
	if (!can(caller.role, "ledger.write")) return errorResponse(c, 403);
	const eventId = c.req.query("eventId") ?? c.req.query("event");
	// 行事の合計だけ（行事を選び直したとき・他の人が登録したとき）
	if (c.req.query("partial") === "summary") {
		const ctx = await entryContext(c, eventId);
		if ("failure" in ctx) return ctx.failure;
		return c.html(<EntrySummary kouden={c.get("kouden")} summary={ctx.summary} />);
	}
	const createdId = c.req.query("created");
	const gift = createdId ? await ledger(c).getGift(caller, createdId) : null;
	return renderGiftNew(c, {
		values: { kind: "koden", eventId },
		created: gift?.ok ? createdNotice(gift.value) : undefined,
		notice: noticeOf(c),
	});
});

k.post("/gifts", async (c) => {
	const caller = c.get("caller");
	if (!can(caller.role, "ledger.write")) return errorResponse(c, 403);
	// 選んだ種別で隠している欄（切り替える前に入れた金額など）は使わない
	const values = pickGiftEntryFields(await formValues(c));
	const parsed = giftEntrySchema.safeParse(values);
	if (!parsed.success) {
		return renderGiftNew(
			c,
			{
				values,
				errors: toFieldErrors(parsed.error),
				candidates: await candidatesForRetry(c, values),
			},
			{ status: 422 },
		);
	}
	const result = await ledger(c).createGift(caller, parsed.data);
	if (!result.ok) {
		const { error } = result;
		if (error.code === "limit_reached") {
			return renderGiftNew(c, { values, message: limitMessage(c, error.limit) }, { status: 422 });
		}
		if (error.code === "invalid") {
			return renderGiftNew(
				c,
				{
					values,
					errors: { [error.field]: error.message },
					candidates: await candidatesForRetry(c, values),
				},
				{ status: 422 },
			);
		}
		return commonFailure(c, error);
	}
	const created = result.value;
	// JS なし: 続けて入力できるよう、同じ行事を選んだ登録画面に戻す
	if (!isHtmx(c)) {
		return c.redirect(
			`${basePath(c)}/gifts/new?event=${created.eventId}&created=${created.giftId}`,
			303,
		);
	}
	const notice: CreatedGiftNotice = {
		giftId: created.giftId,
		receiptNo: created.receiptNo,
		eventName: created.eventName,
		personLabel: created.personLabel,
		kind: parsed.data.gift.kind,
		amount: parsed.data.gift.amount ?? null,
	};
	return renderGiftNew(
		c,
		{ values: { kind: "koden", eventId: created.eventId }, created: notice },
		{ announce: createdGiftMessage(notice) },
	);
});

/** 登録画面の「取り消す」（自分が最近登録した分の削除。08 案 A） */
async function undoFromEntry(c: Ctx, giftId: string, values: FormValues) {
	const caller = c.get("caller");
	const eventId = values.eventId;
	const version = versionSchema.safeParse(values.version);
	const gift = await ledger(c).getGift(caller, giftId);
	if (!gift.ok) return commonFailure(c, gift.error);
	const result = version.success
		? await ledger(c).deleteGift(caller, giftId, version.data)
		: ({ ok: false, error: { code: "conflict" } } as const);
	if (!result.ok) {
		if (result.error.code !== "conflict") return commonFailure(c, result.error);
		return renderGiftNew(
			c,
			{ values: { kind: "koden", eventId }, message: UNDO_CONFLICT_MESSAGE },
			{ status: 409 },
		);
	}
	if (!isHtmx(c)) {
		return c.redirect(`${basePath(c)}/gifts/new?event=${eventId ?? ""}&notice=undone`, 303);
	}
	const { receiptNo, contributors } = gift.value;
	const primary = contributors[0];
	const message = `${receiptNo !== null ? `No.${receiptNo} ` : ""}${
		primary ? `${personLabel(primary)} 様の` : ""
	}登録を取り消しました。`;
	return renderGiftNew(
		c,
		{ values: { kind: "koden", eventId }, notice: message },
		{ announce: message },
	);
}

const UNDO_CONFLICT_MESSAGE =
	"開いている間に他の人がこの記録を更新したため、取り消せませんでした。内容を確かめてから、いただきものの画面で削除してください。";

/** 差出人の候補（htmx の部分 HTML）。氏名・団体名・ふりがなのうち、入力された欄で検索する */
k.get("/persons/candidates", async (c) => {
	const q = [
		c.req.query("name"),
		c.req.query("organization"),
		c.req.query("nameKana"),
		c.req.query("q"),
	]
		.map((v) => v?.trim())
		.find((v) => v);
	if (!q) return c.html(<SrStatus oob />);
	const r = await ledger(c).listPersons(c.get("caller"), { q, limit: 8 });
	if (!r.ok) return commonFailure(c, r.error);
	return c.html(
		<>
			<PersonCandidates persons={r.value} />
			<SrStatus oob>{candidatesAnnouncement(r.value.length)}</SrStatus>
		</>,
	);
});

// 表で入力（08 案 C）。/gifts/:giftId より先に登録する
registerSheetRoutes(k);

// ---- いただきもの -------------------------------------------------------------

const CONTRIBUTOR_CONFLICT_MESSAGE =
	"開いている間に他の人がこの記録を更新しました。最新の差出人を表示しています。入力は残してあるので、確認してからもう一度操作してください。";

k.get("/gifts", async (c) => {
	const caller = c.get("caller");
	const filter = parseGiftFilter(c.req.query());
	if (c.req.query("partial") === "results") {
		const gifts = await ledger(c).listGifts(caller, filter);
		if (!gifts.ok) return commonFailure(c, gifts.error);
		return c.html(<GiftResults kouden={c.get("kouden")} gifts={gifts.value} filter={filter} />);
	}
	const [gifts, events, relationships] = await Promise.all([
		ledger(c).listGifts(caller, filter),
		ledger(c).listEvents(caller),
		ledger(c).listRelationships(caller),
	]);
	if (!gifts.ok) return commonFailure(c, gifts.error);
	if (!events.ok) return commonFailure(c, events.error);
	if (!relationships.ok) return commonFailure(c, relationships.error);
	return koudenPage(
		c,
		"いただきもの",
		"gifts",
		<GiftsPage
			kouden={c.get("kouden")}
			gifts={gifts.value}
			events={events.value}
			relationships={relationships.value}
			filter={filter}
			notice={noticeOf(c)}
		/>,
		{ wide: true },
	);
});

type GiftPageOptions = {
	values?: FormValues;
	errors?: FieldErrors;
	message?: string;
	contributorValues?: FormValues;
	contributorErrors?: FieldErrors;
	contributorCandidates?: PersonView[];
	/** 競合した保存の、自分の入力（最新の内容と並べて表示し、上書きできるようにする） */
	conflictMine?: FormValues;
	/** 競合した負担額の入力（その行の入力欄に残す） */
	shareDraft?: { personId: string; shareAmount: string; makePrimary: boolean };
	status?: 200 | 409 | 422;
};

/** いただきものの画面を描画する。values を省略すると保存済みの内容をフォームに入れる */
async function renderGift(c: Ctx, giftId: string, options: GiftPageOptions = {}) {
	const caller = c.get("caller");
	const [gift, events, history] = await Promise.all([
		ledger(c).getGift(caller, giftId),
		ledger(c).listEvents(caller),
		ledger(c).history(caller, "gift", giftId),
	]);
	if (!gift.ok) return commonFailure(c, gift.error);
	if (!events.ok) return commonFailure(c, events.error);
	const latest = giftFormValues(gift.value);
	return koudenPage(
		c,
		"いただきもの",
		"gifts",
		<GiftEditPage
			kouden={c.get("kouden")}
			gift={gift.value}
			events={events.value}
			canWrite={can(caller.role, "ledger.write")}
			values={options.conflictMine ?? options.values ?? latest}
			errors={options.errors}
			message={options.message}
			notice={noticeOf(c)}
			contributorValues={options.contributorValues}
			contributorErrors={options.contributorErrors}
			contributorCandidates={options.contributorCandidates}
			conflictLatest={options.conflictMine ? latest : undefined}
			shareDraft={options.shareDraft}
			history={history.ok ? history.value : undefined}
		/>,
		{ status: options.status },
	);
}

/** 書き込み結果に応じて、保存済みの画面へ戻すか、エラー付きで再表示する */
async function afterGiftWrite(
	c: Ctx,
	giftId: string,
	result: LedgerResult<unknown>,
	onInvalid: (field: string, message: string) => GiftPageOptions,
	/** 競合したときの再表示（自分の入力を残す）。省略すると最新の内容とメッセージだけを出す */
	onConflict?: GiftPageOptions,
) {
	if (result.ok) return c.redirect(`${basePath(c)}/gifts/${giftId}?notice=saved`, 303);
	const { error } = result;
	if (error.code === "conflict") {
		return renderGift(
			c,
			giftId,
			onConflict ? { ...onConflict, status: 409 } : { message: CONFLICT_MESSAGE, status: 409 },
		);
	}
	if (error.code === "invalid")
		return renderGift(c, giftId, { ...onInvalid(error.field, error.message), status: 422 });
	return commonFailure(c, error);
}

k.get("/gifts/:giftId", (c) => renderGift(c, c.req.param("giftId")));

// 写真はメンバー限定。削除済みの供物や、別の供物に属する写真は配信しない。
k.get("/files/gifts/:giftId/:photoId", async (c) => {
	const { giftId, photoId } = c.req.param();
	if (!isObjectId(photoId)) return c.notFound();
	const gift = await ledger(c).getGift(c.get("caller"), giftId);
	if (!gift.ok || !gift.value.photos?.some((p) => p.id === photoId)) return c.notFound();
	const object = await c.env.FILES.get(giftPhotoKey(c.get("kouden").id, giftId, photoId));
	if (!object) return c.notFound();
	return new Response(object.body, {
		headers: {
			"Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
			"Content-Length": String(object.size),
			"Cache-Control": "private, no-store",
			ETag: object.httpEtag,
			"X-Content-Type-Options": "nosniff",
			"Content-Security-Policy": "default-src 'none'; sandbox",
		},
	});
});

k.post("/gifts/:giftId", async (c) => {
	const giftId = c.req.param("giftId");
	const values = await formValues(c);
	const version = versionSchema.safeParse(values.version);
	const parsed = giftSchema.safeParse(values);
	if (!version.success || !parsed.success) {
		const errors = parsed.success ? {} : toFieldErrors(parsed.error);
		if (!version.success) errors._form = "画面を読み込み直してください";
		return renderGift(c, giftId, { values, errors, status: 422 });
	}
	const result = await ledger(c).updateGift(c.get("caller"), giftId, version.data, parsed.data);
	return afterGiftWrite(
		c,
		giftId,
		result,
		(field, message) => ({ values, errors: { [field]: message } }),
		{ conflictMine: values },
	);
});

k.post("/gifts/:giftId/delete", async (c) => {
	const giftId = c.req.param("giftId");
	const values = await formValues(c);
	if (values.from === "entry") return undoFromEntry(c, giftId, values);
	const version = versionSchema.safeParse(values.version);
	if (!version.success) return renderGift(c, giftId, { message: CONFLICT_MESSAGE, status: 409 });
	const result = await ledger(c).deleteGift(c.get("caller"), giftId, version.data);
	if (result.ok) return c.redirect(`${basePath(c)}/gifts?notice=deleted`, 303);
	return afterGiftWrite(c, giftId, result, (_f, message) => ({ message }));
});

k.post("/gifts/:giftId/contributors", async (c) => {
	const giftId = c.req.param("giftId");
	const values = await formValues(c);
	const version = versionSchema.safeParse(values.version);
	const parsed = contributorAddSchema.safeParse(values);
	if (!version.success) return renderGift(c, giftId, { message: CONFLICT_MESSAGE, status: 409 });
	if (!parsed.success) {
		return renderGift(c, giftId, {
			contributorValues: values,
			contributorErrors: toFieldErrors(parsed.error),
			contributorCandidates: await candidatesForRetry(c, values),
			status: 422,
		});
	}
	const result = await ledger(c).addContributor(c.get("caller"), giftId, version.data, parsed.data);
	const candidates = result.ok ? [] : await candidatesForRetry(c, values);
	return afterGiftWrite(
		c,
		giftId,
		result,
		(field, message) => ({
			contributorValues: values,
			contributorErrors: { [field]: message },
			contributorCandidates: candidates,
		}),
		// 競合: 入力を残し、最新の内容で確認してもらう（そのまま追加すれば最新の内容に追加される）
		{
			contributorValues: values,
			contributorErrors: { _form: CONTRIBUTOR_CONFLICT_MESSAGE },
			contributorCandidates: candidates,
		},
	);
});

k.post("/gifts/:giftId/contributors/:personId", async (c) => {
	const giftId = c.req.param("giftId");
	const values = await formValues(c);
	const version = versionSchema.safeParse(values.version);
	const parsed = contributorShareSchema.safeParse(values);
	if (!version.success) return renderGift(c, giftId, { message: CONFLICT_MESSAGE, status: 409 });
	if (!parsed.success) {
		return renderGift(c, giftId, {
			contributorErrors: {
				_form: toFieldErrors(parsed.error).shareAmount ?? "負担額を確認してください",
			},
			status: 422,
		});
	}
	const result = await ledger(c).updateContributor(
		c.get("caller"),
		giftId,
		version.data,
		c.req.param("personId"),
		{
			shareAmount: parsed.data.shareAmount ?? null,
			makePrimary: values.makePrimary === "1",
		},
	);
	return afterGiftWrite(
		c,
		giftId,
		result,
		(_f, message) => ({ contributorErrors: { _form: message } }),
		// 競合: 入力した負担額をその行に残す（そのまま更新すれば上書き）
		{
			contributorErrors: { _form: CONTRIBUTOR_CONFLICT_MESSAGE },
			shareDraft: {
				personId: c.req.param("personId"),
				shareAmount: values.shareAmount ?? "",
				makePrimary: values.makePrimary === "1",
			},
		},
	);
});

k.post("/gifts/:giftId/contributors/:personId/delete", async (c) => {
	const giftId = c.req.param("giftId");
	const version = versionSchema.safeParse((await formValues(c)).version);
	if (!version.success) return renderGift(c, giftId, { message: CONFLICT_MESSAGE, status: 409 });
	const result = await ledger(c).removeContributor(
		c.get("caller"),
		giftId,
		version.data,
		c.req.param("personId"),
	);
	return afterGiftWrite(
		c,
		giftId,
		result,
		(_f, message) => ({ contributorErrors: { _form: message } }),
		{ contributorErrors: { _form: CONTRIBUTOR_CONFLICT_MESSAGE } },
	);
});

// ---- 差出人 -------------------------------------------------------------------

registerMergeRoutes(k);

k.get("/persons", async (c) => {
	const caller = c.get("caller");
	const canWrite = can(caller.role, "ledger.write");
	// 同じ人かもしれない差出人だけを、組ごとに並べる（E5-2）。検索の条件は使わない
	const duplicatesOnly = canWrite && c.req.query("duplicates") === "1";
	const q = duplicatesOnly ? undefined : c.req.query("q")?.trim() || undefined;
	const persons = await ledger(c).listPersons(caller, q ? { q } : {});
	if (!persons.ok) return commonFailure(c, persons.error);
	// 検索していなければ一覧は全員なので、そのまま候補を数える
	const groups =
		canWrite && !q
			? groupDuplicates(
					persons.value.map((p) => p.id),
					findDuplicatePersons(persons.value),
				)
			: [];
	let list = persons.value;
	if (duplicatesOnly) {
		const byId = new Map(persons.value.map((p) => [p.id, p]));
		list = groups.flat().flatMap((id) => byId.get(id) ?? []);
	}
	const table = (
		<PersonsTable
			kouden={c.get("kouden")}
			persons={list}
			canWrite={canWrite}
			q={q}
			duplicatesOnly={duplicatesOnly}
		/>
	);
	if (c.req.query("partial") === "table") return c.html(table);
	return koudenPage(
		c,
		"差出人",
		"persons",
		<PersonsPage
			kouden={c.get("kouden")}
			canWrite={canWrite}
			q={q}
			duplicateGroups={groups.length}
			duplicatesOnly={duplicatesOnly}
			count={list.length}
		>
			{table}
		</PersonsPage>,
		{ wide: true },
	);
});

/** 一覧の行の描画に必要なもの（同じ検索条件での一覧と、その中の位置） */
async function personRowContext(c: Ctx, personId: string, q: string | undefined) {
	const caller = c.get("caller");
	const [persons, relationships] = await Promise.all([
		ledger(c).listPersons(caller, q ? { q } : {}),
		ledger(c).listRelationships(caller),
	]);
	if (!persons.ok || !relationships.ok) return null;
	const index = persons.value.findIndex((p) => p.id === personId);
	const person = persons.value[index];
	if (!person) return null;
	return { person, next: persons.value[index + 1], relationships: relationships.value };
}

k.get("/persons/:personId/row", async (c) => {
	const q = c.req.query("q")?.trim() || undefined;
	const ctx = await personRowContext(c, c.req.param("personId"), q);
	if (!ctx) return errorResponse(c, 404);
	const kouden = c.get("kouden");
	const canWrite = can(c.get("caller").role, "ledger.write");
	if (c.req.query("edit") === "1" && canWrite) {
		return c.html(
			<PersonEditRow
				kouden={kouden}
				person={ctx.person}
				relationships={ctx.relationships}
				values={personFormValues(ctx.person)}
				q={q}
				hasNext={ctx.next !== undefined}
			/>,
		);
	}
	return c.html(
		<PersonRow kouden={kouden} person={ctx.person} canWrite={canWrite} q={q} focusEdit />,
	);
});

async function renderPerson(
	c: Ctx,
	personId: string,
	options: {
		values?: FormValues;
		errors?: FieldErrors;
		message?: string;
		/** 競合した保存の、自分の入力 */
		conflictMine?: FormValues;
		status?: 200 | 409 | 422;
	} = {},
) {
	const caller = c.get("caller");
	const canWrite = can(caller.role, "ledger.write");
	const [person, relationships, history, persons] = await Promise.all([
		ledger(c).getPerson(caller, personId),
		ledger(c).listRelationships(caller),
		ledger(c).history(caller, "person", personId),
		canWrite ? ledger(c).listPersons(caller, {}) : Promise.resolve(undefined),
	]);
	if (!person.ok) return commonFailure(c, person.error);
	if (!relationships.ok) return commonFailure(c, relationships.error);
	const latest = personFormValues(person.value);
	// 同じ人かもしれない差出人（E5-2）
	const candidateIds = new Set(
		persons?.ok ? findDuplicatePersons(persons.value).get(personId) : undefined,
	);
	const candidates = persons?.ok ? persons.value.filter((p) => candidateIds.has(p.id)) : [];
	return koudenPage(
		c,
		personLabel(person.value),
		"persons",
		<PersonPage
			kouden={c.get("kouden")}
			person={person.value}
			relationships={relationships.value}
			canWrite={canWrite}
			candidates={candidates}
			values={options.conflictMine ?? options.values ?? latest}
			errors={options.errors}
			message={options.message}
			notice={noticeOf(c)}
			conflictLatest={options.conflictMine ? latest : undefined}
			history={history.ok ? history.value : undefined}
		/>,
		{ status: options.status },
	);
}

k.get("/persons/:personId", async (c) => {
	// 他の人が香典返しを作成・変更したときは、その欄だけを返す（ledger-live.js）
	if (c.req.query("partial") === "return") {
		const person = await ledger(c).getPerson(c.get("caller"), c.req.param("personId"));
		if (!person.ok) return commonFailure(c, person.error);
		return c.html(
			<PersonReturnPanel
				kouden={c.get("kouden")}
				person={person.value}
				canWrite={can(c.get("caller").role, "ledger.write")}
			/>,
		);
	}
	return renderPerson(c, c.req.param("personId"));
});

k.post("/persons/:personId", async (c) => {
	const personId = c.req.param("personId");
	const values = await formValues(c);
	const inline = values.mode === "row" && isHtmx(c);
	const q = values.q?.trim() || undefined;

	/** 一覧の行の中で、エラー付きの入力欄を返す */
	const editRow = async (
		rowValues: FormValues | ((p: PersonView) => FormValues),
		errors: FieldErrors,
		message: string | undefined,
		status: 409 | 422,
		conflict = false,
	) => {
		const ctx = await personRowContext(c, personId, q);
		if (!ctx) return errorResponse(c, 404);
		return c.html(
			<PersonEditRow
				kouden={c.get("kouden")}
				person={ctx.person}
				relationships={ctx.relationships}
				values={typeof rowValues === "function" ? rowValues(ctx.person) : rowValues}
				errors={errors}
				message={message}
				q={q}
				hasNext={ctx.next !== undefined}
				conflictLatest={conflict ? personFormValues(ctx.person) : undefined}
			/>,
			status,
		);
	};

	const version = versionSchema.safeParse(values.version);
	const parsed = personSchema.safeParse(values);
	if (!version.success || !parsed.success) {
		const errors = parsed.success ? {} : toFieldErrors(parsed.error);
		if (!version.success) errors._form = "画面を読み込み直してください";
		return inline
			? editRow(values, errors, undefined, 422)
			: renderPerson(c, personId, { values, errors, status: 422 });
	}

	// 「次へ」の行は保存前の一覧で決める（保存で検索条件から外れても、次の人は変わらない）
	const before = inline && values.go === "next" ? await personRowContext(c, personId, q) : null;
	const result = await ledger(c).updatePerson(c.get("caller"), personId, version.data, parsed.data);
	if (!result.ok) {
		const { error } = result;
		if (error.code === "conflict") {
			// 自分の入力と最新の version でフォームを出し、違いを示す（そのまま保存すれば上書き）
			return inline
				? editRow(values, {}, undefined, 409, true)
				: renderPerson(c, personId, { conflictMine: values, status: 409 });
		}
		if (error.code === "invalid") {
			const errors = { [error.field]: error.message };
			return inline
				? editRow(values, errors, undefined, 422)
				: renderPerson(c, personId, { values, errors, status: 422 });
		}
		return commonFailure(c, error);
	}

	if (!inline) return c.redirect(`${basePath(c)}/persons/${personId}?notice=saved`, 303);

	// 保存した行を表示に戻し、「保存して次へ」なら次の行を編集状態で開く（out-of-band で差し替え）。
	// 保存した行は検索条件に関係なく読む（氏名を変えて検索に一致しなくなっても、その行は表示を更新する）
	const ctx = await personRowContext(c, personId, undefined);
	if (!ctx) return errorResponse(c, 404);
	const kouden = c.get("kouden");
	const next = before?.next;
	let hasNextAfterNext = false;
	if (next) hasNextAfterNext = (await personRowContext(c, next.id, q))?.next !== undefined;
	return c.html(
		<>
			<PersonRow kouden={kouden} person={ctx.person} canWrite q={q} focusEdit={!next} />
			<SrStatus oob>{`${personLabel(ctx.person)} を保存しました。`}</SrStatus>
			{next && (
				<PersonEditRow
					kouden={kouden}
					person={next}
					relationships={ctx.relationships}
					values={personFormValues(next)}
					q={q}
					hasNext={hasNextAfterNext}
					oob
				/>
			)}
		</>,
	);
});

// ---- 設定 ---------------------------------------------------------------------

/** 入力エラー時は送信値を保持して設定を再表示する。初期表示では未確認の補完名を空欄にする */
async function renderSettings(
	c: Ctx,
	options: {
		error?: string;
		koudenValues?: FormValues;
		koudenErrors?: FieldErrors;
		deleteError?: string;
		status?: 200 | 409 | 422;
	} = {},
) {
	const caller = c.get("caller");
	const kouden = c.get("kouden");
	const [events, relationships, purchase] = await Promise.all([
		ledger(c).listEvents(caller),
		ledger(c).listRelationships(caller),
		kouden.plan === "paid" ? paidPurchase(c.env.DB, kouden.id) : Promise.resolve(null),
	]);
	if (!events.ok) return commonFailure(c, events.error);
	if (!relationships.ok) return commonFailure(c, relationships.error);
	return koudenPage(
		c,
		"設定",
		"settings",
		<SettingsPage
			kouden={kouden}
			caller={caller}
			events={events.value}
			relationships={relationships.value}
			error={options.error}
			notice={noticeOf(c)}
			koudenValues={
				options.koudenValues ?? {
					title: kouden.title,
					deceasedName:
						kouden.needsDeceasedNameConfirmation && kouden.deceasedName === "（故人名未確認）"
							? ""
							: kouden.deceasedName,
				}
			}
			koudenErrors={options.koudenErrors}
			deleteError={options.deleteError}
			purchase={purchase}
		/>,
		{ status: options.status },
	);
}

/** 設定の書き込み結果。成功なら該当の欄へ戻し、業務ルール違反はメッセージ付きで再表示する */
function afterSettingsWrite(c: Ctx, result: LedgerResult<unknown>, anchor: string) {
	if (result.ok) return c.redirect(`${basePath(c)}/settings?notice=saved#${anchor}`, 303);
	const { error } = result;
	if (error.code === "conflict") return renderSettings(c, { error: CONFLICT_MESSAGE, status: 409 });
	if (error.code === "invalid") return renderSettings(c, { error: error.message, status: 422 });
	return commonFailure(c, error);
}

function firstError(error: { issues: readonly { message: string }[] }): string {
	return error.issues[0]?.message ?? "入力内容を確認してください";
}

k.get("/settings", async (c) => {
	// 他の人の変更を受けて取り直す場合（ledger-live.js）は、その部分だけを返す
	const partial = c.req.query("partial");
	const caller = c.get("caller");
	if (partial === "events") {
		const events = await ledger(c).listEvents(caller);
		if (!events.ok) return commonFailure(c, events.error);
		return c.html(<EventsSection kouden={c.get("kouden")} caller={caller} events={events.value} />);
	}
	if (partial === "relationships") {
		const relationships = await ledger(c).listRelationships(caller);
		if (!relationships.ok) return commonFailure(c, relationships.error);
		return c.html(
			<RelationshipsSection
				kouden={c.get("kouden")}
				caller={caller}
				relationships={relationships.value}
			/>,
		);
	}
	return renderSettings(c);
});

k.post("/settings/confirm-deceased-name", async (c) => {
	const kouden = c.get("kouden");
	if (!can(kouden.memberRole, "kouden.manage") || kouden.status !== "active")
		return errorResponse(c, 403);
	// 戻るボタンや再送で、確認済みの名前を古い入力に戻さない。
	if (!kouden.needsDeceasedNameConfirmation) return c.redirect(`${basePath(c)}/settings`, 303);
	const values = await formValues(c);
	const parsed = confirmDeceasedNameSchema.safeParse(values);
	if (!parsed.success) {
		return renderSettings(c, {
			koudenValues: values,
			koudenErrors: toFieldErrors(parsed.error),
			status: 422,
		});
	}
	const saved = await confirmDeceasedName(
		c.env.DB,
		kouden.id,
		c.get("caller").userId,
		parsed.data,
		c.get("now"),
	);
	if (!saved) return renderSettings(c, { error: CONFLICT_MESSAGE, status: 409 });
	return c.redirect(`${basePath(c)}/settings?notice=deceased_name_confirmed#info`, 303);
});

k.post("/settings/kouden", async (c) => {
	const kouden = c.get("kouden");
	if (!can(kouden.memberRole, "kouden.manage") || kouden.status !== "active")
		return errorResponse(c, 403);
	const values = await formValues(c);
	const parsed = koudenSchema.safeParse(values);
	if (!parsed.success) {
		return renderSettings(c, {
			koudenValues: values,
			koudenErrors: toFieldErrors(parsed.error),
			status: 422,
		});
	}
	await updateKoudenInfo(c.env.DB, kouden.id, parsed.data, c.get("now"));
	return c.redirect(`${basePath(c)}/settings?notice=saved`, 303);
});

k.post("/events", async (c) => {
	const parsed = eventSchema.safeParse(await formValues(c));
	if (!parsed.success) return renderSettings(c, { error: firstError(parsed.error), status: 422 });
	return afterSettingsWrite(c, await ledger(c).createEvent(c.get("caller"), parsed.data), "events");
});

k.post("/events/:eventId", async (c) => {
	const values = await formValues(c);
	const version = versionSchema.safeParse(values.version);
	const parsed = eventSchema.safeParse(values);
	if (!version.success) return renderSettings(c, { error: CONFLICT_MESSAGE, status: 409 });
	if (!parsed.success) return renderSettings(c, { error: firstError(parsed.error), status: 422 });
	const result = await ledger(c).updateEvent(
		c.get("caller"),
		c.req.param("eventId"),
		version.data,
		parsed.data,
	);
	return afterSettingsWrite(c, result, "events");
});

const direction = (v: string | undefined) => (v === "up" ? "up" : "down");

k.post("/events/:eventId/move", async (c) => {
	const dir = direction((await formValues(c)).direction);
	return afterSettingsWrite(
		c,
		await ledger(c).moveEvent(c.get("caller"), c.req.param("eventId"), dir),
		"events",
	);
});

k.post("/events/:eventId/delete", async (c) =>
	afterSettingsWrite(
		c,
		await ledger(c).deleteEvent(c.get("caller"), c.req.param("eventId")),
		"events",
	),
);

k.post("/relationships", async (c) => {
	const parsed = relationshipSchema.safeParse(await formValues(c));
	if (!parsed.success) return renderSettings(c, { error: firstError(parsed.error), status: 422 });
	return afterSettingsWrite(
		c,
		await ledger(c).createRelationship(c.get("caller"), parsed.data),
		"relationships",
	);
});

k.post("/relationships/:relationshipId", async (c) => {
	const values = await formValues(c);
	const version = versionSchema.safeParse(values.version);
	const parsed = relationshipSchema.safeParse(values);
	if (!version.success) return renderSettings(c, { error: CONFLICT_MESSAGE, status: 409 });
	if (!parsed.success) return renderSettings(c, { error: firstError(parsed.error), status: 422 });
	const result = await ledger(c).updateRelationship(
		c.get("caller"),
		c.req.param("relationshipId"),
		version.data,
		parsed.data,
	);
	return afterSettingsWrite(c, result, "relationships");
});

k.post("/relationships/:relationshipId/move", async (c) => {
	const dir = direction((await formValues(c)).direction);
	const result = await ledger(c).moveRelationship(
		c.get("caller"),
		c.req.param("relationshipId"),
		dir,
	);
	return afterSettingsWrite(c, result, "relationships");
});

k.post("/relationships/:relationshipId/hide", async (c) => {
	const hidden = (await formValues(c)).hidden === "1";
	const result = await ledger(c).setRelationshipHidden(
		c.get("caller"),
		c.req.param("relationshipId"),
		hidden,
	);
	return afterSettingsWrite(c, result, "relationships");
});

k.post("/relationships/:relationshipId/delete", async (c) =>
	afterSettingsWrite(
		c,
		await ledger(c).deleteRelationship(c.get("caller"), c.req.param("relationshipId")),
		"relationships",
	),
);

// ---- アーカイブ・削除（オーナーのみ。D1 の操作） --------------------------------

k.post("/archive", async (c) => {
	const kouden = c.get("kouden");
	if (!can(kouden.memberRole, "kouden.manage")) return errorResponse(c, 403);
	const archived = (await formValues(c)).archived === "1";
	await setStatusAndNotify(c, archived);
	return c.redirect(
		`${basePath(c)}/settings?notice=${archived ? "archived" : "unarchived"}#archive`,
		303,
	);
});

k.post("/delete", async (c) => {
	const kouden = c.get("kouden");
	if (!can(kouden.memberRole, "kouden.manage")) return errorResponse(c, 403);
	const confirm = (await formValues(c)).confirm?.trim();
	if (confirm !== kouden.title) {
		return renderSettings(c, { deleteError: "香典帳の名前が一致しません", status: 422 });
	}
	await deleteKouden(c.env, kouden.id, c.get("now"), (id) => ledgerFor(c.env, id).deleteAll());
	return c.redirect("/?notice=deleted", 303);
});

registerMemberRoutes(k);
registerReturnRoutes(k);
registerOutputRoutes(k);
registerBillingRoutes(k);

// ---- リアルタイム（04 §5） ------------------------------------------------------

/** WebSocket の接続。権限を確認してから、呼び出し元を付けて DO へ渡す */
k.get("/ws", async (c) => {
	if (c.req.header("Upgrade") !== "websocket") return c.text("expected websocket", 426);
	// 他のサイトからの WebSocket 接続（Cross-Site WebSocket Hijacking）を拒否する
	if (c.req.header("Origin") !== c.env.APP_ORIGIN) return c.text("forbidden", 403);
	const res = await ledger(c).fetch(
		new Request(c.req.url, {
			headers: {
				Upgrade: "websocket",
				[CALLER_HEADER]: encodeURIComponent(JSON.stringify(c.get("caller"))),
			},
		}),
	);
	if (!res.webSocket) return c.body(null, res.status === 404 ? 404 : 500);
	// DO の応答のヘッダーは変更できないので、作り直す（セキュリティヘッダーを付けられるように）
	return new Response(null, { status: 101, webSocket: res.webSocket });
});

/** 再接続時に、取りこぼした変更を返す */
k.get("/changes", async (c) => {
	const since = Number(c.req.query("since"));
	const result = await ledger(c).changesSince(
		c.get("caller"),
		Number.isInteger(since) && since >= 0 ? since : 0,
	);
	if (!result.ok)
		return c.json({ error: result.error.code }, result.error.code === "forbidden" ? 403 : 404);
	return c.json(result.value);
});

koudenRoutes.route("/k/:koudenId", k);
