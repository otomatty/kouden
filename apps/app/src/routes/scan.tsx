import { can, photoReadingSchema, toPhotoDraft } from "@kouden/domain";
import type { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { log } from "../lib/logger.ts";
import type { AppEnv } from "../types.ts";
import { GiftScanPage } from "../views/kouden/gift-scan.tsx";
import {
	basePath,
	commonFailure,
	type Ctx,
	entrySummary,
	errorResponse,
	koudenPage,
	ledger,
} from "./helpers.tsx";

/**
 * 写真で登録（08 案 D、ADR-T16）。撮った写真を読み取りの API に送り、結果を下書きにする。
 * 写真はブラウザのメモリにだけ置き、サーバーは読み取りに使うだけで保存もログへの出力もしない。
 * 下書きの登録は表で入力と同じ JSON の API（POST /gifts/sheet）で行う
 */

/** 送れる写真の大きさ。画面は長い辺 1600px の JPEG にしてから送るので、通常は 1MB に満たない */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 写真で登録の画面へのリンク。読み取りが無効か、登録できないロールなら出さない */
export function scanHref(c: Ctx, eventId?: string): string | undefined {
	if (!c.get("photoReader")() || !can(c.get("caller").role, "ledger.write")) return undefined;
	return `${basePath(c)}/gifts/scan${eventId ? `?event=${eventId}` : ""}`;
}

export function registerScanRoutes(k: Hono<AppEnv>) {
	k.get("/gifts/scan", async (c) => {
		const caller = c.get("caller");
		if (!c.get("photoReader")()) return errorResponse(c, 404);
		if (!can(caller.role, "ledger.write")) return errorResponse(c, 403);
		const [events, overview] = await Promise.all([
			ledger(c).listEvents(caller),
			ledger(c).overview(caller),
		]);
		if (!events.ok) return commonFailure(c, events.error);
		if (!overview.ok) return commonFailure(c, overview.error);
		const event = events.value.find((e) => e.id === c.req.query("event")) ?? events.value[0];
		if (!event) return errorResponse(c, 404);
		return koudenPage(
			c,
			"写真で登録",
			"gifts",
			<GiftScanPage
				kouden={c.get("kouden")}
				events={events.value}
				eventId={event.id}
				summary={entrySummary(c, overview.value, event)}
			/>,
		);
	});

	k.post(
		"/gifts/read",
		bodyLimit({
			maxSize: PHOTO_MAX_BYTES,
			onError: (c) => c.json({ error: "too_large" }, 413),
		}),
		async (c) => {
			const reader = c.get("photoReader")();
			if (!reader) return c.json({ error: "not_found" }, 404);
			if (!can(c.get("caller").role, "ledger.write")) return c.json({ error: "forbidden" }, 403);
			const type = (c.req.header("Content-Type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
			if (!PHOTO_TYPES.has(type)) return c.json({ error: "unsupported_type" }, 415);
			const bytes = await c.req.arrayBuffer();
			if (bytes.byteLength === 0) return c.json({ error: "empty" }, 400);

			const result = await reader
				.read({ bytes, type })
				.then((reading) => photoReadingSchema.safeParse(reading))
				.catch(() => null);
			if (!result?.success) {
				// 写真と読み取った内容は記録しない（ADR-T16）
				log("warn", "photo_read_failed", { requestId: c.get("requestId") });
				return c.json({ error: "read_failed" }, 502);
			}
			c.header("Cache-Control", "no-store");
			return c.json({ draft: toPhotoDraft(result.data) });
		},
	);
}
