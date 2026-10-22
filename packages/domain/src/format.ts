/** 差出人の表示名。氏名と団体名の両方があれば「氏名（団体名）」 */
export function personLabel(p: { name: string | null; organization: string | null }): string {
	if (p.name && p.organization) return `${p.name}（${p.organization}）`;
	return p.name ?? p.organization ?? "";
}

/** 備考をつなげる（差出人をまとめるとき、E5-2）。空の備考は除き、同じ内容は 1 つにする */
export function joinNotes(...notes: (string | null)[]): string | null {
	const list = [...new Set(notes)].filter((n): n is string => !!n);
	return list.length > 0 ? list.join("\n") : null;
}
