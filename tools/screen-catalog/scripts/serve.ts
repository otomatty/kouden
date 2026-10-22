import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/** dist/ を http://localhost:5180 で配る（bun run catalog:serve） */

const dist = join(dirname(fileURLToPath(import.meta.url)), "../dist");
const port = Number(process.env.PORT ?? 5180);
const TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
};

createServer((req, res) => {
	const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
	const file = normalize(join(dist, path.endsWith("/") ? `${path}index.html` : path));
	if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) {
		res.writeHead(404).end("Not Found");
		return;
	}
	res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
	createReadStream(file).pipe(res);
}).listen(port, () => console.log(`画面カタログ: http://localhost:${port}/`));
