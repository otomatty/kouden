import { formatYen, PAID_PRICE_JPY } from "@kouden/domain";
import type { Context } from "hono";
import type { Child } from "hono/jsx";
import { ledgerFor } from "../ledger/client.ts";
import type { LedgerError, LedgerResult } from "../ledger/types.ts";
import type { AppEnv } from "../types.ts";
import type { FormValues } from "@kouden/ui";
import { type KoudenTab, KoudenShell } from "../views/kouden/shell.tsx";
import { Layout } from "../views/layout.tsx";
import { ErrorPage } from "../views/pages/error.tsx";

/** 香典帳の中の画面で共通に使う処理 */

export type Ctx = Context<AppEnv>;

/** リダイレクト後に表示するお知らせ（URL には既知のキーだけを載せる） */
export const NOTICES = {
	saved: "保存しました。",
	deceased_name_confirmed: "故人のお名前を確認しました。",
	deleted: "削除しました。",
	undone: "登録を取り消しました。",
	archived: "アーカイブしました。",
	unarchived: "アーカイブを解除しました。",
	invited: "招待リンクを作成しました。",
	revoked: "招待リンクを無効にしました。",
	role: "ロールを変更しました。",
	removed: "メンバーを除外しました。",
	transfer: "オーナーの譲渡を申し出ました。相手が承諾すると入れ替わります。",
	transfer_cancelled: "オーナーの譲渡を取り消しました。",
	transfer_declined: "オーナーの譲渡を辞退しました。",
	owner: "オーナーになりました。",
	joined: "香典帳に参加しました。",
	purchased: "お支払いが完了しました。この香典帳は有料版になり、件数の上限がなくなりました。",
	purchase_pending:
		"お支払いの完了を確認しています。コンビニ払いなどの場合は、お支払いが済むと有料版になります。",
	purchase_cancelled: "購入を取りやめました。",
	purchase_refunded: "この支払いは返金済みのため、無料版のままです。",
	purchase_unavailable: "現在、購入の受付を停止しています。時間をおいてもう一度お試しください。",
} as const;

export const CONFLICT_MESSAGE =
	"開いている間に他の人が更新しました。最新の内容を表示しています。もう一度入力してから保存してください。";

export function noticeOf(c: Ctx): string | undefined {
	const key = c.req.query("notice");
	return key && key in NOTICES ? NOTICES[key as keyof typeof NOTICES] : undefined;
}

export async function formValues(c: Ctx): Promise<FormValues> {
	const body = await c.req.parseBody();
	const values: FormValues = {};
	for (const [key, value] of Object.entries(body)) {
		if (typeof value === "string") values[key] = value;
	}
	return values;
}

export const isHtmx = (c: Ctx) => c.req.header("HX-Request") === "true";
export const ledger = (c: Ctx) => ledgerFor(c.env, c.get("kouden").id);
export const basePath = (c: Ctx) => `/k/${c.get("kouden").id}`;

export function errorResponse(c: Ctx, status: 403 | 404) {
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
export function commonFailure(c: Ctx, error: LedgerError) {
	return errorResponse(c, error.code === "forbidden" ? 403 : 404);
}

/** DO の読み取り結果を取り出す。失敗ならエラー画面のレスポンスを返す */
export function unwrap<T>(
	c: Ctx,
	result: LedgerResult<T>,
): { value: T } | { response: Response | Promise<Response> } {
	return result.ok ? { value: result.value } : { response: commonFailure(c, result.error) };
}

export function koudenPage(
	c: Ctx,
	title: string,
	tab: KoudenTab,
	body: Child,
	options: { status?: 200 | 409 | 422; wide?: boolean } = {},
) {
	const kouden = c.get("kouden");
	return c.html(
		<Layout title={`${title} - ${kouden.title}`} user={c.get("user")}>
			<KoudenShell
				kouden={kouden}
				caller={c.get("caller")}
				renderSeq={c.get("renderSeq")}
				tab={tab}
				wide={options.wide}
			>
				{body}
			</KoudenShell>
		</Layout>,
		options.status ?? 200,
	);
}

/** 無料版の上限に達したときの案内（E9-2）。購入できるのはオーナーだけ */
export function limitMessage(c: Ctx, limit: number) {
	if (c.get("kouden").memberRole !== "owner") {
		return `無料版で登録できる ${limit} 件に達しました。オーナーに有料版の購入を依頼してください。`;
	}
	return (
		<>
			無料版で登録できる {limit} 件に達しました。{" "}
			<a href={`${basePath(c)}/settings#billing`} class="font-medium underline underline-offset-4">
				有料版を購入する（{formatYen(PAID_PRICE_JPY)}）
			</a>
			と、件数の上限がなくなります。
		</>
	);
}
