/**
 * 香典帳のファイル（R2: kouden-files）。04 §2。
 * キーは `koudens/{koudenId}/…` で、香典帳の削除時に接頭辞ごと消す。
 * 非公開のバケットなので、配信は Worker が権限を確認してから行う。
 */

/** 返礼品画像の上限（5 MB） */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

/** ファイルの先頭のバイト列で形式を判定する（ブラウザが送る Content-Type は信用しない） */
export function detectImageType(head: Uint8Array): ImageType | null {
	const at = (i: number) => head[i] ?? -1;
	if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
	if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => at(i) === b)) {
		return "image/png";
	}
	const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
	if (head.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
	return null;
}

const OBJECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const isObjectId = (value: string) => OBJECT_ID.test(value);

export const returnItemImageKey = (koudenId: string, objectId: string) =>
	`koudens/${koudenId}/return-items/${objectId}`;

/** 画面で使う画像の URL（キーの末尾の ID だけを載せ、香典帳の ID は URL のものを使う） */
export function returnItemImageUrl(koudenId: string, key: string | null): string | null {
	const objectId = key?.split("/").pop();
	return objectId && isObjectId(objectId) ? `/k/${koudenId}/files/return-items/${objectId}` : null;
}

/**
 * フォームで送られた画像を検査して R2 に置く。キーは毎回新しい ID にする
 * （差し替えても URL が変わるので、ブラウザのキャッシュを長くできる）
 */
export async function putReturnItemImage(
	env: Env,
	koudenId: string,
	file: File,
): Promise<{ key: string } | { error: string }> {
	if (file.size === 0) return { error: "画像のファイルが空です" };
	if (file.size > MAX_IMAGE_BYTES) return { error: "画像は 5 MB 以下にしてください" };
	const bytes = new Uint8Array(await file.arrayBuffer());
	const type = detectImageType(bytes.subarray(0, 16));
	if (!type) return { error: "画像は JPEG・PNG・WebP のいずれかにしてください" };
	const key = returnItemImageKey(koudenId, crypto.randomUUID());
	await env.FILES.put(key, bytes, { httpMetadata: { contentType: type } });
	return { key };
}

export async function deleteFile(env: Env, key: string | null): Promise<void> {
	if (key) await env.FILES.delete(key);
}

/** 香典帳のファイルをすべて消す（03 §8 香典帳の削除） */
export async function deleteKoudenFiles(env: Env, koudenId: string): Promise<number> {
	const prefix = `koudens/${koudenId}/`;
	let deleted = 0;
	let cursor: string | undefined;
	do {
		const listed = await env.FILES.list({ prefix, cursor, limit: 1000 });
		const keys = listed.objects.map((o) => o.key);
		if (keys.length > 0) {
			await env.FILES.delete(keys);
			deleted += keys.length;
		}
		cursor = listed.truncated ? listed.cursor : undefined;
	} while (cursor);
	return deleted;
}
