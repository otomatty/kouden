import type { Hono } from "hono";
import type { OutputData } from "../ledger/types.ts";
import { addressRows, returnRows, safeFileName } from "../output/rows.ts";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "../output/xlsx.ts";
import type { AppEnv } from "../types.ts";
import { jstDateOf } from "../views/format.ts";
import { OutputPage } from "../views/kouden/output.tsx";
import { PrintAddressesPage, PrintGiftsPage, PrintReturnsPage } from "../views/kouden/print.tsx";
import { parseReturnFilter, RETURN_FILTERS } from "../views/kouden/returns.tsx";
import { type Ctx, koudenPage, ledger, unwrap } from "./helpers.tsx";

/** 個人情報を含むので、ブラウザ・中継のキャッシュに残さない */
const NO_STORE = { "Cache-Control": "private, no-store" } as const;

/** 印刷・出力（E7-2, E7-3）。閲覧者も使える（03 §5） */
export function registerOutputRoutes(k: Hono<AppEnv>): void {
	k.get("/output", async (c) => {
		const r = unwrap(c, await ledger(c).listEvents(c.get("caller")));
		if ("response" in r) return r.response;
		return koudenPage(
			c,
			"印刷・出力",
			"output",
			<OutputPage kouden={c.get("kouden")} events={r.value} />,
		);
	});

	k.get("/print/gifts", async (c) => {
		const r = await outputData(c);
		if ("response" in r) return r.response;
		const eventId = c.req.query("event") || undefined;
		if (eventId && !r.value.events.some((e) => e.id === eventId)) return c.notFound();
		return c.html(
			<PrintGiftsPage
				kouden={c.get("kouden")}
				data={r.value}
				eventId={eventId}
				printedAt={c.get("now")}
			/>,
			200,
			NO_STORE,
		);
	});

	k.get("/print/returns", async (c) => {
		const r = await outputData(c);
		if ("response" in r) return r.response;
		const filter = parseReturnFilter(c.req.query("status"));
		const rows = returnRows(r.value).filter(({ ret }) =>
			filter === "all" ? true : filter === "none" ? !ret : ret?.status === filter,
		);
		return c.html(
			<PrintReturnsPage
				kouden={c.get("kouden")}
				rows={rows}
				filterLabel={
					filter === "all" ? undefined : RETURN_FILTERS.find((f) => f.value === filter)?.label
				}
				printedAt={c.get("now")}
			/>,
			200,
			NO_STORE,
		);
	});

	k.get("/print/addresses", async (c) => {
		const r = await outputData(c);
		if ("response" in r) return r.response;
		const shippingOnly = c.req.query("only") === "shipping";
		const data = shippingOnly ? { ...r.value, persons: personsShippedTo(r.value) } : r.value;
		const { rows, withoutAddress } = addressRows(data);
		return c.html(
			<PrintAddressesPage
				kouden={c.get("kouden")}
				rows={rows}
				withoutAddress={withoutAddress}
				shippingOnly={shippingOnly}
				printedAt={c.get("now")}
			/>,
			200,
			NO_STORE,
		);
	});

	k.get("/export.xlsx", async (c) => {
		const r = await outputData(c);
		if ("response" in r) return r.response;
		const kouden = c.get("kouden");
		const name = `${safeFileName(kouden.title)}_${ymd(c.get("now"))}.xlsx`;
		return new Response(await buildWorkbook(r.value), {
			headers: {
				...NO_STORE,
				"Content-Type": XLSX_CONTENT_TYPE,
				// 日本語のファイル名は RFC 6266 の filename* で渡す（古いブラウザ向けに ASCII の名前も付ける）
				"Content-Disposition": `attachment; filename="kouden.xlsx"; filename*=UTF-8''${rfc5987(name)}`,
			},
		});
	});
}

const outputData = async (c: Ctx) => unwrap(c, await ledger(c).outputData(c.get("caller")));

/** 香典返しを配送する（渡し方が「配送」の）差出人だけに絞る */
function personsShippedTo(data: OutputData) {
	const shipping = new Set(
		data.returns.filter((r) => r.method === "shipping").map((r) => r.personId),
	);
	return data.persons.filter((p) => shipping.has(p.id));
}

/** RFC 5987 の値（encodeURIComponent が残す ' ( ) * も符号化する） */
const rfc5987 = (value: string) =>
	encodeURIComponent(value).replace(
		/['()*]/g,
		(ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
	);

/** 日本時間の日付（20261012） */
const ymd = (d: Date) => jstDateOf(d.toISOString()).replaceAll("-", "");
