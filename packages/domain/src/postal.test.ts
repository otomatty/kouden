import { describe, expect, it } from "vitest";
import { buildPostalShards, cleanTownName, parseCsvLine } from "./postal.ts";

/** utf_ken_all.csv と同じ形の行（列: 団体コード, 旧郵便番号, 郵便番号, カナ 3 列, 都道府県, 市区町村, 町域, フラグ 6 列） */
const row = (code: string, prefecture: string, city: string, town: string) =>
	`13101,"${code.slice(0, 3)}  ","${code}","ｶﾅ","ｶﾅ","ｶﾅ","${prefecture}","${city}","${town}",0,0,0,0,0,0`;

describe("parseCsvLine", () => {
	it('"" で囲んだ列の中の , と "" を読む', () => {
		expect(parseCsvLine('1,"a,b","c""d",')).toEqual(["1", "a,b", 'c"d', ""]);
	});
});

describe("cleanTownName", () => {
	it.each([
		["千代田", "千代田"],
		["以下に掲載がない場合", ""],
		["利島村一円", ""],
		["一円", "一円"],
		["大通西（１〜１９丁目）", "大通西"],
		["葛巻（第４０地割「５７番地１２５、１７６を除く」〜第４５地割）", "葛巻"],
		["犬山の次に番地がくる場合", ""],
	])("%s → %s", (input, expected) => {
		expect(cleanTownName(input)).toBe(expected);
	});
});

describe("buildPostalShards", () => {
	it("先頭 3 桁ごとに、下 4 桁 → [都道府県, 市区町村, 町域] にする", () => {
		const shards = buildPostalShards(
			[
				row("1000000", "東京都", "千代田区", "以下に掲載がない場合"),
				row("1000001", "東京都", "千代田区", "千代田"),
				row("5300001", "大阪府", "大阪市北区", "梅田"),
			].join("\r\n"),
		);
		expect([...shards.keys()]).toEqual(["100", "530"]);
		expect(shards.get("100")).toEqual({
			"0000": ["東京都", "千代田区", ""],
			"0001": ["東京都", "千代田区", "千代田"],
		});
		expect(shards.get("530")?.["0001"]).toEqual(["大阪府", "大阪市北区", "梅田"]);
	});

	it("同じ郵便番号に町域が複数あるときは、町域を空にする", () => {
		const shards = buildPostalShards(
			[
				row("0010000", "北海道", "札幌市北区", "甲"),
				row("0010000", "北海道", "札幌市北区", "乙"),
			].join("\n"),
		);
		expect(shards.get("001")?.["0000"]).toEqual(["北海道", "札幌市北区", ""]);
	});

	it("複数の行に分かれた長い町域（古い形式）をつないで読む", () => {
		const shards = buildPostalShards(
			[
				row("0280000", "岩手県", "岩手郡葛巻町", "葛巻（第４０地割「５７番地１２５、"),
				row("0280000", "岩手県", "岩手郡葛巻町", "１７６を除く」〜第４５地割）"),
				row("0280001", "岩手県", "岩手郡葛巻町", "江刈"),
			].join("\n"),
		);
		expect(shards.get("028")).toEqual({
			"0000": ["岩手県", "岩手郡葛巻町", "葛巻"],
			"0001": ["岩手県", "岩手郡葛巻町", "江刈"],
		});
	});

	it("郵便番号が 7 桁でない行・空行は読み飛ばす", () => {
		const shards = buildPostalShards(["", row("12345", "東京都", "千代田区", "x"), ""].join("\n"));
		expect(shards.size).toBe(0);
	});
});
