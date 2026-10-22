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

/**
 * 同じ人かもしれない差出人の組（E5-2 の候補）。氏名・ふりがなが同じ（表記ゆれを除く）か、
 * 氏名のない差出人どうしで団体名が同じなら候補にする。同姓同名の別人もいるので、まとめるかは人が決める
 */
export function findDuplicatePersons(
	persons: readonly {
		id: string;
		name: string | null;
		nameKana: string | null;
		organization: string | null;
	}[],
): Map<string, string[]> {
	const byKey = new Map<string, string[]>();
	for (const p of persons) {
		const keys = new Set<string>();
		if (p.name) keys.add(`n:${toSearchKey(p.name)}`);
		if (p.nameKana) keys.add(`k:${toSearchKey(p.nameKana)}`);
		if (!p.name && p.organization) keys.add(`o:${toSearchKey(p.organization)}`);
		for (const key of keys) {
			if (key.length <= 2) continue;
			byKey.set(key, [...(byKey.get(key) ?? []), p.id]);
		}
	}
	const result = new Map<string, string[]>();
	for (const ids of byKey.values()) {
		if (ids.length < 2) continue;
		for (const id of ids) {
			const others = new Set([...(result.get(id) ?? []), ...ids.filter((o) => o !== id)]);
			result.set(id, [...others]);
		}
	}
	return result;
}

/**
 * 候補（findDuplicatePersons）を組にして、一覧の順に並べる。
 * a と b、b と c が候補なら a・b・c を 1 組にする。組の中も一覧の順
 */
export function groupDuplicates(
	ids: readonly string[],
	duplicates: ReadonlyMap<string, readonly string[]>,
): string[][] {
	const order = new Map(ids.map((id, i) => [id, i]));
	const seen = new Set<string>();
	const groups: string[][] = [];
	for (const id of ids) {
		if (seen.has(id) || !duplicates.has(id)) continue;
		const group: string[] = [];
		const stack = [id];
		seen.add(id);
		while (stack.length > 0) {
			const current = stack.pop() as string;
			group.push(current);
			for (const other of duplicates.get(current) ?? []) {
				if (!seen.has(other) && order.has(other)) {
					seen.add(other);
					stack.push(other);
				}
			}
		}
		groups.push(group.toSorted((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)));
	}
	return groups.filter((g) => g.length > 1);
}
