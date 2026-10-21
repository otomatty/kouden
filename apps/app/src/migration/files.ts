import { Hono } from "hono";
import { importFileKeySchema } from "@kouden/domain";
import { detectImageType, MAX_IMAGE_BYTES } from "../kouden/files.ts";
import type { AppEnv } from "../types.ts";

function validKey(key: string): boolean {
	return importFileKeySchema.safeParse(key).success;
}

const hex = (bytes: ArrayBuffer) =>
	Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");

/** 親の importAuth と bodyLimit の内側だけでマウントする。Supabase の URL をサーバーから取得しない。 */
export function importFileRoutes() {
	const r = new Hono<AppEnv>();
	r.put("/files", async (c) => {
		const key = c.req.query("key") ?? "";
		const digest = c.req.header("X-Content-SHA256") ?? "";
		if (!validKey(key) || !/^[0-9a-f]{64}$/.test(digest)) return c.json({ error: "invalid" }, 400);
		const bytes = await c.req.arrayBuffer();
		if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES)
			return c.json({ error: "size" }, 413);
		const contentType = detectImageType(new Uint8Array(bytes).subarray(0, 16));
		if (!contentType) return c.json({ error: "image_type" }, 415);
		if (hex(await crypto.subtle.digest("SHA-256", bytes)) !== digest)
			return c.json({ error: "checksum" }, 400);
		await c.env.FILES.put(key, bytes, { sha256: digest, httpMetadata: { contentType } });
		return c.json({ key, size: bytes.byteLength, sha256: digest });
	});
	r.get("/files", async (c) => {
		const key = c.req.query("key") ?? "";
		if (!validKey(key)) return c.json({ error: "invalid" }, 400);
		const object = await c.env.FILES.head(key);
		if (!object) return c.json({ error: "not_found" }, 404);
		return c.json({
			key,
			size: object.size,
			sha256: object.checksums.sha256 ? hex(object.checksums.sha256) : null,
		});
	});
	// 切り戻し専用（親で rollback の認証になる）。本体を返し、送信した内容の SHA-256 を添える。
	r.get("/rollback/files", async (c) => {
		const key = c.req.query("key") ?? "";
		if (!validKey(key)) return c.json({ error: "invalid" }, 400);
		const object = await c.env.FILES.get(key);
		if (!object) return c.json({ error: "not_found" }, 404);
		const bytes = await object.arrayBuffer();
		const sha256 = hex(await crypto.subtle.digest("SHA-256", bytes));
		if (object.checksums.sha256 && hex(object.checksums.sha256) !== sha256)
			return c.json({ error: "checksum" }, 500);
		return c.body(bytes, 200, {
			"Cache-Control": "no-store",
			"Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
			"X-Content-SHA256": sha256,
		});
	});
	r.get("/koudens/:koudenId/files", async (c) => {
		const id = c.req.param("koudenId");
		if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) return c.json({ error: "invalid" }, 400);
		const result = await c.env.FILES.list({
			prefix: `koudens/${id}/`,
			cursor: c.req.query("cursor"),
			limit: 1000,
		});
		return c.json({
			objects: result.objects.map((o) => ({ key: o.key, size: o.size })),
			cursor: result.truncated ? result.cursor : null,
		});
	});
	return r;
}
