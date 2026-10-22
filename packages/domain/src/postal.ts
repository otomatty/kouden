/**
 * 郵便番号から住所を入れるためのデータ（08 案 E）。
 * 日本郵便の「住所の郵便番号（1レコード1行、UTF-8形式）」（utf_ken_all.csv）を、
 * 郵便番号の先頭 3 桁ごとの JSON（{ 下 4 桁: [都道府県, 市区町村, 町域] }）に変換する。
 * 変換は apps/app/scripts/build-postal.ts が行い、画面（app.js）は先頭 3 桁のファイルだけを読む。
 */

export type PostalAddress = readonly [prefecture: string, city: string, town: string];

/** 先頭 3 桁 → { 下 4 桁 → 住所 } */
export type PostalShards = Map<string, Record<string, PostalAddress>>;

/** utf_ken_all.csv の列（0 始まり） */
const COLUMN = { code: 2, prefecture: 6, city: 7, town: 8 } as const;

/** CSV の 1 行を列に分ける（"" で囲んだ列の中の , と "" に対応する） */
export function parseCsvLine(line: string): string[] {
	const fields: string[] = [];
	let field = "";
	let quoted = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line.charAt(i);
		if (quoted) {
			if (ch === '"' && line.charAt(i + 1) === '"') {
				field += '"';
				i++;
			} else if (ch === '"') {
				quoted = false;
			} else {
				field += ch;
			}
		} else if (ch === '"') {
			quoted = true;
		} else if (ch === ",") {
			fields.push(field);
			field = "";
		} else {
			field += ch;
		}
	}
	fields.push(field);
	return fields;
}

/**
 * 町域名を、住所の欄に入れる形にする。番地の前に入れられない書き方は空にする
 * （「以下に掲載がない場合」「〇〇の次に番地がくる場合」「〇〇村一円」、かっこ書きの補足）
 */
export function cleanTownName(town: string): string {
	if (town === "以下に掲載がない場合") return "";
	if (town.endsWith("の次に番地がくる場合")) return "";
	// 「一円」という町域もある（滋賀県犬上郡多賀町一円）ので、それだけのときは残す
	if (town.endsWith("一円") && town !== "一円") return "";
	return town.replace(/（[^（）]*）/g, "").replace(/（.*$/, "");
}

/**
 * utf_ken_all.csv を先頭 3 桁ごとに分ける。
 * 同じ郵便番号に町域が複数ある場合は、町域を空にする（市区町村までは確か）。
 * 町域名が長く複数の行に分かれている古い形式（かっこが閉じていない行）も、つないで読む
 */
export function buildPostalShards(csv: string): PostalShards {
	const byCode = new Map<string, PostalAddress[]>();
	const add = (row: { code: string; prefecture: string; city: string; town: string }) => {
		const list = byCode.get(row.code) ?? [];
		list.push([row.prefecture, row.city, cleanTownName(row.town)]);
		byCode.set(row.code, list);
	};
	let pending: { code: string; prefecture: string; city: string; town: string } | null = null;
	for (const raw of csv.split(/\r?\n/)) {
		if (raw.trim() === "") continue;
		const cols = parseCsvLine(raw);
		const code = cols[COLUMN.code]?.trim() ?? "";
		const prefecture = cols[COLUMN.prefecture]?.trim() ?? "";
		const city = cols[COLUMN.city]?.trim() ?? "";
		const town = cols[COLUMN.town]?.trim() ?? "";
		if (!/^\d{7}$/.test(code) || prefecture === "") continue;

		let row = { code, prefecture, city, town };
		if (pending) {
			if (pending.code === code) row = { ...pending, town: pending.town + town };
			else add(pending);
			pending = null;
		}
		if (row.town.includes("（") && !row.town.includes("）")) {
			pending = row;
			continue;
		}
		add(row);
	}
	if (pending) add(pending);

	const shards: PostalShards = new Map();
	for (const [code, rows] of [...byCode].toSorted(([a], [b]) => a.localeCompare(b))) {
		const [first] = rows;
		if (!first) continue;
		const sameTown = rows.every((r) => r[0] === first[0] && r[1] === first[1] && r[2] === first[2]);
		const sameCity = rows.every((r) => r[0] === first[0] && r[1] === first[1]);
		if (!sameCity) continue;
		const address: PostalAddress = sameTown ? first : [first[0], first[1], ""];
		const shard = shards.get(code.slice(0, 3)) ?? {};
		shard[code.slice(3)] = address;
		shards.set(code.slice(0, 3), shard);
	}
	return shards;
}
