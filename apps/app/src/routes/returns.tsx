import {
	can,
	type FieldErrors,
	onDayAmountSchema,
	returnItemSchema,
	returnLineSchema,
	returnRuleSchema,
	returnSchema,
	suggestReturn,
	toFieldErrors,
	versionSchema,
} from "@kouden/domain";
import type { Hono } from "hono";
import { deleteFile, isObjectId, putReturnItemImage, returnItemImageKey } from "../kouden/files.ts";
import type { LedgerResult } from "../ledger/types.ts";
import type { AppEnv } from "../types.ts";
import type { FormValues } from "@kouden/ui";
import { ReturnEditPage, returnFormValues } from "../views/kouden/return-edit.tsx";
import {
	ReturnItemsSection,
	ReturnRulesSection,
	ReturnSettingsPage,
} from "../views/kouden/return-settings.tsx";
import {
	parseReturnFilter,
	type ProposalRow,
	ReturnsBoardRegion,
	ReturnsPage,
} from "../views/kouden/returns.tsx";
import {
	basePath,
	commonFailure,
	CONFLICT_MESSAGE,
	type Ctx,
	errorResponse,
	formValues,
	koudenPage,
	ledger,
	noticeOf,
	unwrap,
} from "./helpers.tsx";

/** 香典返し（E6）の画面。koudens.tsx の `/k/:koudenId` 配下に登録する */
export function registerReturnRoutes(k: Hono<AppEnv>): void {
	// ---- 一覧・一括提案（E6-3, E6-4） ----
	k.get("/returns", async (c) => {
		const onDay = onDayAmountSchema.safeParse(c.req.query("onDay"));
		return renderBoard(c, {
			onDay: onDay.success ? (onDay.data ?? 0) : 0,
			error: onDay.success ? undefined : (onDay.error.issues[0]?.message ?? undefined),
		});
	});

	k.post("/returns/confirm", async (c) => {
		const body = await c.req.parseBody({ all: true });
		const onDay = onDayAmountSchema.safeParse(text(body.onDay));
		if (!onDay.success)
			return renderBoard(c, { error: "当日返しの額を確認してください", status: 422 });
		const persons = [body.persons ?? []].flat().map(text).filter(Boolean);
		if (persons.length === 0) {
			return renderBoard(c, {
				onDay: onDay.data ?? 0,
				error: "確定する差出人を選んでください",
				status: 422,
			});
		}
		const entries = persons.map((personId) => ({
			personId,
			itemId: text(body[`item_${personId}`]) || null,
			onDayAmount: onDay.data ?? 0,
		}));
		const result = await ledger(c).confirmReturns(c.get("caller"), entries);
		if (!result.ok) {
			if (result.error.code === "invalid") {
				return renderBoard(c, { onDay: onDay.data ?? 0, error: result.error.message, status: 422 });
			}
			return commonFailure(c, result.error);
		}
		const { created, skipped } = result.value;
		return c.redirect(
			`${basePath(c)}/returns?notice=confirmed&created=${created}&skipped=${skipped}`,
			303,
		);
	});

	// ---- 差出人ごとの香典返し ----
	k.post("/persons/:personId/return", async (c) => {
		const personId = c.req.param("personId");
		const result = await ledger(c).createReturn(c.get("caller"), personId);
		if (result.ok) return c.redirect(`${basePath(c)}/returns/${result.value.id}`, 303);
		if (result.error.code === "invalid") {
			// 他の人が先に作っていた場合は、その香典返しを開く
			const person = await ledger(c).getPerson(c.get("caller"), personId);
			if (person.ok && person.value.ret) {
				return c.redirect(`${basePath(c)}/returns/${person.value.ret.id}`, 303);
			}
		}
		return commonFailure(c, result.error);
	});

	k.get("/returns/settings", async (c) => {
		const caller = c.get("caller");
		const partial = c.req.query("partial");
		const [items, rules] = await Promise.all([
			ledger(c).listReturnItems(caller),
			ledger(c).listReturnRules(caller),
		]);
		if (!items.ok) return commonFailure(c, items.error);
		if (!rules.ok) return commonFailure(c, rules.error);
		const kouden = c.get("kouden");
		if (partial === "items") {
			return c.html(<ReturnItemsSection kouden={kouden} caller={caller} items={items.value} />);
		}
		if (partial === "rules") {
			return c.html(
				<ReturnRulesSection
					kouden={kouden}
					caller={caller}
					items={items.value}
					rules={rules.value}
				/>,
			);
		}
		return renderSettings(c);
	});

	k.get("/returns/:returnId", async (c) => renderReturn(c, c.req.param("returnId")));

	k.post("/returns/:returnId", async (c) => {
		const returnId = c.req.param("returnId");
		const values = await formValues(c);
		const version = versionSchema.safeParse(values.version);
		const parsed = returnSchema.safeParse(values);
		if (!version.success)
			return renderReturn(c, returnId, { error: CONFLICT_MESSAGE, status: 409 });
		if (!parsed.success) {
			return renderReturn(c, returnId, {
				values,
				errors: toFieldErrors(parsed.error),
				status: 422,
			});
		}
		const result = await ledger(c).updateReturn(
			c.get("caller"),
			returnId,
			version.data,
			parsed.data,
		);
		if (result.ok) return c.redirect(`${basePath(c)}/returns/${returnId}?notice=saved`, 303);
		if (result.error.code === "conflict") {
			return renderReturn(c, returnId, { values, conflict: true, status: 409 });
		}
		return commonFailure(c, result.error);
	});

	k.post("/returns/:returnId/lines", async (c) => {
		const returnId = c.req.param("returnId");
		const values = await formValues(c);
		const version = versionSchema.safeParse(values.version);
		const parsed = returnLineSchema.safeParse(values);
		if (!version.success)
			return renderReturn(c, returnId, { error: CONFLICT_MESSAGE, status: 409 });
		if (!parsed.success) {
			return renderReturn(c, returnId, {
				lineValues: values,
				lineErrors: toFieldErrors(parsed.error),
				status: 422,
			});
		}
		const result = await ledger(c).addReturnLine(
			c.get("caller"),
			returnId,
			version.data,
			parsed.data,
		);
		return afterLineWrite(c, returnId, result, values);
	});

	k.post("/returns/:returnId/lines/:lineId/delete", async (c) => {
		const returnId = c.req.param("returnId");
		const version = versionSchema.safeParse((await formValues(c)).version);
		if (!version.success)
			return renderReturn(c, returnId, { error: CONFLICT_MESSAGE, status: 409 });
		const result = await ledger(c).removeReturnLine(
			c.get("caller"),
			returnId,
			version.data,
			c.req.param("lineId"),
		);
		return afterLineWrite(c, returnId, result, {});
	});

	k.post("/returns/:returnId/delete", async (c) => {
		const returnId = c.req.param("returnId");
		const version = versionSchema.safeParse((await formValues(c)).version);
		if (!version.success)
			return renderReturn(c, returnId, { error: CONFLICT_MESSAGE, status: 409 });
		const result = await ledger(c).deleteReturn(c.get("caller"), returnId, version.data);
		if (result.ok) return c.redirect(`${basePath(c)}/returns?notice=deleted`, 303);
		if (result.error.code === "conflict") {
			return renderReturn(c, returnId, { error: CONFLICT_MESSAGE, status: 409 });
		}
		return commonFailure(c, result.error);
	});

	// ---- カタログ（E6-1） ----
	k.post("/return-items", async (c) => {
		// 画像を R2 に置く前に権限を確かめる
		if (!can(c.get("caller").role, "settings.write")) return errorResponse(c, 403);
		const form = await readItemForm(c);
		if ("error" in form) return renderSettings(c, { error: form.error, status: 422 });
		const result = await ledger(c).createReturnItem(
			c.get("caller"),
			form.input,
			form.imageKey ?? null,
		);
		if (!result.ok) await deleteFile(c.env, form.imageKey ?? null);
		return afterSettingsWrite(c, result, "items");
	});

	k.post("/return-items/:itemId", async (c) => {
		if (!can(c.get("caller").role, "settings.write")) return errorResponse(c, 403);
		const form = await readItemForm(c);
		if ("error" in form) return renderSettings(c, { error: form.error, status: 422 });
		const version = versionSchema.safeParse(form.values.version);
		if (!version.success) {
			await deleteFile(c.env, form.imageKey ?? null);
			return renderSettings(c, { error: CONFLICT_MESSAGE, status: 409 });
		}
		const image = form.imageKey ?? (form.values.removeImage === "1" ? null : undefined);
		const result = await ledger(c).updateReturnItem(
			c.get("caller"),
			c.req.param("itemId"),
			version.data,
			form.input,
			image,
		);
		if (result.ok) await deleteFile(c.env, result.value.removedImageKey);
		else await deleteFile(c.env, form.imageKey ?? null);
		return afterSettingsWrite(c, result, "items");
	});

	k.post("/return-items/:itemId/move", async (c) => {
		const dir = (await formValues(c)).direction === "up" ? "up" : "down";
		return afterSettingsWrite(
			c,
			await ledger(c).moveReturnItem(c.get("caller"), c.req.param("itemId"), dir),
			"items",
		);
	});

	k.post("/return-items/:itemId/active", async (c) => {
		const active = (await formValues(c)).active === "1";
		return afterSettingsWrite(
			c,
			await ledger(c).setReturnItemActive(c.get("caller"), c.req.param("itemId"), active),
			"items",
		);
	});

	k.post("/return-items/:itemId/delete", async (c) => {
		const result = await ledger(c).deleteReturnItem(c.get("caller"), c.req.param("itemId"));
		if (result.ok) await deleteFile(c.env, result.value.imageKey);
		return afterSettingsWrite(c, result, "items");
	});

	// ---- 金額帯ルール（E6-2） ----
	k.post("/return-rules", async (c) => {
		const parsed = returnRuleSchema.safeParse(await formValues(c));
		if (!parsed.success) return renderSettings(c, { error: firstError(parsed.error), status: 422 });
		return afterSettingsWrite(
			c,
			await ledger(c).createReturnRule(c.get("caller"), parsed.data),
			"rules",
		);
	});

	k.post("/return-rules/:ruleId", async (c) => {
		const values = await formValues(c);
		const version = versionSchema.safeParse(values.version);
		const parsed = returnRuleSchema.safeParse(values);
		if (!version.success) return renderSettings(c, { error: CONFLICT_MESSAGE, status: 409 });
		if (!parsed.success) return renderSettings(c, { error: firstError(parsed.error), status: 422 });
		const result = await ledger(c).updateReturnRule(
			c.get("caller"),
			c.req.param("ruleId"),
			version.data,
			parsed.data,
		);
		return afterSettingsWrite(c, result, "rules");
	});

	k.post("/return-rules/:ruleId/delete", async (c) =>
		afterSettingsWrite(
			c,
			await ledger(c).deleteReturnRule(c.get("caller"), c.req.param("ruleId")),
			"rules",
		),
	);

	// ---- 画像の配信（R2 は非公開。メンバーであることを koudenAccess で確認済み） ----
	k.get("/files/return-items/:objectId", async (c) => {
		const objectId = c.req.param("objectId");
		if (!isObjectId(objectId)) return c.notFound();
		const object = await c.env.FILES.get(returnItemImageKey(c.get("kouden").id, objectId));
		if (!object) return c.notFound();
		return new Response(object.body, {
			headers: {
				"Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
				"Content-Length": String(object.size),
				// キーは画像を差し替えるたびに変わるので、長くキャッシュしてよい（本人のブラウザだけ）
				"Cache-Control": "private, max-age=31536000, immutable",
				ETag: object.httpEtag,
				"X-Content-Type-Options": "nosniff",
				"Content-Security-Policy": "default-src 'none'; sandbox",
			},
		});
	});
}

/** multipart / 繰り返しの値のうち、文字列だけを取り出す */
const text = (v: unknown) => (typeof v === "string" ? v : "");

/** 件数のクエリ（不正な値は 0） */
const countParam = (v: string | undefined) => (/^\d{1,5}$/.test(v ?? "") ? Number(v) : 0);

// ---- 画面の組み立て ------------------------------------------------------------

async function renderBoard(
	c: Ctx,
	options: { onDay?: number; error?: string | undefined; status?: 200 | 422 } = {},
) {
	const caller = c.get("caller");
	const r = unwrap(c, await ledger(c).returnsBoard(caller));
	if ("response" in r) return r.response;
	const board = r.value;
	const onDay = options.onDay ?? 0;
	const proposals: ProposalRow[] = board.rows
		.filter((row) => !row.ret && row.person.kodenTotal > 0)
		.map((row) => ({
			person: row.person,
			suggestion: suggestReturn({
				total: row.person.kodenTotal,
				onDayAmount: onDay,
				rules: board.rules,
				items: board.items,
			}),
		}));
	const props = {
		kouden: c.get("kouden"),
		caller,
		board,
		proposals,
		filter: parseReturnFilter(c.req.query("status")),
		onDay,
	};
	// 他の人の変更を受けて取り直す場合（ledger-live.js）は部分だけを返す
	if (c.req.query("partial") === "board") return c.html(<ReturnsBoardRegion {...props} />);
	return koudenPage(
		c,
		"香典返し",
		"returns",
		<ReturnsPage {...props} notice={boardNotice(c)} error={options.error} />,
		{ status: options.status, wide: true },
	);
}

async function renderSettings(c: Ctx, options: { error?: string; status?: 200 | 409 | 422 } = {}) {
	const caller = c.get("caller");
	const [items, rules] = await Promise.all([
		ledger(c).listReturnItems(caller),
		ledger(c).listReturnRules(caller),
	]);
	if (!items.ok) return commonFailure(c, items.error);
	if (!rules.ok) return commonFailure(c, rules.error);
	return koudenPage(
		c,
		"香典返しの設定",
		"returns",
		<ReturnSettingsPage
			kouden={c.get("kouden")}
			caller={caller}
			items={items.value}
			rules={rules.value}
			error={options.error}
			notice={noticeOf(c)}
		/>,
		{ status: options.status },
	);
}

/** 一括確定の後は作成した件数を出す */
function boardNotice(c: Ctx): string | undefined {
	if (c.req.query("notice") !== "confirmed") return noticeOf(c);
	const skipped = countParam(c.req.query("skipped"));
	return `${countParam(c.req.query("created"))} 件の香典返しを作成しました。${
		skipped > 0 ? `（${skipped} 件は作成済みのため飛ばしました）` : ""
	}`;
}

function afterSettingsWrite(c: Ctx, result: LedgerResult<unknown>, anchor: string) {
	if (result.ok) return c.redirect(`${basePath(c)}/returns/settings?notice=saved#${anchor}`, 303);
	const { error } = result;
	if (error.code === "conflict") return renderSettings(c, { error: CONFLICT_MESSAGE, status: 409 });
	if (error.code === "invalid") return renderSettings(c, { error: error.message, status: 422 });
	return commonFailure(c, error);
}

async function renderReturn(
	c: Ctx,
	returnId: string,
	options: {
		values?: FormValues;
		errors?: FieldErrors;
		lineValues?: FormValues;
		lineErrors?: FieldErrors;
		conflict?: boolean;
		error?: string;
		status?: 200 | 409 | 422;
	} = {},
) {
	const caller = c.get("caller");
	const [ret, items, history] = await Promise.all([
		ledger(c).getReturn(caller, returnId),
		ledger(c).listReturnItems(caller),
		ledger(c).history(caller, "return", returnId),
	]);
	if (!ret.ok) return commonFailure(c, ret.error);
	if (!items.ok) return commonFailure(c, items.error);
	if (!history.ok) return commonFailure(c, history.error);
	const latest = returnFormValues(ret.value);
	// 競合: フォームには自分の入力と最新の version を入れる（そのまま保存すれば上書き）
	const values = options.values
		? { ...options.values, version: options.conflict ? latest.version : options.values.version }
		: latest;
	return koudenPage(
		c,
		"香典返し",
		"returns",
		<ReturnEditPage
			kouden={c.get("kouden")}
			caller={caller}
			ret={ret.value}
			items={items.value}
			history={history.value}
			dueDate={ret.value.koudenDueDate}
			values={values}
			errors={options.errors}
			lineValues={options.lineValues}
			lineErrors={options.lineErrors}
			conflictLatest={options.conflict ? latest : undefined}
			error={options.error}
			notice={noticeOf(c)}
		/>,
		{ status: options.status },
	);
}

function afterLineWrite(
	c: Ctx,
	returnId: string,
	result: LedgerResult<unknown>,
	values: FormValues,
) {
	if (result.ok)
		return c.redirect(`${basePath(c)}/returns/${returnId}?notice=saved#return-lines`, 303);
	const { error } = result;
	if (error.code === "conflict") {
		return renderReturn(c, returnId, {
			lineValues: values,
			error: CONFLICT_MESSAGE,
			status: 409,
		});
	}
	if (error.code === "invalid") {
		return renderReturn(c, returnId, {
			lineValues: values,
			lineErrors: { [error.field]: error.message },
			status: 422,
		});
	}
	return commonFailure(c, error);
}

/** 返礼品のフォーム（multipart）。画像があれば検査して R2 に置く */
async function readItemForm(c: Ctx): Promise<
	| {
			values: FormValues;
			input: ReturnType<typeof returnItemSchema.parse>;
			imageKey?: string;
	  }
	| { error: string }
> {
	const body = await c.req.parseBody();
	const values: FormValues = {};
	for (const [key, value] of Object.entries(body)) {
		if (typeof value === "string") values[key] = value;
	}
	const parsed = returnItemSchema.safeParse(values);
	if (!parsed.success) return { error: firstError(parsed.error) };
	const file = body.image;
	if (file instanceof File && file.size > 0) {
		const put = await putReturnItemImage(c.env, c.get("kouden").id, file);
		if ("error" in put) return { error: put.error };
		return { values, input: parsed.data, imageKey: put.key };
	}
	return { values, input: parsed.data };
}

function firstError(error: { issues: readonly { message: string }[] }): string {
	return error.issues[0]?.message ?? "入力内容を確認してください";
}
