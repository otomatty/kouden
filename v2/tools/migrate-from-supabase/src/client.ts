export type MigrationAuth = { devToken: string } | { clientId: string; clientSecret: string };
export interface ImportClient {
	origin: string;
	request(
		path: string,
		method?: string,
		body?: string | Uint8Array,
		headers?: Record<string, string>,
	): Promise<unknown>;
}

export interface FileDownload {
	bytes: Uint8Array;
	headers: Headers;
}

export function createImportClient(
	url: string,
	auth: MigrationAuth,
	fetcher: typeof fetch = fetch,
	pause: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): ImportClient & { download(path: string): Promise<FileDownload> } {
	const origin = new URL(url);
	const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
	if (
		origin.username ||
		origin.password ||
		origin.search ||
		origin.hash ||
		origin.pathname !== "/" ||
		(origin.protocol !== "https:" && !(origin.protocol === "http:" && local))
	)
		throw new Error("invalid_import_origin");
	if ("devToken" in auth && (!local || !auth.devToken))
		throw new Error("dev_token_requires_loopback");
	if ("clientId" in auth && (!auth.clientId || !auth.clientSecret))
		throw new Error("missing_access_credentials");
	const credentials: Record<string, string> =
		"devToken" in auth
			? { Authorization: `Bearer ${auth.devToken}` }
			: { "CF-Access-Client-Id": auth.clientId, "CF-Access-Client-Secret": auth.clientSecret };
	const send = async (
		path: string,
		method: string,
		body: string | Uint8Array | undefined,
		extra: Record<string, string>,
		limit: number,
	): Promise<FileDownload> => {
		if (!path.startsWith("/internal/import/")) throw new Error("invalid_import_path");
		const target = new URL(path, origin);
		if (target.origin !== origin.origin || !target.pathname.startsWith("/internal/import/"))
			throw new Error("invalid_import_path");
		for (let attempt = 0; attempt < 3; attempt++) {
			let response: Response;
			try {
				response = await fetcher(target, {
					method,
					headers: { ...extra, ...credentials },
					body:
						typeof body === "string" || body === undefined
							? body
							: new Blob([new Uint8Array(body)]),
					redirect: "manual",
					signal: AbortSignal.timeout(30_000),
				});
			} catch {
				if (attempt === 2) throw new Error("import_network_error");
				await pause(250 * 2 ** attempt);
				continue;
			}
			if ([429, 502, 503, 504].includes(response.status) && attempt < 2) {
				await response.body?.cancel();
				await pause(250 * 2 ** attempt);
				continue;
			}
			if (!response.ok) {
				await response.body?.cancel();
				// サーバーのエラー本文にはデータや認証画面が含まれ得るので出力しない。
				throw new Error(`import_http_${response.status}`);
			}
			const reader = response.body?.getReader();
			if (!reader) throw new Error("empty_import_response");
			const chunks: Uint8Array[] = [];
			let size = 0;
			for (;;) {
				const result = await reader.read();
				if (result.done) break;
				size += result.value.length;
				if (size > limit) {
					await reader.cancel();
					throw new Error("import_response_too_large");
				}
				chunks.push(result.value);
			}
			return { bytes: Buffer.concat(chunks), headers: response.headers };
		}
		throw new Error("import_retry_exhausted");
	};
	return {
		origin: origin.origin,
		async request(path, method = "GET", body, extra = {}) {
			const { bytes } = await send(path, method, body, extra, 4 * 1024 * 1024);
			try {
				return JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown;
			} catch {
				throw new Error("invalid_import_response");
			}
		},
		/** 画像の本体（上限 5 MB）。JSON として解釈しない。 */
		download: (path) => send(path, "GET", undefined, {}, 5 * 1024 * 1024),
	};
}
