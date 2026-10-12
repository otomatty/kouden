import type { Attendance, EventKind, GiftKind, Plan, Role } from "@kouden/domain";

/**
 * 呼び出し元のコンテキスト（03 §5）。Worker が D1 で確認した内容を DO に渡す。
 * DO は Worker の binding 経由でしか呼べないので、この値を信頼してよい。
 */
export interface Caller {
	koudenId: string;
	userId: string;
	displayName: string;
	role: Role;
	plan: Plan;
	/** 操作した画面（ブラウザのタブ）の識別子。通知を受けたとき、その画面だけが自分の変更を無視する */
	tabId?: string | undefined;
}

export type LedgerError =
	| { code: "forbidden" }
	| { code: "not_found" }
	/** 楽観ロックの不一致（開いた後に他の人が更新した） */
	| { code: "conflict" }
	/** 無料版の件数上限 */
	| { code: "limit_reached"; limit: number }
	/** 業務ルール違反。field は画面の入力欄の名前（該当がなければ `_form`） */
	| { code: "invalid"; field: string; message: string };

export type LedgerResult<T> = { ok: true; value: T } | { ok: false; error: LedgerError };

export interface LedgerEvent {
	id: string;
	kind: EventKind;
	name: string;
	date: string | null;
	sortOrder: number;
	version: number;
	/** 有効ないただきものの件数（1 件以上あれば削除できない） */
	giftCount: number;
}

export interface LedgerRelationship {
	id: string;
	name: string;
	sortOrder: number;
	isHidden: boolean;
	version: number;
	/** この関係を設定している差出人の数（1 人以上いれば削除できない） */
	personCount: number;
}

export interface ContributorView {
	personId: string;
	name: string | null;
	nameKana: string | null;
	organization: string | null;
	relationshipName: string | null;
	isPrimary: boolean;
	shareAmount: number | null;
}

export interface GiftView {
	id: string;
	eventId: string;
	eventName: string;
	receiptNo: number | null;
	kind: GiftKind;
	amount: number | null;
	itemName: string | null;
	quantity: number | null;
	message: string | null;
	attendance: Attendance | null;
	notes: string | null;
	version: number;
	createdAt: string;
	updatedAt: string;
	/** 代表者が先頭 */
	contributors: ContributorView[];
}

export interface PersonView {
	id: string;
	name: string | null;
	nameKana: string | null;
	organization: string | null;
	position: string | null;
	relationshipId: string | null;
	relationshipName: string | null;
	postalCode: string | null;
	address: string | null;
	phone: string | null;
	notes: string | null;
	version: number;
	giftCount: number;
	/** 香典のうち、この人の分（連名は負担額・均等割りで按分） */
	kodenTotal: number;
}

export interface PersonDetail extends PersonView {
	gifts: GiftView[];
}

export interface Overview {
	totals: { giftCount: number; kodenCount: number; kodenTotal: number; personCount: number };
	byKind: { kind: GiftKind; count: number; amount: number }[];
	byEvent: {
		eventId: string;
		name: string;
		date: string | null;
		count: number;
		kodenTotal: number;
	}[];
	byRelationship: {
		relationshipId: string | null;
		name: string | null;
		count: number;
		kodenTotal: number;
	}[];
	recent: GiftView[];
}

export interface ReceptionResult {
	giftId: string;
	receiptNo: number;
	eventId: string;
	eventName: string;
	personId: string;
	personLabel: string;
}

/** WebSocket の接続要求で、Worker が確認済みの呼び出し元を DO に渡すヘッダー（JSON を URL エンコード） */
export const CALLER_HEADER = "X-Kouden-Caller";

/** 変更の通知（04 §5）。HTML は送らず、何が変わったかだけを知らせる */
export interface ChangeNotice {
	seq: number;
	entity: string;
	id: string;
	op: string;
	/** 変更したユーザー */
	actor: string;
	/** 変更した画面（タブ）。その画面は結果を表示済みなので取り直さない */
	tab?: string | undefined;
}

/** 記録ごとの変更履歴（E8-4） */
export interface HistoryEntry {
	seq: number;
	at: string;
	actorName: string;
	op: string;
	/** 変更前後の JSON（{"amount":[5000,10000]}）。RPC の型を単純に保つため文字列のまま渡す */
	diff: string | null;
}

export interface History {
	entries: HistoryEntry[];
	/** 差分の中の ID（行事・関係・差出人）→ 表示名 */
	names: Record<string, string>;
}
