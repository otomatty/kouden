/** 差出人の表示名。氏名と団体名の両方があれば「氏名（団体名）」 */
export function personLabel(p: { name: string | null; organization: string | null }): string {
	if (p.name && p.organization) return `${p.name}（${p.organization}）`;
	return p.name ?? p.organization ?? "";
}
