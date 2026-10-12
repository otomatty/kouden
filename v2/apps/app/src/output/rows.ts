import { personLabel } from "@kouden/domain";
import type {
	ContributorView,
	GiftView,
	OutputData,
	PersonView,
	ReturnView,
} from "../ledger/types.ts";

/** 印刷用ページと Excel で共通に使う並べ替え・まとめ（E7-2, E7-3） */

/** いただきものの代表者と、それ以外の連名 */
export function giftContributors(gift: GiftView): {
	primary: ContributorView | null;
	others: ContributorView[];
} {
	const primary = gift.contributors.find((c) => c.isPrimary) ?? gift.contributors[0] ?? null;
	return { primary, others: gift.contributors.filter((c) => c !== primary) };
}

/** 連名の表示（「山田 花子、鈴木 一郎」） */
export const jointLabel = (others: readonly ContributorView[]) =>
	others.map((c) => personLabel(c)).join("、");

/** 行事ごとのいただきもの（行事の並び順。いただきもののない行事は除く） */
export function giftsByEvent(
	data: OutputData,
	eventId?: string,
): { eventId: string; name: string; date: string | null; gifts: GiftView[] }[] {
	return data.events
		.filter((e) => !eventId || e.id === eventId)
		.map((e) => ({
			eventId: e.id,
			name: e.name,
			date: e.date,
			gifts: data.gifts.filter((g) => g.eventId === e.id),
		}))
		.filter((e) => e.gifts.length > 0);
}

export interface ReturnRow {
	person: PersonView;
	ret: ReturnView | null;
}

/**
 * 香典返しの一覧の行。画面の一覧（returnsBoard）と同じく、いただきものがある差出人と、
 * 香典返しを作成済みの差出人を並べる
 */
export function returnRows(data: OutputData): ReturnRow[] {
	const returns = new Map(data.returns.map((r) => [r.personId, r]));
	return data.persons
		.filter((p) => p.giftCount > 0 || returns.has(p.id))
		.map((p) => ({ person: p, ret: returns.get(p.id) ?? null }));
}

/** 品の表示（「お茶セット × 2、タオル」） */
export const linesLabel = (ret: ReturnView) =>
	ret.lines.map((l) => (l.quantity > 1 ? `${l.name} × ${l.quantity}` : l.name)).join("、");

export interface AddressRow {
	personId: string;
	postalCode: string | null;
	address: string;
	name: string | null;
	organization: string | null;
	position: string | null;
	/** 香典返しの送付先を使ったか */
	fromReturn: boolean;
}

/**
 * 宛名の一覧。香典返しに送付先の住所があればそれを、なければ差出人の住所を使う。
 * 住所のない差出人は除く（件数は別に数える）
 */
export function addressRows(data: OutputData): { rows: AddressRow[]; withoutAddress: number } {
	const rows: AddressRow[] = [];
	let withoutAddress = 0;
	for (const { person, ret } of returnRows(data)) {
		if (ret?.shipAddress) {
			rows.push({
				personId: person.id,
				postalCode: ret.shipPostalCode,
				address: ret.shipAddress,
				name: ret.shipName ?? person.name,
				organization: ret.shipName ? null : person.organization,
				position: ret.shipName ? null : person.position,
				fromReturn: true,
			});
		} else if (person.address) {
			rows.push({
				personId: person.id,
				postalCode: person.postalCode,
				address: person.address,
				name: person.name,
				organization: person.organization,
				position: person.position,
				fromReturn: false,
			});
		} else {
			withoutAddress++;
		}
	}
	return { rows, withoutAddress };
}

/** ファイル名に使えない文字を除く */
export function safeFileName(name: string): string {
	return (
		name
			// oxlint-disable-next-line no-control-regex
			.replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g, "")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 80) || "香典帳"
	);
}
