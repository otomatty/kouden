export interface ContributorShare {
	personId: string;
	isPrimary: boolean;
	/** 連名時の負担額（未入力は null） */
	shareAmount: number | null;
}

/**
 * いただきもの 1 件の金額を差出人ごとに割り振る（03 §6 香典返しの一括提案 1.）。
 * - 単名なら全額をその人に
 * - 負担額が入力されている人はその額
 * - 残りは負担額が未入力の人で均等に割り、端数は代表者（未入力の人の中にいなければ先頭）に寄せる
 */
export function allocateAmount(
	amount: number,
	contributors: readonly ContributorShare[],
): Map<string, number> {
	const result = new Map<string, number>();
	if (contributors.length === 0) return result;
	if (contributors.length === 1) {
		result.set(contributors[0]?.personId ?? "", amount);
		return result;
	}

	let assigned = 0;
	const unassigned: ContributorShare[] = [];
	for (const c of contributors) {
		if (c.shareAmount === null) {
			unassigned.push(c);
		} else {
			result.set(c.personId, c.shareAmount);
			assigned += c.shareAmount;
		}
	}
	if (unassigned.length === 0) return result;

	const rest = Math.max(0, amount - assigned);
	const each = Math.floor(rest / unassigned.length);
	const remainder = rest - each * unassigned.length;
	const receiver = unassigned.find((c) => c.isPrimary) ?? unassigned[0];
	for (const c of unassigned) {
		result.set(c.personId, each + (c === receiver ? remainder : 0));
	}
	return result;
}
