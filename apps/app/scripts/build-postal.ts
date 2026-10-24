/**
 * 郵便番号から住所を入れるためのデータ（08 案 E）を作る。
 * 日本郵便の「住所の郵便番号（1レコード1行、UTF-8形式）」を、public/postal/<先頭 3 桁>.json に変換する。
 * 生成物は Git に入れない（.gitignore）。デプロイのたびに最新のデータで作る（v2-deploy.yml）。
 *
 *   bun run postal -- --download             # 日本郵便から取得して変換する
 *   bun run postal -- --input utf_ken_all.zip # 手元のファイル（.zip / .csv）を変換する
 */
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildPostalShards } from "@kouden/domain";
import { unzipSync } from "fflate";

// 2026-05 に配布先が移った。旧 /zipcode/dl/utf/zip/ は転送されず 404 になる
const SOURCE_URL =
	"https://www.post.japanpost.jp/service/search/zipcode/download/utf/zip/utf_ken_all.zip";

const { values } = parseArgs({
	options: {
		download: { type: "boolean", default: false },
		input: { type: "string" },
	},
});
if (values.download === Boolean(values.input)) {
	console.error("--download か --input <ファイル> のどちらかを指定してください");
	process.exit(1);
}

async function readSource(): Promise<Uint8Array> {
	if (values.input) return new Uint8Array(readFileSync(values.input));
	// 応答がないままデプロイを止め続けないよう、待つのは 2 分まで
	const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(120_000) });
	if (!res.ok) throw new Error(`郵便番号データを取得できませんでした: ${res.status} ${SOURCE_URL}`);
	return new Uint8Array(await res.arrayBuffer());
}

/** zip なら中の CSV を、そうでなければそのまま UTF-8 として読む */
function toCsv(bytes: Uint8Array): string {
	const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
	if (!isZip) return new TextDecoder().decode(bytes);
	const files = unzipSync(bytes);
	const name = Object.keys(files).find((f) => f.toLowerCase().endsWith(".csv"));
	const csv = name ? files[name] : undefined;
	if (!csv) throw new Error("zip の中に CSV がありません");
	return new TextDecoder().decode(csv);
}

const shards = buildPostalShards(toCsv(await readSource()));
let count = 0;
for (const shard of shards.values()) count += Object.keys(shard).length;
// 日本全体で 12 万件ほどある。極端に少なければ形式が変わったとみなして止める（古いファイルを消さない）
if (count < 100_000) {
	console.error(
		`郵便番号が ${count} 件しかありません。データの形式が変わっていないか確かめてください`,
	);
	process.exit(1);
}

// 一時ディレクトリにすべて書いてから入れ替える（書き込みの途中で失敗しても、欠けたデータを残さない）
const outDir = path.join(import.meta.dirname, "..", "public/postal");
const tmpDir = `${outDir}.tmp`;
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });
for (const [prefix, shard] of shards) {
	writeFileSync(path.join(tmpDir, `${prefix}.json`), JSON.stringify(shard));
}
rmSync(outDir, { recursive: true, force: true });
renameSync(tmpDir, outDir);
console.log(`public/postal に ${shards.size} ファイル（郵便番号 ${count} 件）を書き出しました`);
