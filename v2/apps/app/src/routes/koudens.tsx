import {
	can,
	contributorAddSchema,
	contributorShareSchema,
	eventSchema,
	type FieldErrors,
	giftSchema,
	koudenSchema,
	parseGiftFilter,
	personLabel,
	personSchema,
	receptionSchema,
	relationshipSchema,
	toFieldErrors,
	versionSchema,
} from "@kouden/domain";
import { type Context, Hono } from "hono";
import type { Child } from "hono/jsx";
import { createKouden, deleteKouden, setKoudenStatus, updateKoudenInfo } from "../kouden/store.ts";
import { ledgerFor } from "../ledger/client.ts";
import type { LedgerError, LedgerResult, PersonView } from "../ledger/types.ts";
import { koudenAccess, writeRateLimit } from "../middleware/kouden-access.tsx";
import { requireUser } from "../middleware/session.ts";
import type { AppEnv } from "../types.ts";
import type { FormValues } from "../views/components/form.tsx";
import { GiftEditPage, giftFormValues } from "../views/kouden/gift-edit.tsx";
import { GiftsPage } from "../views/kouden/gifts.tsx";
import { PersonCandidates } from "../views/kouden/person-candidates.tsx";
import {
	PersonEditRow,
	PersonPage,
	PersonRow,
	PersonsPage,
	personFormValues,
} from "../views/kouden/persons.tsx";
import {
	type ReceptionDone,
	ReceptionPage,
	ReceptionPanel,
	type ReceptionProps,
} from "../views/kouden/reception.tsx";
import { SettingsPage } from "../views/kouden/settings.tsx";
import { type KoudenTab, KoudenShell } from "../views/kouden/shell.tsx";
import { KoudenTopPage } from "../views/kouden/top.tsx";
import { Layout } from "../views/layout.tsx";
import { NewKoudenPage } from "../views/pages/dashboard.tsx";
import { ErrorPage } from "../views/pages/error.tsx";

type Ctx = Context<AppEnv>;

/** リダイレクト後に表示するお知らせ（URL には既知のキーだけを載せる） */
const NOTICES = {
	saved: "保存しました。",
	deleted: "削除しました。",
	archived: "アーカイブしました。",
	unarchived: "アーカイブを解除しました。",
} as const;

const CONFLICT_MESSAGE =
	"開いている間に他の人が更新しました。最新の内容を表示しています。もう一度入力してから保存してください。";

function noticeOf(c: Ctx): string | undefined {
	const key = c.req.query("notice");
	return key && key in NOTICES ? NOTICES[key as keyof typeof NOTICES] : undefined;
}

async function formValues(c: Ctx): Promise<FormValues> {
	const body = await c.req.parseBody();
	const values: FormValues = {};
	for (const [key, value] of Object.entries(body)) {
		if (typeof value === "string") values[key] = value;
	}
	return values;
}

const isHtmx = (c: Ctx) => c.req.header("HX-Request") === "true";
const ledger = (c: Ctx) => ledgerFor(c.env, c.get("kouden").id);
const basePath = (c: Ctx) => `/k/${c.get("kouden").id}`;

function errorResponse(c: Ctx, status: 403 | 404) {
	if (isHtmx(c)) return c.body(null, status);
	return c.html(
		<Layout
			title={status === 403 ? "この操作はできません" : "ページが見つかりません"}
			user={c.get("user")}
		>
			<ErrorPage status={status} />
		</Layout>,
		status,
	);
}

/** 画面で個別に扱わない失敗（権限なし・見つからない） */
function commonFailure(c: Ctx, error: LedgerError) {
	return errorResponse(c, error.code === "forbidden" ? 403 : 404);
}

/** DO の読み取り結果を取り出す。失敗ならエラー画面のレスポンスを返す */
function unwrap<T>(
	c: Ctx,
	result: LedgerResult<T>,
): { value: T } | { response: Response | Promise<Response> } {
	return result.ok ? { value: result.value } : { response: commonFailure(c, result.error) };
}

function koudenPage(
	c: Ctx,
	title: string,
	tab: KoudenTab,
	body: Child,
	options: { status?: 200 | 409 | 422; wide?: boolean } = {},
) {
	const kouden = c.get("kouden");
	return c.html(
		<Layout title={`${title} - ${kouden.title}`} user={c.get("user")}>
			<KoudenShell kouden={kouden} tab={tab} wide={options.wide}>
				{body}
			</KoudenShell>
		</Layout>,
		options.status ?? 200,
	);
}

function limitMessage(c: Ctx, limit: number): string {
	return c.get("kouden").memberRole === "owner"
		? `無料版で登録できる ${limit} 件に達しました。有料版（購入）の受付は準備中です。`
		: `無料版で登録できる ${limit} 件に達しました。オーナーに有料版の購入を依頼してください。`;
}

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
	return koudenPage(
		c,
		"トップ",
		"top",
		<KoudenTopPage kouden={c.get("kouden")} caller={c.get("caller")} overview={r.value} />,
	);
});

// ---- 受付 ---------------------------------------------------------------------

async function receptionProps(
	c: Ctx,
	requestedEventId: string | undefined,
	rest: Omit<ReceptionProps, "kouden" | "events" | "relationships" | "eventId">,
): Promise<ReceptionProps | null> {
	const caller = c.get("caller");
	const [events, relationships] = await Promise.all([
		ledger(c).listEvents(caller),
		ledger(c).listRelationships(caller),
	]);
	if (!events.ok || !relationships.ok) return null;
	const event = events.value.find((e) => e.id === requestedEventId) ?? events.value[0];
	if (!event) return null;
	return {
		kouden: c.get("kouden"),
		events: events.value,
		relationships: relationships.value,
		eventId: event.id,
		...rest,
	};
}

k.get("/reception", async (c) => {
	const caller = c.get("caller");
	if (!can(caller.role, "ledger.write")) return errorResponse(c, 403);
	let done: ReceptionDone | undefined;
	const doneId = c.req.query("done");
	if (doneId) {
		const gift = await ledger(c).getGift(caller, doneId);
		if (gift.ok) {
			const primary = gift.value.contributors[0];
			done = {
				giftId: gift.value.id,
				receiptNo: gift.value.receiptNo,
				eventName: gift.value.eventName,
				personLabel: primary ? personLabel(primary) : "",
				kind: gift.value.kind,
				amount: gift.value.amount,
			};
		}
	}
	const props = await receptionProps(c, c.req.query("event"), { values: { kind: "koden" }, done });
	if (!props) return errorResponse(c, 404);
	return koudenPage(c, "受付", "reception", <ReceptionPage {...props} />);
});

k.post("/reception", async (c) => {
	const caller = c.get("caller");
	const values = await formValues(c);
	const render = async (
		rest: Omit<ReceptionProps, "kouden" | "events" | "relationships" | "eventId">,
		status: 200 | 422,
	) => {
		const props = await receptionProps(c, values.eventId, rest);
		if (!props) return errorResponse(c, 404);
		return isHtmx(c)
			? c.html(<ReceptionPanel {...props} />, status)
			: koudenPage(c, "受付", "reception", <ReceptionPage {...props} />, { status });
	};
	// 入力エラーで再表示するとき、選んでいた候補を残す
	const candidatesFor = async () => {
		const q = values.name || values.organization;
		if (!q) return [];
		const r = await ledger(c).listPersons(caller, { q, limit: 8 });
		return r.ok ? r.value : [];
	};

	const parsed = receptionSchema.safeParse(values);
	if (!parsed.success) {
		return render(
			{ values, errors: toFieldErrors(parsed.error), candidates: await candidatesFor() },
			422,
		);
	}
	const result = await ledger(c).createAtReception(caller, parsed.data);
	if (!result.ok) {
		const { error } = result;
		if (error.code === "limit_reached") {
			return render({ values, message: limitMessage(c, error.limit) }, 422);
		}
		if (error.code === "invalid") {
			return render(
				{ values, errors: { [error.field]: error.message }, candidates: await candidatesFor() },
				422,
			);
		}
		return commonFailure(c, error);
	}

	const created = result.value;
	if (!isHtmx(c)) {
		return c.redirect(
			`${basePath(c)}/reception?event=${created.eventId}&done=${created.giftId}`,
			303,
		);
	}
	return render(
		{
			values: { kind: "koden" },
			done: {
				giftId: created.giftId,
				receiptNo: created.receiptNo,
				eventName: created.eventName,
				personLabel: created.personLabel,
				kind: parsed.data.gift.kind,
				amount: parsed.data.gift.amount ?? null,
			},
		},
		200,
	);
});

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
	if (!q) return c.html("");
	const r = await ledger(c).listPersons(c.get("caller"), { q, limit: 8 });
	if (!r.ok) return commonFailure(c, r.error);
	return c.html(<PersonCandidates persons={r.value} />);
});

// ---- いただきもの -------------------------------------------------------------

k.get("/gifts", async (c) => {
	const caller = c.get("caller");
	const filter = parseGiftFilter(c.req.query());
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
	status?: 200 | 409 | 422;
};

/** いただきものの画面を描画する。values を省略すると保存済みの内容をフォームに入れる */
async function renderGift(c: Ctx, giftId: string, options: GiftPageOptions = {}) {
	const caller = c.get("caller");
	const [gift, events] = await Promise.all([
		ledger(c).getGift(caller, giftId),
		ledger(c).listEvents(caller),
	]);
	if (!gift.ok) return commonFailure(c, gift.error);
	if (!events.ok) return commonFailure(c, events.error);
	return koudenPage(
		c,
		"いただきもの",
		"gifts",
		<GiftEditPage
			kouden={c.get("kouden")}
			gift={gift.value}
			events={events.value}
			canWrite={can(caller.role, "ledger.write")}
			values={options.values ?? giftFormValues(gift.value)}
			errors={options.errors}
			message={options.message}
			notice={noticeOf(c)}
			contributorValues={options.contributorValues}
			contributorErrors={options.contributorErrors}
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
) {
	if (result.ok) return c.redirect(`${basePath(c)}/gifts/${giftId}?notice=saved`, 303);
	const { error } = result;
	if (error.code === "conflict")
		return renderGift(c, giftId, { message: CONFLICT_MESSAGE, status: 409 });
	if (error.code === "invalid")
		return renderGift(c, giftId, { ...onInvalid(error.field, error.message), status: 422 });
	return commonFailure(c, error);
}

k.get("/gifts/:giftId", (c) => renderGift(c, c.req.param("giftId")));

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
	return afterGiftWrite(c, giftId, result, (field, message) => ({
		values,
		errors: { [field]: message },
	}));
});

k.post("/gifts/:giftId/delete", async (c) => {
	const giftId = c.req.param("giftId");
	const version = versionSchema.safeParse((await formValues(c)).version);
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
			status: 422,
		});
	}
	const result = await ledger(c).addContributor(c.get("caller"), giftId, version.data, parsed.data);
	return afterGiftWrite(c, giftId, result, (field, message) => ({
		contributorValues: values,
		contributorErrors: { [field]: message },
	}));
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
	return afterGiftWrite(c, giftId, result, (_f, message) => ({
		contributorErrors: { _form: message },
	}));
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
	return afterGiftWrite(c, giftId, result, (_f, message) => ({
		contributorErrors: { _form: message },
	}));
});

// ---- 差出人 -------------------------------------------------------------------

k.get("/persons", async (c) => {
	const caller = c.get("caller");
	const q = c.req.query("q")?.trim() || undefined;
	const persons = await ledger(c).listPersons(caller, q ? { q } : {});
	if (!persons.ok) return commonFailure(c, persons.error);
	return koudenPage(
		c,
		"差出人",
		"persons",
		<PersonsPage
			kouden={c.get("kouden")}
			persons={persons.value}
			canWrite={can(caller.role, "ledger.write")}
			q={q}
		/>,
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
	return c.html(<PersonRow kouden={kouden} person={ctx.person} canWrite={canWrite} q={q} />);
});

async function renderPerson(
	c: Ctx,
	personId: string,
	options: {
		values?: FormValues;
		errors?: FieldErrors;
		message?: string;
		status?: 200 | 409 | 422;
	} = {},
) {
	const caller = c.get("caller");
	const [person, relationships] = await Promise.all([
		ledger(c).getPerson(caller, personId),
		ledger(c).listRelationships(caller),
	]);
	if (!person.ok) return commonFailure(c, person.error);
	if (!relationships.ok) return commonFailure(c, relationships.error);
	return koudenPage(
		c,
		personLabel(person.value),
		"persons",
		<PersonPage
			kouden={c.get("kouden")}
			person={person.value}
			relationships={relationships.value}
			canWrite={can(caller.role, "ledger.write")}
			values={options.values ?? personFormValues(person.value)}
			errors={options.errors}
			message={options.message}
			notice={noticeOf(c)}
		/>,
		{ status: options.status },
	);
}

k.get("/persons/:personId", (c) => renderPerson(c, c.req.param("personId")));

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

	const result = await ledger(c).updatePerson(c.get("caller"), personId, version.data, parsed.data);
	if (!result.ok) {
		const { error } = result;
		if (error.code === "conflict") {
			return inline
				? editRow(personFormValues, {}, CONFLICT_MESSAGE, 409)
				: renderPerson(c, personId, { message: CONFLICT_MESSAGE, status: 409 });
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

	// 保存した行を表示に戻し、「保存して次へ」なら次の行を編集状態で開く（out-of-band で差し替え）
	const ctx = await personRowContext(c, personId, q);
	if (!ctx) return errorResponse(c, 404);
	const kouden = c.get("kouden");
	const next = values.go === "next" ? ctx.next : undefined;
	let hasNextAfterNext = false;
	if (next) hasNextAfterNext = (await personRowContext(c, next.id, q))?.next !== undefined;
	return c.html(
		<>
			<PersonRow kouden={kouden} person={ctx.person} canWrite q={q} />
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
	const [events, relationships] = await Promise.all([
		ledger(c).listEvents(caller),
		ledger(c).listRelationships(caller),
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
				options.koudenValues ?? { title: kouden.title, deceasedName: kouden.deceasedName }
			}
			koudenErrors={options.koudenErrors}
			deleteError={options.deleteError}
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

k.get("/settings", (c) => renderSettings(c));

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
	await setKoudenStatus(c.env.DB, kouden.id, archived ? "archived" : "active", c.get("now"));
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

koudenRoutes.route("/k/:koudenId", k);
