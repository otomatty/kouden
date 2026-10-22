/**
 * 検索用の正規化。全角・半角、ひらがな・カタカナ、大文字・小文字、空白の違いを吸収する。
 * 差出人の検索（氏名・カナ・団体・住所）は、この形に変換した文字列どうしの部分一致で行う。
 */
export function toSearchKey(text: string): string {
	return (
		text
			// 半角カナ → 全角、全角英数 → 半角
			.normalize("NFKC")
			.toLowerCase()
			// カタカナ → ひらがな（ァ〜ヶ）
			.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
			.replace(/\s+/g, "")
	);
}

/** 複数の項目をまとめた検索用文字列（空の項目は除く） */
export function buildSearchText(parts: readonly (string | null | undefined)[]): string {
	return parts
		.filter((p): p is string => typeof p === "string" && p !== "")
		.map(toSearchKey)
		.join(" ");
}

/**
 * 検索語が番号（香典袋に書いた番号）なら、その数を返す。「12」「１２」「No.12」「#12」「12番」を受け付ける（E4-2）
 */
export function parseReceiptNo(text: string): number | undefined {
	const m = /^(?:no\.?|#)?(\d{1,6})番?$/.exec(
		text.normalize("NFKC").toLowerCase().replace(/\s+/g, ""),
	);
	return m?.[1] ? Number(m[1]) : undefined;
}

/** SQL の LIKE に渡すため、ワイルドカード文字をエスケープする（ESCAPE '\'） */
export function escapeLike(text: string): string {
	return text.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
