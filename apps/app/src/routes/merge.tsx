import { can, findDuplicatePersons, versionSchema } from "@kouden/domain";
import type { Hono } from "hono";
import type { AppEnv } from "../types.ts";
import { PersonMergeChoosePage, PersonMergeConfirmPage } from "../views/kouden/person-merge.tsx";
import {
	basePath,
	commonFailure,
	type Ctx,
	errorResponse,
	formValues,
	koudenPage,
	ledger,
} from "./helpers.tsx";

/** 差出人の統合（E5-2）。:personId が残す差出人、from がまとめて消す差出人 */

const MERGE_CONFLICT_MESSAGE =
	"開いている間に他の人が差出人を更新しました。最新の内容を確かめて、もう一度まとめてください";

async function renderMerge(
	c: Ctx,
	intoId: string,
	fromId: string | undefined,
	options: { message?: string; status?: 200 | 409 | 422 } = {},
) {
	const caller = c.get("caller");
	const into = await ledger(c).getPerson(caller, intoId);
	if (!into.ok) return commonFailure(c, into.error);

	if (fromId && fromId !== intoId) {
		const from = await ledger(c).getPerson(caller, fromId);
		if (!from.ok) return commonFailure(c, from.error);
		return koudenPage(
			c,
			"差出人をまとめる",
			"persons",
			<PersonMergeConfirmPage
				kouden={c.get("kouden")}
				into={into.value}
				from={from.value}
				message={options.message}
			/>,
			{ wide: true, status: options.status },
		);
	}

	const q = c.req.query("q")?.trim() || undefined;
	const [persons, found] = await Promise.all([
		ledger(c).listPersons(caller, {}),
		q ? ledger(c).listPersons(caller, { q }) : Promise.resolve(undefined),
	]);
	if (!persons.ok) return commonFailure(c, persons.error);
	if (found && !found.ok) return commonFailure(c, found.error);
	const duplicates = new Set(findDuplicatePersons(persons.value).get(intoId));
	return koudenPage(
		c,
		"差出人をまとめる",
		"persons",
		<PersonMergeChoosePage
			kouden={c.get("kouden")}
			into={into.value}
			candidates={persons.value.filter((p) => duplicates.has(p.id))}
			results={found?.value.filter((p) => p.id !== intoId)}
			q={q}
		/>,
	);
}

export function registerMergeRoutes(k: Hono<AppEnv>) {
	k.get("/persons/:personId/merge", async (c) => {
		if (!can(c.get("caller").role, "ledger.write")) return errorResponse(c, 403);
		return renderMerge(c, c.req.param("personId"), c.req.query("from"));
	});

	k.post("/persons/:personId/merge", async (c) => {
		const caller = c.get("caller");
		if (!can(caller.role, "ledger.write")) return errorResponse(c, 403);
		const intoId = c.req.param("personId");
		const values = await formValues(c);
		const fromId = values.fromId;
		if (!fromId) return renderMerge(c, intoId, undefined);
		const intoVersion = versionSchema.safeParse(values.intoVersion);
		const fromVersion = versionSchema.safeParse(values.fromVersion);
		if (!intoVersion.success || !fromVersion.success) {
			return renderMerge(c, intoId, fromId, {
				message: "画面を読み込み直してください",
				status: 422,
			});
		}
		const result = await ledger(c).mergePersons(
			caller,
			intoId,
			intoVersion.data,
			fromId,
			fromVersion.data,
		);
		if (!result.ok) {
			const { error } = result;
			if (error.code === "conflict") {
				return renderMerge(c, intoId, fromId, { message: MERGE_CONFLICT_MESSAGE, status: 409 });
			}
			if (error.code === "invalid") {
				return renderMerge(c, intoId, fromId, { message: error.message, status: 422 });
			}
			return commonFailure(c, error);
		}
		return c.redirect(`${basePath(c)}/persons/${intoId}?notice=merged`, 303);
	});
}
