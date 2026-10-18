import type { FileDownload } from "./client.ts";
import { digest } from "./prepare.ts";
import type { ImageCopy } from "./rollback-plan.ts";

export interface StorageClient {
	/** 存在しなければ null */
	get(bucket: string, path: string): Promise<Uint8Array | null>;
	/** 既存のオブジェクトは上書きしない */
	put(bucket: string, path: string, bytes: Uint8Array, contentType: string): Promise<void>;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** 旧 Supabase Storage。接続先はスナップショットの project ref から作り、任意の URL は受け付けない。 */
export function createStorageClient(
	project: string,
	secretKey: string,
	fetcher: typeof fetch = fetch,
): StorageClient {
	if (!/^[a-z0-9]{20}$/.test(project)) throw new Error("rollback_invalid_project");
	if (!secretKey) throw new Error("rollback_storage_credentials");
	const headers = { apikey: secretKey, Authorization: `Bearer ${secretKey}` };
	const url = (prefix: string, bucket: string, path: string) =>
		`https://${project}.supabase.co/storage/v1/object/${prefix}${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
	const call = async (target: string, init: RequestInit = {}) => {
		try {
			return await fetcher(target, {
				...init,
				headers: { ...headers, ...init.headers },
				redirect: "manual",
				signal: AbortSignal.timeout(30_000),
			});
		} catch {
			throw new Error("rollback_storage_network_error");
		}
	};
	return {
		async get(bucket, path) {
			const response = await call(url("authenticated/", bucket, path));
			// Storage は版により、存在しないオブジェクトを 400 で返す。誤判定しても put が上書きしない。
			if (response.status === 404 || response.status === 400) {
				await response.body?.cancel();
				return null;
			}
			if (!response.ok) {
				await response.body?.cancel();
				throw new Error("rollback_storage_read_failed");
			}
			return new Uint8Array(await response.arrayBuffer());
		},
		async put(bucket, path, bytes, contentType) {
			const response = await call(url("", bucket, path), {
				method: "POST",
				headers: { "Content-Type": contentType, "Cache-Control": "3600", "x-upsert": "false" },
				body: new Blob([new Uint8Array(bytes)]),
			});
			await response.body?.cancel();
			if (!response.ok) throw new Error("rollback_storage_upload_failed");
		},
	};
}

/**
 * R2 の画像を旧 Storage の決定的なパスへ写し、読み戻してサイズと SHA-256 を照合する。
 * 同じ内容が既にあれば書かないので再実行できる。違う内容があれば上書きせず停止する。
 */
export async function copyRollbackImages(
	images: ImageCopy[],
	v2: { download(path: string): Promise<FileDownload> },
	storage: StorageClient,
): Promise<(ImageCopy & { size: number; sha256: string; copied: boolean })[]> {
	const results = [];
	for (const image of images) {
		const file = await v2.download(
			`/internal/import/rollback/files?key=${encodeURIComponent(image.r2Key)}`,
		);
		const sha256 = digest(file.bytes);
		const contentType = file.headers.get("content-type") ?? "";
		if (
			!file.bytes.length ||
			file.headers.get("x-content-sha256") !== sha256 ||
			!IMAGE_TYPES.includes(contentType)
		)
			throw new Error("rollback_image_source_mismatch");
		const existing = await storage.get(image.bucket, image.path);
		if (!existing) await storage.put(image.bucket, image.path, file.bytes, contentType);
		const stored = existing ?? (await storage.get(image.bucket, image.path));
		if (!stored || stored.length !== file.bytes.length || digest(stored) !== sha256)
			throw new Error(existing ? "rollback_storage_conflict" : "rollback_storage_verify_failed");
		results.push({ ...image, size: stored.length, sha256, copied: !existing });
	}
	return results;
}
