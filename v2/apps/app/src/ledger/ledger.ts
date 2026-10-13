import {
	type Action,
	allocateAmount,
	buildSearchText,
	can,
	DEFAULT_EVENTS,
	DEFAULT_RELATIONSHIPS,
	escapeLike,
	type EventInput,
	FREE_GIFT_LIMIT,
	type ContributorAddInput,
	type ContributorRef,
	type GiftFilter,
	type GiftInput,
	GIFT_KIND_VALUES,
	type LedgerImportSummary,
	type LedgerSnapshot,
	type PersonInput,
	personLabel,
	type ReceptionInput,
	type RelationshipInput,
	type ReturnInput,
	type ReturnItemInput,
	type ReturnLineInput,
	type ReturnRuleInput,
	RETURN_STATUS_VALUES,
	reminderSchedule,
	suggestReturn,
	toSearchKey,
	uuidv7,
} from "@kouden/domain";
import { DurableObject } from "cloudflare:workers";
import { log } from "../lib/logger.ts";
import { cloudflareMailer, type Mail, type Mailer } from "../lib/mailer.ts";
import { parseDiff } from "./diff.ts";
import { MIGRATIONS, migrate } from "./schema.ts";
import {
	CALLER_HEADER,
	type Caller,
	type ChangeNotice,
	type History,
	type ContributorView,
	type GiftView,
	type LedgerError,
	type LedgerEvent,
	type LedgerRelationship,
	type LedgerResult,
	type Overview,
	type PersonDetail,
	type PersonView,
	type ReceptionResult,
	type ReturnConfirmEntry,
	type ReturnDetail,
	type ReturnItemView,
	type ReturnLineView,
	type ReturnRuleView,
	type OutputData,
	type ReturnsBoard,
	type ReturnView,
} from "./types.ts";

/** WebSocket ごとに保存する情報（Hibernation 中も保持される） */
interface Attachment {
	userId: string;
	name: string;
	editing: { entity: string; id: string } | null;
	/** メンバーであることを確かめ終えるまでは、通知も閲覧中の表示もしない */
	pending?: boolean;
}

/** 「編集中」として受け付ける対象 */
const EDITABLE_ENTITIES = new Set(["gift", "person", "return"]);

/** 書き込みから統計の投影（D1 kouden_stats）までの待ち時間（03 §7） */
export const PROJECTION_DELAY_MS = 5_000;

const SYSTEM_ACTOR = { userId: "system", displayName: "システム" } as const;
/** 旧アプリからの取り込み（05 §2）の変更ログの記録者 */
const IMPORT_ACTOR = { userId: "system", displayName: "データ移行" } as const;
/** 取り込みの前に中身を消すテーブル（参照する側から順に） */
const IMPORT_TABLES = [
	"return_lines",
	"returns",
	"return_rules",
	"return_items",
	"reminders",
	"gift_contributors",
	"gifts",
	"persons",
	"relationships",
	"events",
	"change_log",
] as const;

/** お知らせの送信に全員分失敗したときに、送り直す間隔 */
export const REMINDER_RETRY_MS = 30 * 60 * 1000;

/** 香典返しを一度に確定できる件数 */
const MAX_CONFIRM_ENTRIES = 2000;

/** 日本時間の日付（YYYY-MM-DD） */
function jstDate(iso: string): string {
	return new Date(Date.parse(iso) + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 香典返しの期限のお知らせ（E6-5） */
function reminderMail(p: {
	to: { email: string; display_name: string };
	koudenTitle: string;
	days: number;
	eventName: string;
	dueDate: string;
	pending: number;
	url: string;
}): Mail {
	const [y, m, d] = p.dueDate.split("-").map(Number);
	const date = `${y}年${m}月${d}日`;
	return {
		to: p.to.email,
		subject: `【香典帳】香典返しの期限まであと ${p.days} 日です（${p.koudenTitle}）`,
		text: [
			`${p.to.display_name} 様`,
			"",
			`「${p.koudenTitle}」の香典返しの期限（${p.eventName}・${date}）まで、あと ${p.days} 日です。`,
			`まだ対応していない香典返しが ${p.pending} 件あります。`,
			"",
			`香典返しの画面: ${p.url}`,
			"",
			"このメールは香典帳から自動でお送りしています。",
			"編集者の方は、メンバーの画面でお知らせを受け取らない設定にできます。",
		].join("\n"),
	};
}

type Row = Record<string, SqlStorageValue>;
type Diff = Record<string, [unknown, unknown]>;
type Direction = "up" | "down";

/** 業務ルール違反。transactionSync の中で投げるとロールバックされ、呼び出し元には LedgerError として返る */
class LedgerFailure extends Error {
	constructor(readonly error: LedgerError) {
		super(error.code);
	}
}

const invalid = (field: string, message: string) =>
	new LedgerFailure({ code: "invalid", field, message });

function diffOf(before: Row | null, after: Row): Diff {
	const diff: Diff = {};
	for (const [key, value] of Object.entries(after)) {
		const prev = before ? (before[key] ?? null) : null;
		if (prev !== value) diff[key] = [prev, value];
	}
	return diff;
}

const orNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** 値（または値の配列）のうち文字列を集合に加える */
function addAll(set: Set<string>, v: unknown): void {
	for (const x of Array.isArray(v) ? v : [v]) if (typeof x === "string") set.add(x);
}

function toNotice(row: {
	seq: number;
	entity: string;
	entity_id: string;
	op: string;
	actor_user_id: string;
}): ChangeNotice {
	return {
		seq: row.seq,
		entity: row.entity,
		id: row.entity_id,
		op: row.op,
		actor: row.actor_user_id,
	};
}

type GiftRow = {
	id: string;
	event_id: string;
	event_name: string;
	receipt_no: number | null;
	kind: string;
	amount: number | null;
	item_name: string | null;
	quantity: number | null;
	message: string | null;
	attendance: string | null;
	notes: string | null;
	version: number;
	created_at: string;
	updated_at: string;
};

type ContributorRow = {
	gift_id: string;
	person_id: string;
	name: string | null;
	name_kana: string | null;
	organization: string | null;
	relationship_name: string | null;
	is_primary: number;
	share_amount: number | null;
};

type PersonRow = {
	id: string;
	name: string | null;
	name_kana: string | null;
	organization: string | null;
	position: string | null;
	relationship_id: string | null;
	relationship_name: string | null;
	postal_code: string | null;
	address: string | null;
	phone: string | null;
	notes: string | null;
	version: number;
};

const GIFT_COLUMNS = `g.id, g.event_id, e.name AS event_name, g.receipt_no, g.kind, g.amount, g.item_name,
  g.quantity, g.message, g.attendance, g.notes, g.version, g.created_at, g.updated_at`;

const PERSON_COLUMNS = `p.id, p.name, p.name_kana, p.organization, p.position, p.relationship_id,
  r.name AS relationship_name, p.postal_code, p.address, p.phone, p.notes, p.version`;

/**
 * 香典帳 1 冊の中身（03 §3）。Worker から RPC で呼ぶ。
 *
 * - 書き込みはすべて `mutate` を通し、1 トランザクション + 変更ログ 1 行以上を強制する
 * - 権限は呼び出しごとに `caller.role` で判定する（正は D1。DO はメンバーシップを持たない）
 * - 初めて呼ばれたときにスキーマを作り、既定の行事・関係を用意する
 */
export class KoudenLedger extends DurableObject<Env> {
	/** unknown: まだ確認していない / ready: スキーマ適用済み / deleted: 香典帳が削除済み */
	private state: "unknown" | "ready" | "deleted" = "unknown";
	/** この起動でスキーマを移行した（移行で作ったお知らせのアラームを予約する必要がある） */
	private migratedNow = false;

	/** お知らせメールの送信（テストでは差し替える） */
	mailer: Mailer;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.mailer = cloudflareMailer(env);
		// 接続の生存確認（ブラウザが定期的に ping を送る）。DO を起こさずに応答する
		ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
	}

	private get sql(): SqlStorage {
		return this.ctx.storage.sql;
	}

	// ---- 読み取り ----------------------------------------------------------

	async overview(caller: Caller): Promise<LedgerResult<Overview>> {
		return this.read(caller, () => {
			const byKind = this.all<{ kind: string; count: number; amount: number }>(
				`SELECT kind, count(*) AS count, coalesce(sum(amount), 0) AS amount
           FROM gifts WHERE deleted_at IS NULL GROUP BY kind`,
			);
			const byEvent = this.all<{
				id: string;
				name: string;
				date: string | null;
				count: number;
				koden_total: number;
			}>(
				`SELECT e.id, e.name, e.date, count(g.id) AS count,
                coalesce(sum(CASE WHEN g.kind = 'koden' THEN g.amount END), 0) AS koden_total
           FROM events e LEFT JOIN gifts g ON g.event_id = e.id AND g.deleted_at IS NULL
          WHERE e.deleted_at IS NULL
          GROUP BY e.id ORDER BY e.sort_order`,
			);
			// 関係は代表者の関係で数える
			const byRelationship = this.all<{
				id: string | null;
				name: string | null;
				count: number;
				koden_total: number;
			}>(
				`SELECT r.id, r.name, count(g.id) AS count,
                coalesce(sum(CASE WHEN g.kind = 'koden' THEN g.amount END), 0) AS koden_total
           FROM gifts g
           JOIN gift_contributors gc ON gc.gift_id = g.id AND gc.is_primary = 1
           JOIN persons p ON p.id = gc.person_id
           LEFT JOIN relationships r ON r.id = p.relationship_id
          WHERE g.deleted_at IS NULL
          GROUP BY r.id ORDER BY r.sort_order IS NULL, r.sort_order`,
			);
			const koden = byKind.find((k) => k.kind === "koden");
			return {
				totals: {
					giftCount: byKind.reduce((sum, k) => sum + k.count, 0),
					kodenCount: koden?.count ?? 0,
					kodenTotal: koden?.amount ?? 0,
					personCount: this.activePersonCount(),
				},
				byKind: byKind.map((k) => ({
					kind: k.kind as GiftView["kind"],
					count: k.count,
					amount: k.amount,
				})),
				byEvent: byEvent.map((e) => ({
					eventId: e.id,
					name: e.name,
					date: e.date,
					count: e.count,
					kodenTotal: e.koden_total,
				})),
				byRelationship: byRelationship.map((r) => ({
					relationshipId: r.id,
					name: r.name,
					count: r.count,
					kodenTotal: r.koden_total,
				})),
				recent: this.queryGifts("", [], "g.created_at DESC", 5),
			};
		});
	}

	async listEvents(caller: Caller): Promise<LedgerResult<LedgerEvent[]>> {
		return this.read(caller, () => this.events());
	}

	async listRelationships(caller: Caller): Promise<LedgerResult<LedgerRelationship[]>> {
		return this.read(caller, () =>
			this.all<{
				id: string;
				name: string;
				sort_order: number;
				is_hidden: number;
				version: number;
				person_count: number;
			}>(
				`SELECT r.id, r.name, r.sort_order, r.is_hidden, r.version,
                (SELECT count(*) FROM persons p WHERE p.relationship_id = r.id) AS person_count
           FROM relationships r ORDER BY r.sort_order`,
			).map((r) => ({
				id: r.id,
				name: r.name,
				sortOrder: r.sort_order,
				isHidden: r.is_hidden === 1,
				version: r.version,
				personCount: r.person_count,
			})),
		);
	}

	async listGifts(caller: Caller, filter: GiftFilter): Promise<LedgerResult<GiftView[]>> {
		return this.read(caller, () => {
			const where: string[] = [];
			const params: SqlStorageValue[] = [];
			if (filter.eventId) {
				where.push("g.event_id = ?");
				params.push(filter.eventId);
			}
			if (filter.kind) {
				where.push("g.kind = ?");
				params.push(filter.kind);
			}
			if (filter.minAmount !== undefined) {
				where.push("g.amount >= ?");
				params.push(filter.minAmount);
			}
			if (filter.maxAmount !== undefined) {
				where.push("g.amount <= ?");
				params.push(filter.maxAmount);
			}
			if (filter.relationshipId) {
				where.push(`EXISTS (SELECT 1 FROM gift_contributors gc JOIN persons p ON p.id = gc.person_id
                     WHERE gc.gift_id = g.id AND gc.is_primary = 1 AND p.relationship_id = ?)`);
				params.push(filter.relationshipId);
			}
			if (filter.q) {
				const key = toSearchKey(filter.q);
				if (key !== "") {
					where.push(`(EXISTS (SELECT 1 FROM gift_contributors gc JOIN persons p ON p.id = gc.person_id
                       WHERE gc.gift_id = g.id AND p.search_text LIKE ? ESCAPE '\\')
                     OR g.item_name LIKE ? ESCAPE '\\')`);
					const like = `%${escapeLike(key)}%`;
					params.push(like, `%${escapeLike(filter.q)}%`);
				}
			}
			return this.queryGifts(
				where.map((w) => ` AND ${w}`).join(""),
				params,
				"e.sort_order, g.receipt_no IS NULL, g.receipt_no, g.created_at",
			);
		});
	}

	async getGift(caller: Caller, giftId: string): Promise<LedgerResult<GiftView>> {
		return this.read(caller, () => {
			const gift = this.queryGifts(" AND g.id = ?", [giftId], "g.id")[0];
			if (!gift) throw new LedgerFailure({ code: "not_found" });
			return gift;
		});
	}

	/** 差出人の一覧。q があれば氏名・カナ・団体・住所の部分一致（E4-6, E5-1） */
	async listPersons(
		caller: Caller,
		options: { q?: string; limit?: number } = {},
	): Promise<LedgerResult<PersonView[]>> {
		return this.read(caller, () => {
			const key = options.q ? toSearchKey(options.q) : "";
			if (options.q !== undefined && key === "") return [];
			const rows = this.all<PersonRow>(
				`SELECT ${PERSON_COLUMNS}
           FROM persons p LEFT JOIN relationships r ON r.id = p.relationship_id
          WHERE p.deleted_at IS NULL ${key ? "AND p.search_text LIKE ? ESCAPE '\\'" : ""}
          ORDER BY coalesce(p.name_kana, p.name, p.organization), p.created_at
          ${options.limit ? `LIMIT ${Math.floor(options.limit)}` : ""}`,
				...(key ? [`%${escapeLike(key)}%`] : []),
			);
			const totals = this.personTotals();
			return rows.map((p) => this.toPersonView(p, totals));
		});
	}

	async getPerson(caller: Caller, personId: string): Promise<LedgerResult<PersonDetail>> {
		return this.read(caller, () => {
			const row = this.first<PersonRow>(
				`SELECT ${PERSON_COLUMNS}
           FROM persons p LEFT JOIN relationships r ON r.id = p.relationship_id
          WHERE p.id = ? AND p.deleted_at IS NULL`,
				personId,
			);
			if (!row) throw new LedgerFailure({ code: "not_found" });
			const gifts = this.queryGifts(
				" AND EXISTS (SELECT 1 FROM gift_contributors gc WHERE gc.gift_id = g.id AND gc.person_id = ?)",
				[personId],
				"e.sort_order, g.receipt_no",
			);
			const ret = this.first<{ id: string; status: string }>(
				"SELECT id, status FROM returns WHERE person_id = ?",
				personId,
			);
			return {
				...this.toPersonView(row, this.personTotals()),
				gifts,
				ret: ret ? { id: ret.id, status: ret.status as ReturnView["status"] } : null,
			};
		});
	}

	// ---- いただきもの -------------------------------------------------------

	/** 受付での登録（E4-1, E4-2）。受付番号は行事ごとの連番で、同時に登録しても重複しない */
	async createAtReception(
		caller: Caller,
		input: ReceptionInput,
	): Promise<LedgerResult<ReceptionResult>> {
		return this.mutate(caller, "ledger.write", (now) => {
			const event = this.first<{ id: string; name: string; next_receipt_no: number }>(
				"SELECT id, name, next_receipt_no FROM events WHERE id = ? AND deleted_at IS NULL",
				input.gift.eventId,
			);
			if (!event) throw invalid("eventId", "行事が見つかりません。画面を読み込み直してください");
			this.assertWithinLimit(caller);

			const person = this.resolvePerson(caller, now, input.person);
			const receiptNo = event.next_receipt_no;
			this.sql.exec(
				"UPDATE events SET next_receipt_no = next_receipt_no + 1 WHERE id = ?",
				event.id,
			);

			const giftId = uuidv7();
			const record = { ...this.giftRecord(input.gift), receipt_no: receiptNo };
			this.sql.exec(
				`INSERT INTO gifts (id, event_id, receipt_no, kind, amount, item_name, quantity, message,
                            attendance, notes, created_by, created_at, updated_by, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				giftId,
				record.event_id,
				record.receipt_no,
				record.kind,
				record.amount,
				record.item_name,
				record.quantity,
				record.message,
				record.attendance,
				record.notes,
				caller.userId,
				now,
				caller.userId,
				now,
			);
			this.sql.exec(
				"INSERT INTO gift_contributors (gift_id, person_id, is_primary) VALUES (?, ?, 1)",
				giftId,
				person.id,
			);
			this.log(caller, now, "gift", giftId, "create", {
				...diffOf(null, record),
				contributors: [null, [person.id]],
			});
			return {
				giftId,
				receiptNo,
				eventId: event.id,
				eventName: event.name,
				personId: person.id,
				personLabel: personLabel(person),
			};
		});
	}

	async updateGift(
		caller: Caller,
		giftId: string,
		version: number,
		input: GiftInput,
	): Promise<LedgerResult<{ version: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			const current = this.lockGift(giftId, version);
			const next: Row = this.giftRecord(input);
			if (input.eventId !== current.event_id) {
				// 行事を移したら、移した先の行事で受付番号を振り直す
				const event = this.first<{ next_receipt_no: number }>(
					"SELECT next_receipt_no FROM events WHERE id = ? AND deleted_at IS NULL",
					input.eventId,
				);
				if (!event) throw invalid("eventId", "行事が見つかりません");
				next.receipt_no = event.next_receipt_no;
				this.sql.exec(
					"UPDATE events SET next_receipt_no = next_receipt_no + 1 WHERE id = ?",
					input.eventId,
				);
			}
			this.sql.exec(
				`UPDATE gifts SET event_id = ?, receipt_no = ?, kind = ?, amount = ?, item_name = ?, quantity = ?,
                          message = ?, attendance = ?, notes = ?, updated_by = ?, updated_at = ?
          WHERE id = ?`,
				next.event_id ?? null,
				next.receipt_no ?? current.receipt_no,
				next.kind ?? null,
				next.amount ?? null,
				next.item_name ?? null,
				next.quantity ?? null,
				next.message ?? null,
				next.attendance ?? null,
				next.notes ?? null,
				caller.userId,
				now,
				giftId,
			);
			this.assertSharesWithinAmount(giftId, "amount");
			this.log(caller, now, "gift", giftId, "update", diffOf(current, next));
			return { version: version + 1 };
		});
	}

	async deleteGift(caller: Caller, giftId: string, version: number): Promise<LedgerResult<null>> {
		return this.mutate(caller, "ledger.write", (now) => {
			this.lockGift(giftId, version);
			this.sql.exec(
				"UPDATE gifts SET deleted_at = ?, updated_by = ?, updated_at = ? WHERE id = ?",
				now,
				caller.userId,
				now,
				giftId,
			);
			this.log(caller, now, "gift", giftId, "delete", null);
			return null;
		});
	}

	/** 連名の差出人を追加する（E4-4） */
	async addContributor(
		caller: Caller,
		giftId: string,
		version: number,
		input: ContributorAddInput,
	): Promise<LedgerResult<{ version: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			this.lockGift(giftId, version);
			const before = this.contributorIds(giftId);
			const person = this.resolvePerson(caller, now, input.person);
			if (before.includes(person.id)) {
				throw invalid("personId", "この差出人はすでに追加されています");
			}
			this.sql.exec(
				"INSERT INTO gift_contributors (gift_id, person_id, is_primary, share_amount) VALUES (?, ?, 0, ?)",
				giftId,
				person.id,
				input.shareAmount,
			);
			this.assertSharesWithinAmount(giftId, "shareAmount");
			return this.finishContributorChange(caller, now, giftId, before);
		});
	}

	async removeContributor(
		caller: Caller,
		giftId: string,
		version: number,
		personId: string,
	): Promise<LedgerResult<{ version: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			this.lockGift(giftId, version);
			const before = this.contributorIds(giftId);
			if (!before.includes(personId)) throw new LedgerFailure({ code: "not_found" });
			if (before.length === 1) throw invalid("_form", "差出人を 0 人にはできません");
			this.sql.exec(
				"DELETE FROM gift_contributors WHERE gift_id = ? AND person_id = ?",
				giftId,
				personId,
			);
			// 代表者を外したら、残りの先頭を代表者にする
			this.sql.exec(
				`UPDATE gift_contributors SET is_primary = 1
          WHERE gift_id = ?1 AND person_id = (SELECT person_id FROM gift_contributors WHERE gift_id = ?1 ORDER BY rowid LIMIT 1)
            AND NOT EXISTS (SELECT 1 FROM gift_contributors WHERE gift_id = ?1 AND is_primary = 1)`,
				giftId,
			);
			return this.finishContributorChange(caller, now, giftId, before);
		});
	}

	async updateContributor(
		caller: Caller,
		giftId: string,
		version: number,
		personId: string,
		input: { shareAmount: number | null; makePrimary: boolean },
	): Promise<LedgerResult<{ version: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			this.lockGift(giftId, version);
			const current = this.first<{ share_amount: number | null; is_primary: number }>(
				"SELECT share_amount, is_primary FROM gift_contributors WHERE gift_id = ? AND person_id = ?",
				giftId,
				personId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			// 代表者を替えるときは、外れる人の変更も同じ履歴に残す
			const demoted = input.makePrimary
				? this.first<{ person_id: string; share_amount: number | null }>(
						"SELECT person_id, share_amount FROM gift_contributors WHERE gift_id = ? AND is_primary = 1 AND person_id <> ?",
						giftId,
						personId,
					)
				: null;
			this.sql.exec(
				"UPDATE gift_contributors SET share_amount = ? WHERE gift_id = ? AND person_id = ?",
				input.shareAmount,
				giftId,
				personId,
			);
			if (input.makePrimary) {
				this.sql.exec("UPDATE gift_contributors SET is_primary = 0 WHERE gift_id = ?", giftId);
				this.sql.exec(
					"UPDATE gift_contributors SET is_primary = 1 WHERE gift_id = ? AND person_id = ?",
					giftId,
					personId,
				);
			}
			this.assertSharesWithinAmount(giftId, "_form");
			this.sql.exec(
				"UPDATE gifts SET updated_by = ?, updated_at = ? WHERE id = ?",
				caller.userId,
				now,
				giftId,
			);
			// 変更前後の負担額・代表者を残す（変更履歴に表示する）
			const before = { shareAmount: current.share_amount, isPrimary: current.is_primary === 1 };
			const after = {
				shareAmount: input.shareAmount,
				isPrimary: before.isPrimary || input.makePrimary,
			};
			const diff: Diff = { [`contributor:${personId}`]: [before, after] };
			if (demoted) {
				const share = demoted.share_amount;
				diff[`contributor:${demoted.person_id}`] = [
					{ shareAmount: share, isPrimary: true },
					{ shareAmount: share, isPrimary: false },
				];
			}
			this.log(caller, now, "gift", giftId, "update", diff);
			return { version: version + 1 };
		});
	}

	// ---- 差出人 -------------------------------------------------------------

	async updatePerson(
		caller: Caller,
		personId: string,
		version: number,
		input: PersonInput,
	): Promise<LedgerResult<{ version: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			const current = this.first<Row>(
				`SELECT name, name_kana, organization, position, relationship_id, postal_code, address, phone,
                notes, version
           FROM persons WHERE id = ? AND deleted_at IS NULL`,
				personId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			if (current.version !== version) throw new LedgerFailure({ code: "conflict" });
			const next = this.personRecord(input, current.relationship_id as string | null);
			this.sql.exec(
				`UPDATE persons SET name = ?, name_kana = ?, organization = ?, position = ?, relationship_id = ?,
                            postal_code = ?, address = ?, phone = ?, notes = ?, search_text = ?,
                            version = version + 1, updated_by = ?, updated_at = ?
          WHERE id = ?`,
				next.name,
				next.name_kana,
				next.organization,
				next.position,
				next.relationship_id,
				next.postal_code,
				next.address,
				next.phone,
				next.notes,
				this.searchText(next),
				caller.userId,
				now,
				personId,
			);
			const { version: _v, ...before } = current;
			this.log(caller, now, "person", personId, "update", diffOf(before, next));
			return { version: version + 1 };
		});
	}

	// ---- 行事（E2-2） ---------------------------------------------------------

	async createEvent(caller: Caller, input: EventInput): Promise<LedgerResult<{ id: string }>> {
		return this.mutate(caller, "settings.write", (now) => {
			const id = uuidv7();
			this.insertEvent(id, input, this.nextSortOrder("events"), now);
			this.syncReminders(now);
			this.log(caller, now, "event", id, "create", diffOf(null, { ...input }));
			return { id };
		});
	}

	async updateEvent(
		caller: Caller,
		eventId: string,
		version: number,
		input: EventInput,
	): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			const current = this.first<Row>(
				"SELECT kind, name, date, version FROM events WHERE id = ? AND deleted_at IS NULL",
				eventId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			if (current.version !== version) throw new LedgerFailure({ code: "conflict" });
			this.sql.exec(
				"UPDATE events SET kind = ?, name = ?, date = ?, version = version + 1, updated_at = ? WHERE id = ?",
				input.kind,
				input.name,
				input.date,
				now,
				eventId,
			);
			this.syncReminders(now);
			const { version: _v, ...before } = current;
			this.log(caller, now, "event", eventId, "update", diffOf(before, { ...input }));
			return null;
		});
	}

	async moveEvent(
		caller: Caller,
		eventId: string,
		direction: Direction,
	): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			this.swapSortOrder(caller, now, "events", "event", eventId, direction, "deleted_at IS NULL");
			// 同じ日付の四十九日が並んでいると、並び順で期限の行事が変わる
			this.syncReminders(now);
			return null;
		});
	}

	/** 記録がある行事と、最後の 1 つは削除できない */
	async deleteEvent(caller: Caller, eventId: string): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			const event = this.first<{ id: string }>(
				"SELECT id FROM events WHERE id = ? AND deleted_at IS NULL",
				eventId,
			);
			if (!event) throw new LedgerFailure({ code: "not_found" });
			const gifts = this.scalar(
				"SELECT count(*) AS n FROM gifts WHERE event_id = ? AND deleted_at IS NULL",
				eventId,
			);
			if (gifts > 0) throw invalid("_form", "記録がある行事は削除できません");
			if (this.scalar("SELECT count(*) AS n FROM events WHERE deleted_at IS NULL") <= 1) {
				throw invalid("_form", "行事を 1 つ以上残してください");
			}
			this.sql.exec(
				"UPDATE events SET deleted_at = ?, updated_at = ? WHERE id = ?",
				now,
				now,
				eventId,
			);
			this.syncReminders(now);
			this.log(caller, now, "event", eventId, "delete", null);
			return null;
		});
	}

	// ---- 関係（E5-3） ---------------------------------------------------------

	async createRelationship(
		caller: Caller,
		input: RelationshipInput,
	): Promise<LedgerResult<{ id: string }>> {
		return this.mutate(caller, "settings.write", (now) => {
			const id = uuidv7();
			this.insertRelationship(id, input.name, this.nextSortOrder("relationships"), now);
			this.log(caller, now, "relationship", id, "create", { name: [null, input.name] });
			return { id };
		});
	}

	async updateRelationship(
		caller: Caller,
		relationshipId: string,
		version: number,
		input: RelationshipInput,
	): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			const current = this.first<{ name: string; version: number }>(
				"SELECT name, version FROM relationships WHERE id = ?",
				relationshipId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			if (current.version !== version) throw new LedgerFailure({ code: "conflict" });
			this.sql.exec(
				"UPDATE relationships SET name = ?, version = version + 1, updated_at = ? WHERE id = ?",
				input.name,
				now,
				relationshipId,
			);
			this.log(caller, now, "relationship", relationshipId, "update", {
				name: [current.name, input.name],
			});
			return null;
		});
	}

	async moveRelationship(
		caller: Caller,
		relationshipId: string,
		direction: Direction,
	): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			this.swapSortOrder(
				caller,
				now,
				"relationships",
				"relationship",
				relationshipId,
				direction,
				"1 = 1",
			);
			return null;
		});
	}

	async setRelationshipHidden(
		caller: Caller,
		relationshipId: string,
		hidden: boolean,
	): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			const current = this.first<{ is_hidden: number }>(
				"SELECT is_hidden FROM relationships WHERE id = ?",
				relationshipId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			this.sql.exec(
				"UPDATE relationships SET is_hidden = ?, version = version + 1, updated_at = ? WHERE id = ?",
				hidden ? 1 : 0,
				now,
				relationshipId,
			);
			this.log(caller, now, "relationship", relationshipId, "update", {
				is_hidden: [current.is_hidden === 1, hidden],
			});
			return null;
		});
	}

	/** 使用中の関係は削除できない（非表示にはできる） */
	async deleteRelationship(caller: Caller, relationshipId: string): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			const current = this.first<{ name: string }>(
				"SELECT name FROM relationships WHERE id = ?",
				relationshipId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			if (
				this.scalar("SELECT count(*) AS n FROM persons WHERE relationship_id = ?", relationshipId) >
				0
			) {
				throw invalid("_form", "使用中の関係は削除できません。非表示にしてください");
			}
			this.sql.exec("DELETE FROM relationships WHERE id = ?", relationshipId);
			this.log(caller, now, "relationship", relationshipId, "delete", {
				name: [current.name, null],
			});
			return null;
		});
	}

	// ---- 香典返し: カタログ（E6-1） ---------------------------------------------

	async listReturnItems(caller: Caller): Promise<LedgerResult<ReturnItemView[]>> {
		return this.read(caller, () => this.returnItems());
	}

	async createReturnItem(
		caller: Caller,
		input: ReturnItemInput,
		imageKey: string | null,
	): Promise<LedgerResult<{ id: string }>> {
		return this.mutate(caller, "settings.write", (now) => {
			const id = uuidv7();
			const record = { ...this.returnItemRecord(input), image_r2_key: imageKey };
			this.sql.exec(
				`INSERT INTO return_items (id, name, category, price, description, image_r2_key, sort_order,
                                   created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				id,
				record.name,
				record.category,
				record.price,
				record.description,
				record.image_r2_key,
				this.nextSortOrder("return_items"),
				now,
				now,
			);
			this.log(caller, now, "return_item", id, "create", diffOf(null, record));
			return { id };
		});
	}

	/**
	 * 返礼品の変更。image は新しい画像のキー（null は画像を外す、undefined はそのまま）。
	 * 使わなくなった画像のキーを返すので、Worker が R2 から消す
	 */
	async updateReturnItem(
		caller: Caller,
		itemId: string,
		version: number,
		input: ReturnItemInput,
		image: string | null | undefined,
	): Promise<LedgerResult<{ removedImageKey: string | null }>> {
		return this.mutate(caller, "settings.write", (now) => {
			const current = this.first<Row & { image_r2_key: string | null; version: number }>(
				"SELECT name, category, price, description, image_r2_key, version FROM return_items WHERE id = ?",
				itemId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			if (current.version !== version) throw new LedgerFailure({ code: "conflict" });
			const next = {
				...this.returnItemRecord(input),
				image_r2_key: image === undefined ? current.image_r2_key : image,
			};
			this.sql.exec(
				`UPDATE return_items SET name = ?, category = ?, price = ?, description = ?, image_r2_key = ?,
                version = version + 1, updated_at = ? WHERE id = ?`,
				next.name,
				next.category,
				next.price,
				next.description,
				next.image_r2_key,
				now,
				itemId,
			);
			const { version: _v, ...before } = current;
			this.log(caller, now, "return_item", itemId, "update", diffOf(before, next));
			return {
				removedImageKey: current.image_r2_key !== next.image_r2_key ? current.image_r2_key : null,
			};
		});
	}

	async moveReturnItem(
		caller: Caller,
		itemId: string,
		direction: Direction,
	): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			this.swapSortOrder(caller, now, "return_items", "return_item", itemId, direction, "1 = 1");
			return null;
		});
	}

	/** 無効にした品は提案・明細の選択肢に出ない（作成済みの明細はそのまま） */
	async setReturnItemActive(
		caller: Caller,
		itemId: string,
		active: boolean,
	): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			const current = this.first<{ is_active: number }>(
				"SELECT is_active FROM return_items WHERE id = ?",
				itemId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			this.sql.exec(
				"UPDATE return_items SET is_active = ?, version = version + 1, updated_at = ? WHERE id = ?",
				active ? 1 : 0,
				now,
				itemId,
			);
			this.log(caller, now, "return_item", itemId, "update", {
				is_active: [current.is_active === 1, active],
			});
			return null;
		});
	}

	/** 明細・金額帯ルールで使われている品は削除できない（無効にはできる）。画像のキーを返す */
	async deleteReturnItem(
		caller: Caller,
		itemId: string,
	): Promise<LedgerResult<{ imageKey: string | null }>> {
		return this.mutate(caller, "settings.write", (now) => {
			const current = this.first<{ name: string; image_r2_key: string | null }>(
				"SELECT name, image_r2_key FROM return_items WHERE id = ?",
				itemId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			if (this.returnItemUsage(itemId) > 0) {
				throw invalid("_form", "使用中の返礼品は削除できません。無効にしてください");
			}
			this.sql.exec("DELETE FROM return_items WHERE id = ?", itemId);
			this.log(caller, now, "return_item", itemId, "delete", { name: [current.name, null] });
			return { imageKey: current.image_r2_key };
		});
	}

	// ---- 香典返し: 金額帯ルール（E6-2） -----------------------------------------

	async listReturnRules(caller: Caller): Promise<LedgerResult<ReturnRuleView[]>> {
		return this.read(caller, () => this.returnRules());
	}

	async createReturnRule(
		caller: Caller,
		input: ReturnRuleInput,
	): Promise<LedgerResult<{ id: string }>> {
		return this.mutate(caller, "settings.write", (now) => {
			this.assertSuggestedItem(input.suggestedItemId, null);
			const id = uuidv7();
			const record = this.returnRuleRecord(input);
			this.sql.exec(
				`INSERT INTO return_rules (id, min_amount, max_amount, ratio_numerator, ratio_denominator,
                                   suggested_item_id, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
				id,
				record.min_amount,
				record.max_amount,
				record.ratio_numerator,
				record.ratio_denominator,
				record.suggested_item_id,
				this.nextSortOrder("return_rules"),
			);
			this.log(caller, now, "return_rule", id, "create", diffOf(null, record));
			return { id };
		});
	}

	async updateReturnRule(
		caller: Caller,
		ruleId: string,
		version: number,
		input: ReturnRuleInput,
	): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			const current = this.first<Row & { suggested_item_id: string | null; version: number }>(
				`SELECT min_amount, max_amount, ratio_numerator, ratio_denominator, suggested_item_id, version
           FROM return_rules WHERE id = ?`,
				ruleId,
			);
			if (!current) throw new LedgerFailure({ code: "not_found" });
			if (current.version !== version) throw new LedgerFailure({ code: "conflict" });
			this.assertSuggestedItem(input.suggestedItemId, current.suggested_item_id);
			const next = this.returnRuleRecord(input);
			this.sql.exec(
				`UPDATE return_rules SET min_amount = ?, max_amount = ?, ratio_numerator = ?, ratio_denominator = ?,
                suggested_item_id = ?, version = version + 1 WHERE id = ?`,
				next.min_amount,
				next.max_amount,
				next.ratio_numerator,
				next.ratio_denominator,
				next.suggested_item_id,
				ruleId,
			);
			const { version: _v, ...before } = current;
			this.log(caller, now, "return_rule", ruleId, "update", diffOf(before, next));
			return null;
		});
	}

	async deleteReturnRule(caller: Caller, ruleId: string): Promise<LedgerResult<null>> {
		return this.mutate(caller, "settings.write", (now) => {
			if (!this.first<Row>("SELECT id FROM return_rules WHERE id = ?", ruleId)) {
				throw new LedgerFailure({ code: "not_found" });
			}
			this.sql.exec("DELETE FROM return_rules WHERE id = ?", ruleId);
			this.log(caller, now, "return_rule", ruleId, "delete", null);
			return null;
		});
	}

	// ---- 香典返し: 一覧・一括確定・状況（E6-3, E6-4） -----------------------------

	/** 香典返しの一覧。いただきものがある差出人と、香典返しを作成済みの差出人を並べる */
	async returnsBoard(caller: Caller): Promise<LedgerResult<ReturnsBoard>> {
		return this.read(caller, () => {
			const totals = this.personTotals();
			const returns = new Map(this.returnViews().map((r) => [r.personId, r]));
			const rows = this.all<PersonRow>(
				`SELECT ${PERSON_COLUMNS}
           FROM persons p LEFT JOIN relationships r ON r.id = p.relationship_id
          WHERE p.deleted_at IS NULL
          ORDER BY coalesce(p.name_kana, p.name, p.organization), p.created_at`,
			)
				.filter((p) => (totals.get(p.id)?.giftCount ?? 0) > 0 || returns.has(p.id))
				.map((p) => ({ person: this.toPersonView(p, totals), ret: returns.get(p.id) ?? null }));
			const due = this.dueEvent();
			return {
				rows,
				items: this.returnItems(),
				rules: this.returnRules(),
				dueDate: due?.date ?? null,
				dueEventName: due?.name ?? null,
			};
		});
	}

	// ---- 出力（E7-2, E7-3） --------------------------------------------------------

	/** 印刷用ページと Excel の元データ。同じ時点の内容をまとめて読む */
	async outputData(caller: Caller): Promise<LedgerResult<OutputData>> {
		return this.read(caller, () => {
			const totals = this.personTotals();
			const persons = this.all<PersonRow>(
				`SELECT ${PERSON_COLUMNS}
           FROM persons p LEFT JOIN relationships r ON r.id = p.relationship_id
          WHERE p.deleted_at IS NULL
          ORDER BY coalesce(p.name_kana, p.name, p.organization), p.created_at`,
			).map((p) => this.toPersonView(p, totals));
			return {
				events: this.events(),
				gifts: this.queryGifts(
					"",
					[],
					"e.sort_order, g.receipt_no IS NULL, g.receipt_no, g.created_at",
				),
				persons,
				returns: this.returnViews(),
			};
		});
	}

	/**
	 * 提案を確認した内容で、香典返しをまとめて作る（E6-3）。1 トランザクション。
	 * すでに香典返しがある差出人は飛ばす（他の人が先に確定した場合など）
	 */
	async confirmReturns(
		caller: Caller,
		entries: readonly ReturnConfirmEntry[],
	): Promise<LedgerResult<{ created: number; skipped: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			if (entries.length > MAX_CONFIRM_ENTRIES) {
				throw invalid("_form", `一度に確定できるのは ${MAX_CONFIRM_ENTRIES} 件までです`);
			}
			let created = 0;
			let skipped = 0;
			const totals = this.personTotals();
			const rules = this.returnRules();
			for (const entry of entries) {
				const person = this.first<Row>(
					"SELECT id FROM persons WHERE id = ? AND deleted_at IS NULL",
					entry.personId,
				);
				const exists = this.first<Row>(
					"SELECT id FROM returns WHERE person_id = ?",
					entry.personId,
				);
				if (!person || exists) {
					skipped += 1;
					continue;
				}
				const item = entry.itemId === null ? null : this.activeItem(entry.itemId);
				const onDay = Math.max(0, entry.onDayAmount);
				// 品がなく、当日返しで目安額を満たしていれば、当日返しで済んだものとして扱う
				// （目安額が残っていれば、品を後で決める「未対応」にする）
				const target = suggestReturn({
					total: totals.get(entry.personId)?.kodenTotal ?? 0,
					onDayAmount: onDay,
					rules,
					items: [],
				}).target;
				const settledOnDay = item === null && onDay > 0 && target === 0;
				const id = uuidv7();
				const record = {
					status: settledOnDay ? "handed_on_day" : "pending",
					method: settledOnDay ? "on_day" : null,
					on_day_amount: onDay,
				};
				this.sql.exec(
					`INSERT INTO returns (id, person_id, status, method, on_day_amount,
                                created_by, created_at, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					id,
					entry.personId,
					record.status,
					record.method,
					record.on_day_amount,
					caller.userId,
					now,
					caller.userId,
					now,
				);
				const diff: Diff = { ...diffOf(null, record), person_id: [null, entry.personId] };
				if (item) {
					const line = this.insertReturnLine(id, {
						itemId: item.id,
						name: item.name,
						unitPrice: item.price,
						quantity: 1,
					});
					diff[`line:${line.id}`] = [null, line.snapshot];
				}
				this.log(caller, now, "return", id, "create", diff);
				created += 1;
			}
			if (created === 0) {
				throw invalid("_form", "確定できる香典返しがありません（すでに作成済みです）");
			}
			return { created, skipped };
		});
	}

	/** 差出人の画面から、香典返しを 1 件作る（提案を使わない場合） */
	async createReturn(caller: Caller, personId: string): Promise<LedgerResult<{ id: string }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			if (
				!this.first<Row>("SELECT id FROM persons WHERE id = ? AND deleted_at IS NULL", personId)
			) {
				throw new LedgerFailure({ code: "not_found" });
			}
			const existing = this.first<{ id: string }>(
				"SELECT id FROM returns WHERE person_id = ?",
				personId,
			);
			if (existing) throw invalid("_form", "この差出人の香典返しは作成済みです");
			const id = uuidv7();
			this.sql.exec(
				`INSERT INTO returns (id, person_id, status, created_by, created_at, updated_by, updated_at)
         VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
				id,
				personId,
				caller.userId,
				now,
				caller.userId,
				now,
			);
			this.log(caller, now, "return", id, "create", {
				person_id: [null, personId],
				status: [null, "pending"],
			});
			return { id };
		});
	}

	async getReturn(caller: Caller, returnId: string): Promise<LedgerResult<ReturnDetail>> {
		return this.read(caller, () => {
			const ret = this.returnViews(returnId)[0];
			if (!ret) throw new LedgerFailure({ code: "not_found" });
			const person = this.first<PersonRow>(
				`SELECT ${PERSON_COLUMNS}
           FROM persons p LEFT JOIN relationships r ON r.id = p.relationship_id
          WHERE p.id = ?`,
				ret.personId,
			);
			if (!person) throw new LedgerFailure({ code: "not_found" });
			return {
				...ret,
				person: this.toPersonView(person, this.personTotals()),
				koudenDueDate: this.dueEvent()?.date ?? null,
			};
		});
	}

	/**
	 * 状況・送付先の変更（E6-4）。手配済み・発送済みにしたときに日付が空なら、今日の日付を入れる
	 */
	async updateReturn(
		caller: Caller,
		returnId: string,
		version: number,
		input: ReturnInput,
	): Promise<LedgerResult<{ version: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			const current = this.lockReturn(returnId, version);
			const today = jstDate(now);
			const next = {
				status: input.status,
				method: input.method,
				on_day_amount: input.onDayAmount,
				due_date: input.dueDate,
				arranged_at:
					input.arrangedAt ??
					(input.status === "arranged" && current.status !== "arranged" ? today : null),
				shipped_at:
					input.shippedAt ??
					(input.status === "shipped" && current.status !== "shipped" ? today : null),
				ship_name: input.shipName,
				ship_postal_code: input.shipPostalCode,
				ship_address: input.shipAddress,
				ship_phone: input.shipPhone,
				notes: input.notes,
			};
			this.sql.exec(
				`UPDATE returns SET status = ?, method = ?, on_day_amount = ?, due_date = ?, arranged_at = ?,
                shipped_at = ?, ship_name = ?, ship_postal_code = ?, ship_address = ?, ship_phone = ?,
                notes = ?, updated_by = ?, updated_at = ? WHERE id = ?`,
				next.status,
				next.method,
				next.on_day_amount,
				next.due_date,
				next.arranged_at,
				next.shipped_at,
				next.ship_name,
				next.ship_postal_code,
				next.ship_address,
				next.ship_phone,
				next.notes,
				caller.userId,
				now,
				returnId,
			);
			this.log(caller, now, "return", returnId, "update", diffOf(current, next));
			return { version: version + 1 };
		});
	}

	async addReturnLine(
		caller: Caller,
		returnId: string,
		version: number,
		input: ReturnLineInput,
	): Promise<LedgerResult<{ version: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			this.lockReturn(returnId, version);
			const line =
				input.type === "catalog"
					? (() => {
							const item = this.activeItem(input.itemId);
							return {
								itemId: item.id,
								name: item.name,
								unitPrice: item.price,
								quantity: input.quantity,
							};
						})()
					: {
							itemId: null,
							name: input.name,
							unitPrice: input.unitPrice,
							quantity: input.quantity,
						};
			const inserted = this.insertReturnLine(returnId, line);
			this.touchReturn(caller, now, returnId);
			this.log(caller, now, "return", returnId, "update", {
				[`line:${inserted.id}`]: [null, inserted.snapshot],
			});
			return { version: version + 1 };
		});
	}

	async removeReturnLine(
		caller: Caller,
		returnId: string,
		version: number,
		lineId: string,
	): Promise<LedgerResult<{ version: number }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			this.lockReturn(returnId, version);
			const line = this.first<{ name: string; unit_price: number; quantity: number }>(
				"SELECT name, unit_price, quantity FROM return_lines WHERE id = ? AND return_id = ?",
				lineId,
				returnId,
			);
			if (!line) throw new LedgerFailure({ code: "not_found" });
			this.sql.exec("DELETE FROM return_lines WHERE id = ?", lineId);
			this.touchReturn(caller, now, returnId);
			this.log(caller, now, "return", returnId, "update", {
				[`line:${lineId}`]: [
					{ name: line.name, unitPrice: line.unit_price, quantity: line.quantity },
					null,
				],
			});
			return { version: version + 1 };
		});
	}

	/** 香典返しを取り消す（明細ごと削除し、差出人は「未作成」に戻る） */
	async deleteReturn(
		caller: Caller,
		returnId: string,
		version: number,
	): Promise<LedgerResult<{ personId: string }>> {
		return this.mutate(caller, "ledger.write", (now) => {
			this.lockReturn(returnId, version);
			const personId = this.first<{ person_id: string }>(
				"SELECT person_id FROM returns WHERE id = ?",
				returnId,
			)?.person_id;
			this.sql.exec("DELETE FROM return_lines WHERE return_id = ?", returnId);
			this.sql.exec("DELETE FROM returns WHERE id = ?", returnId);
			this.log(caller, now, "return", returnId, "delete", null);
			return { personId: personId ?? "" };
		});
	}

	// ---- 変更履歴（E8-4） -------------------------------------------------------

	async history(
		caller: Caller,
		entity: "gift" | "person" | "return",
		entityId: string,
	): Promise<LedgerResult<History>> {
		return this.read(caller, () => {
			const rows = this.all<{
				seq: number;
				at: string;
				actor_name: string;
				op: string;
				diff: string | null;
			}>(
				`SELECT seq, at, actor_name, op, diff FROM change_log
          WHERE entity = ? AND entity_id = ? ORDER BY seq DESC LIMIT 200`,
				entity,
				entityId,
			);
			const entries = rows.map((r) => ({
				seq: r.seq,
				at: r.at,
				actorName: r.actor_name,
				op: r.op,
				diff: r.diff,
			}));

			// 差分に出てくる ID を表示名に変える
			const ids = {
				event: new Set<string>(),
				relationship: new Set<string>(),
				person: new Set<string>(),
			};
			for (const e of entries) {
				for (const [key, [before, after]] of Object.entries(parseDiff(e.diff))) {
					if (key === "event_id") addAll(ids.event, [before, after]);
					else if (key === "relationship_id") addAll(ids.relationship, [before, after]);
					else if (key === "person_id") addAll(ids.person, [before, after]);
					else if (key === "contributors")
						addAll(ids.person, [...asArray(before), ...asArray(after)]);
					else if (key.startsWith("contributor:")) ids.person.add(key.slice("contributor:".length));
				}
			}
			const names: Record<string, string> = {};
			const lookup = (table: string, set: Set<string>, label: (r: Row) => string) => {
				const list = [...set];
				for (let i = 0; i < list.length; i += 100) {
					const chunk = list.slice(i, i + 100);
					for (const r of this.all<Row & { id: string }>(
						`SELECT * FROM ${table} WHERE id IN (${chunk.map(() => "?").join(",")})`,
						...chunk,
					)) {
						names[r.id] = label(r);
					}
				}
			};
			lookup("events", ids.event, (r) => String(r.name));
			lookup("relationships", ids.relationship, (r) => String(r.name));
			lookup("persons", ids.person, (r) =>
				personLabel({
					name: (r.name as string | null) ?? null,
					organization: (r.organization as string | null) ?? null,
				}),
			);
			return { entries, names };
		});
	}

	// ---- リアルタイム（04 §5） ---------------------------------------------------

	/** WebSocket の接続（Worker が権限を確認し、呼び出し元をヘッダーで渡す） */
	override async fetch(request: Request): Promise<Response> {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("expected websocket", { status: 426 });
		}
		// ヘッダーは ASCII に限られるので、Worker が URL エンコードして渡す
		const caller = JSON.parse(
			decodeURIComponent(request.headers.get(CALLER_HEADER) ?? "null"),
		) as Caller | null;
		if (!caller) return new Response("missing caller", { status: 400 });
		try {
			this.prepare(caller);
		} catch (err) {
			if (err instanceof LedgerFailure) return new Response("not found", { status: 404 });
			throw err;
		}
		const pair = new WebSocketPair();
		const [client, server] = [pair[0], pair[1]];
		// Worker で権限を確かめた後、ここに届くまでの間に除外される場合がある。
		// 先に受け付けてから D1 でメンバーかを確かめる。除外の処理（D1 から削除 → recordExternalChange で切断）が
		// 確認より前なら確認で見つからず、後ならこの接続も切断の対象になるので、どちらの順でも取りこぼさない
		this.ctx.acceptWebSocket(server, [caller.userId]);
		const attachment: Attachment = {
			userId: caller.userId,
			name: caller.displayName,
			editing: null,
			pending: true,
		};
		server.serializeAttachment(attachment);
		const member = await this.env.DB.prepare(
			"SELECT 1 AS ok FROM kouden_members WHERE kouden_id = ? AND user_id = ?",
		)
			.bind(caller.koudenId, caller.userId)
			.first();
		if (!member) {
			this.revokeSocket(server);
		} else if (server.readyState === WebSocket.OPEN) {
			// 確認中に届いた「編集中」を消さないよう、保存済みの値に重ねる
			server.serializeAttachment({
				...(server.deserializeAttachment() as Attachment),
				pending: false,
			});
			server.send(JSON.stringify({ type: "hello", seq: this.lastSeq() }));
			this.broadcastPresence();
		}
		return new Response(null, { status: 101, webSocket: client });
	}

	override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		if (typeof message !== "string" || message.length > 500) return;
		let data: unknown;
		try {
			data = JSON.parse(message);
		} catch {
			return;
		}
		if (!data || typeof data !== "object" || (data as { type?: unknown }).type !== "editing")
			return;
		const { entity, id } = data as { entity?: unknown; id?: unknown };
		const editing =
			typeof entity === "string" &&
			EDITABLE_ENTITIES.has(entity) &&
			typeof id === "string" &&
			id.length <= 64
				? { entity, id }
				: null;
		const attachment = ws.deserializeAttachment() as Attachment;
		attachment.editing = editing;
		ws.serializeAttachment(attachment);
		this.broadcastPresence();
	}

	override async webSocketClose(ws: WebSocket): Promise<void> {
		this.broadcastPresence(ws);
	}

	override async webSocketError(ws: WebSocket): Promise<void> {
		this.broadcastPresence(ws);
	}

	/** 現在の変更ログの位置。画面を表示した時点の位置として埋め込み、接続時に以降の変更を取り直す */
	async currentSeq(caller: Caller): Promise<LedgerResult<number>> {
		return this.read(caller, () => this.lastSeq());
	}

	/** 取りこぼした変更（再接続時）。多すぎる場合は reset を返し、画面側で全体を取り直す */
	async changesSince(
		caller: Caller,
		seq: number,
	): Promise<LedgerResult<{ reset: boolean; changes: ChangeNotice[] }>> {
		return this.read(caller, () => {
			const rows = this.all<{
				seq: number;
				entity: string;
				entity_id: string;
				op: string;
				actor_user_id: string;
			}>(
				"SELECT seq, entity, entity_id, op, actor_user_id FROM change_log WHERE seq > ? ORDER BY seq LIMIT 201",
				seq,
			);
			if (rows.length > 200) return { reset: true, changes: [] };
			return { reset: false, changes: rows.map(toNotice) };
		});
	}

	/**
	 * D1 側で変わったメンバーシップ・香典帳の状態を記録し、接続中の画面に知らせる（04 §5 権限の変更と接続の失効）。
	 * 権限の確認は Worker が済ませている。revoke を指定したユーザーの接続は閉じる。
	 */
	async recordExternalChange(
		actor: Caller,
		change: {
			/** plan は購入・返金（04 §7）。kouden（アーカイブなど）と違い、画面を読み込み直さない */
			entity: "member" | "kouden" | "plan";
			entityId: string;
			op: "create" | "update" | "delete";
			diff: Diff | null;
		},
		options: { revokeUserId?: string } = {},
	): Promise<void> {
		try {
			this.prepare(actor);
		} catch (err) {
			if (err instanceof LedgerFailure) return;
			throw err;
		}
		const before = this.lastSeq();
		this.ctx.storage.transactionSync(() => {
			this.log(
				actor,
				new Date().toISOString(),
				change.entity,
				change.entityId,
				change.op,
				change.diff,
			);
		});
		if (options.revokeUserId) {
			for (const ws of this.ctx.getWebSockets(options.revokeUserId)) this.revokeSocket(ws);
		}
		this.broadcastChanges(before, actor.tabId);
		this.broadcastPresence();
	}

	/**
	 * 表示名の変更（E1-5）を、この香典帳を開いている本人の接続に反映する（閲覧中・編集中の表示）。
	 * 接続の情報は接続時の名前を保存しているので、画面を開き直さなくても新しい名前で表示されるようにする
	 */
	async renamePresence(caller: Caller): Promise<void> {
		let changed = false;
		for (const ws of this.ctx.getWebSockets(caller.userId)) {
			const a = ws.deserializeAttachment() as Attachment | null;
			if (a && a.name !== caller.displayName) {
				ws.serializeAttachment({ ...a, name: caller.displayName });
				changed = true;
			}
		}
		if (changed) this.broadcastPresence();
	}

	private revokeSocket(ws: WebSocket): void {
		try {
			ws.send(JSON.stringify({ type: "revoked" }));
			ws.close(4001, "revoked");
		} catch {
			// すでに閉じている
		}
	}

	private openSockets(exclude?: WebSocket): WebSocket[] {
		return this.ctx
			.getWebSockets()
			.filter(
				(ws) =>
					ws !== exclude &&
					ws.readyState === WebSocket.OPEN &&
					(ws.deserializeAttachment() as Attachment | null)?.pending !== true,
			);
	}

	private send(sockets: WebSocket[], message: unknown): void {
		const text = JSON.stringify(message);
		for (const ws of sockets) {
			try {
				ws.send(text);
			} catch {
				// 切断済みの接続は webSocketClose で片付く
			}
		}
	}

	/** seq より後の変更ログを、接続中の全員に通知する */
	private broadcastChanges(after: number, tab?: string): void {
		const sockets = this.openSockets();
		if (sockets.length === 0) return;
		const rows = this.all<{
			seq: number;
			entity: string;
			entity_id: string;
			op: string;
			actor_user_id: string;
		}>(
			"SELECT seq, entity, entity_id, op, actor_user_id FROM change_log WHERE seq > ? ORDER BY seq LIMIT 50",
			after,
		);
		for (const row of rows) this.send(sockets, { type: "changed", ...toNotice(row), tab });
	}

	/** 閲覧中のメンバーと編集中の対象（同じ人の複数の接続はまとめる） */
	private broadcastPresence(exclude?: WebSocket): void {
		const sockets = this.openSockets(exclude);
		if (sockets.length === 0) return;
		const users = new Map<string, Attachment>();
		for (const ws of sockets) {
			const a = ws.deserializeAttachment() as Attachment | null;
			if (!a) continue;
			const seen = users.get(a.userId);
			if (!seen || (!seen.editing && a.editing)) users.set(a.userId, a);
		}
		this.send(sockets, {
			type: "presence",
			users: [...users.values()].map((a) => ({
				userId: a.userId,
				name: a.name,
				editing: a.editing,
			})),
		});
	}

	// ---- 香典帳の削除・投影 --------------------------------------------------

	/**
	 * 香典帳の削除（03 §8）。オーナーの確認は Worker が D1 で行う。
	 * 削除済みの印（meta.deleted_at）だけを残し、削除の直前に権限確認を通った要求が遅れて届いても、
	 * 台帳を作り直さずに not_found を返す。
	 */
	async deleteAll(): Promise<void> {
		for (const ws of this.ctx.getWebSockets()) this.revokeSocket(ws);
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
		this.sql.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
		this.sql.exec(
			"INSERT OR REPLACE INTO meta (key, value) VALUES ('deleted_at', ?)",
			new Date().toISOString(),
		);
		this.state = "deleted";
	}

	// ---- 移行（05 §2 の 3b） -------------------------------------------------

	/**
	 * 旧アプリのデータを取り込む。行事・関係・差出人・いただきもの・香典返し・変更ログ・お知らせを全部消してから
	 * 入れ直すので、何度実行しても同じ結果になる。統計の投影先として、D1 の koudens の行を先に作っておくこと。
	 * 変更ログには import の 1 行だけを記録する（旧アプリの変更履歴は移さない）。
	 * 通常の編集で作られるもの（期限のお知らせの予定・D1 の統計）も、ここで作る。
	 * 削除済み（deleteAll）の香典帳にも取り込める
	 */
	async importSnapshot(
		koudenId: string,
		snapshot: LedgerSnapshot,
		importedAt: string,
		lastActivityAt: string = importedAt,
	): Promise<LedgerImportSummary> {
		/** 削除済みの台帳を作り直すときの、元の削除済みの印（取り込みに失敗したら戻す） */
		let deletedAt: string | null = null;
		let summary: LedgerImportSummary;
		if (!this.ensureSchema()) {
			// 削除済みの印（deleteAll）が残っていても、取り込みは明示的な操作なので作り直す
			// （リハーサルの後片付けで削除した香典帳を、次のリハーサル・切り替えで同じ ID に取り込み直す）
			deletedAt = this.meta("deleted_at");
			this.sql.exec("DELETE FROM meta WHERE key = 'deleted_at'");
			this.state = "unknown";
		}
		try {
			if (!this.ensureSchema()) throw new Error(`ledger ${koudenId} could not be recreated`);
			const current = this.meta("kouden_id");
			if (current !== null && current !== koudenId) {
				throw new Error(`ledger belongs to ${current}, import for ${koudenId}`);
			}
			summary = this.replaceWithSnapshot(koudenId, snapshot, importedAt, lastActivityAt);
		} catch (err) {
			// 失敗したら削除済みのまま（空の台帳を開けるようにしない）
			if (deletedAt !== null) {
				this.sql.exec(
					"INSERT OR REPLACE INTO meta (key, value) VALUES ('deleted_at', ?)",
					deletedAt,
				);
				this.state = "deleted";
			}
			throw err;
		}
		// ここから先は台帳がもう入れ替わっている。後始末（画面への通知・D1 への投影・アラームの予約）が失敗しても
		// 例外にしない（取り込み口が失敗とみなして D1 の行を戻すと、台帳と食い違う）。投影はアラームでやり直す
		try {
			// 開いている画面は読み込み直させる（kouden の変更は画面全体に影響する）
			this.broadcastChanges(this.lastSeq() - 1);
			if (!(await this.project(koudenId))) {
				log("error", "ledger_import_orphan", { koudenId });
			}
			await this.scheduleAlarm(false);
		} catch (err) {
			log("error", "ledger_import_followup_failed", {
				koudenId,
				error: err instanceof Error ? err.message : String(err),
			});
			try {
				await this.scheduleAlarm(true);
			} catch (alarmErr) {
				// 次の編集の投影でも上書きされる（projection_replace の印は残っている）
				log("error", "ledger_import_alarm_failed", {
					koudenId,
					error: alarmErr instanceof Error ? alarmErr.message : String(alarmErr),
				});
			}
		}
		return summary;
	}

	/**
	 * 台帳の中身を取り込みデータで入れ替える（1 トランザクション。失敗すれば何も変わらない）。
	 * 件数は同じトランザクションの中で数える（入れ替えた後に読み直すと、その失敗で取り込みが失敗に見える）
	 */
	private replaceWithSnapshot(
		koudenId: string,
		snapshot: LedgerSnapshot,
		importedAt: string,
		lastActivityAt: string,
	): LedgerImportSummary {
		return this.ctx.storage.transactionSync(() => {
			// 参照される側を後に消す
			for (const table of IMPORT_TABLES) this.sql.exec(`DELETE FROM ${table}`);
			this.sql.exec(
				`INSERT INTO meta (key, value) VALUES ('kouden_id', ?), ('created_at', ?)
         ON CONFLICT (key) DO NOTHING`,
				koudenId,
				importedAt,
			);
			for (const e of snapshot.events) {
				this.insertEvent(e.id, e, e.sortOrder, importedAt);
			}
			for (const r of snapshot.relationships) {
				this.sql.exec(
					`INSERT INTO relationships (id, name, sort_order, is_hidden, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
					r.id,
					r.name,
					r.sortOrder,
					r.isHidden ? 1 : 0,
					importedAt,
					importedAt,
				);
			}
			for (const p of snapshot.persons) {
				this.sql.exec(
					`INSERT INTO persons (id, name, name_kana, organization, position, relationship_id, postal_code,
                                 address, phone, notes, search_text, created_by, created_at, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					p.id,
					p.name,
					p.nameKana,
					p.organization,
					p.position,
					p.relationshipId,
					p.postalCode,
					p.address,
					p.phone,
					p.notes,
					this.searchText({
						name: p.name,
						name_kana: p.nameKana,
						organization: p.organization,
						address: p.address,
					}),
					p.createdBy,
					p.createdAt,
					p.updatedBy,
					p.updatedAt,
				);
			}
			for (const g of snapshot.gifts) {
				this.sql.exec(
					`INSERT INTO gifts (id, event_id, kind, amount, item_name, quantity, message, attendance, notes,
                               created_by, created_at, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					g.id,
					g.eventId,
					g.kind,
					g.amount,
					g.itemName,
					g.quantity,
					g.message,
					g.attendance,
					g.notes,
					g.createdBy,
					g.createdAt,
					g.updatedBy,
					g.updatedAt,
				);
			}
			for (const c of snapshot.contributors) {
				this.sql.exec(
					"INSERT INTO gift_contributors (gift_id, person_id, is_primary, share_amount) VALUES (?, ?, ?, ?)",
					c.giftId,
					c.personId,
					c.isPrimary ? 1 : 0,
					c.shareAmount,
				);
			}
			for (const i of snapshot.returnItems) {
				this.sql.exec(
					`INSERT INTO return_items (id, name, category, price, description, image_r2_key, is_active, sort_order,
                                      created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					i.id,
					i.name,
					i.category,
					i.price,
					i.description,
					i.imageR2Key,
					i.isActive ? 1 : 0,
					i.sortOrder,
					i.createdAt,
					i.updatedAt,
				);
			}
			for (const r of snapshot.returnRules) {
				this.sql.exec(
					`INSERT INTO return_rules (id, min_amount, max_amount, ratio_numerator, ratio_denominator,
                                      suggested_item_id, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
					r.id,
					r.minAmount,
					r.maxAmount,
					r.ratioNumerator,
					r.ratioDenominator,
					r.suggestedItemId,
					r.sortOrder,
				);
			}
			for (const r of snapshot.returns) {
				this.sql.exec(
					`INSERT INTO returns (id, person_id, status, method, on_day_amount, arranged_at, shipped_at, ship_name,
                                 ship_postal_code, ship_address, ship_phone, notes,
                                 created_by, created_at, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					r.id,
					r.personId,
					r.status,
					r.method,
					r.onDayAmount,
					r.arrangedAt,
					r.shippedAt,
					r.shipName,
					r.shipPostalCode,
					r.shipAddress,
					r.shipPhone,
					r.notes,
					r.createdBy,
					r.createdAt,
					r.updatedBy,
					r.updatedAt,
				);
			}
			for (const l of snapshot.returnLines) {
				this.sql.exec(
					`INSERT INTO return_lines (id, return_id, return_item_id, name, unit_price, quantity)
           VALUES (?, ?, ?, ?, ?, ?)`,
					l.id,
					l.returnId,
					l.returnItemId,
					l.name,
					l.unitPrice,
					l.quantity,
				);
			}
			// 作り直した台帳の変更ログは 1 から数え直すので、前の台帳の投影（seq が大きい）より古く見える。
			// 次の投影は seq を比べずに上書きする（ここで失敗しても、アラームの再試行で上書きされる）
			this.sql.exec("INSERT OR REPLACE INTO meta (key, value) VALUES ('projection_replace', '1')");
			// 一覧の「最近の動き」は旧アプリで最後に動いた時刻にする（取り込んだ時刻だと移行の実行順に並ぶ）
			this.sql.exec(
				"INSERT OR REPLACE INTO meta (key, value) VALUES ('imported_activity_at', ?)",
				lastActivityAt,
			);
			this.sql.exec(
				`INSERT INTO change_log (at, actor_user_id, actor_name, entity, entity_id, op, diff)
         VALUES (?, ?, ?, 'kouden', ?, 'import', NULL)`,
				importedAt,
				IMPORT_ACTOR.userId,
				IMPORT_ACTOR.displayName,
				koudenId,
			);
			this.syncReminders(new Date().toISOString());
			return this.countForImport();
		});
	}

	/** 取り込んだ内容の件数（05 §5 の検証で旧データと比べる） */
	async importSummary(): Promise<LedgerImportSummary> {
		if (!this.ensureSchema()) throw new Error("ledger has been deleted");
		return this.countForImport();
	}

	private countForImport(): LedgerImportSummary {
		const count = (table: string) => this.scalar(`SELECT count(*) AS n FROM ${table}`);
		const gifts = Object.fromEntries(
			GIFT_KIND_VALUES.map((k) => [k, 0]),
		) as LedgerImportSummary["gifts"];
		for (const r of this.all<{ kind: keyof LedgerImportSummary["gifts"]; n: number }>(
			"SELECT kind, count(*) AS n FROM gifts WHERE deleted_at IS NULL GROUP BY kind",
		)) {
			gifts[r.kind] = r.n;
		}
		const returns = Object.fromEntries(
			RETURN_STATUS_VALUES.map((s) => [s, 0]),
		) as LedgerImportSummary["returns"];
		for (const r of this.all<{ status: keyof LedgerImportSummary["returns"]; n: number }>(
			"SELECT status, count(*) AS n FROM returns GROUP BY status",
		)) {
			returns[r.status] = r.n;
		}
		return {
			events: this.scalar("SELECT count(*) AS n FROM events WHERE deleted_at IS NULL"),
			relationships: count("relationships"),
			persons: this.scalar("SELECT count(*) AS n FROM persons WHERE deleted_at IS NULL"),
			gifts,
			kodenTotal: this.scalar(
				"SELECT coalesce(sum(amount), 0) AS n FROM gifts WHERE kind = 'koden' AND deleted_at IS NULL",
			),
			returns,
			returnLines: count("return_lines"),
			returnItems: count("return_items"),
			returnRules: count("return_rules"),
			reminders: count("reminders"),
		};
	}

	/**
	 * アラーム。統計の投影（03 §7、書き込みの数秒後）と、期限の来たお知らせの送信（E6-5）をまとめて行い、
	 * 次のお知らせがあればその時刻に予約し直す
	 */
	override async alarm(): Promise<void> {
		if (!this.ensureSchema()) return;
		const koudenId = this.meta("kouden_id");
		if (koudenId === null) return;
		try {
			if (!(await this.project(koudenId))) return;
			await this.sendDueReminders(koudenId);
		} catch (err) {
			// 投影（D1）やお知らせの送信の失敗を例外にすると、アラームの自動再試行（数分で終わる）に頼ることになり、
			// 使い切ると予約が消えて次のお知らせも送られなくなる。少し後に自分で予約し直す
			log("error", "ledger_alarm_failed", {
				koudenId,
				error: err instanceof Error ? err.message : String(err),
			});
			await this.ctx.storage.setAlarm(Date.now() + REMINDER_RETRY_MS);
			return;
		}
		await this.scheduleAlarm(false);
	}

	// ---- 共通の仕組み -------------------------------------------------------

	/** スキーマを用意する。削除済みの香典帳なら false（スキーマは作らない） */
	private ensureSchema(): boolean {
		if (this.state === "unknown") {
			this.sql.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
			if (this.meta("deleted_at") !== null) {
				this.state = "deleted";
			} else {
				const before = this.meta("schema_version");
				migrate(this.ctx.storage, MIGRATIONS);
				this.migratedNow = before !== String(MIGRATIONS.length);
				this.state = "ready";
			}
		}
		return this.state === "ready";
	}

	/** スキーマを用意し、初回なら既定の行事・関係を作る。削除済みなら not_found */
	private prepare(caller: Caller): void {
		if (!this.ensureSchema()) throw new LedgerFailure({ code: "not_found" });
		const koudenId = this.meta("kouden_id");
		if (koudenId === caller.koudenId) return;
		if (koudenId !== null) {
			throw new Error(`ledger belongs to ${koudenId}, called for ${caller.koudenId}`);
		}
		this.ctx.storage.transactionSync(() => {
			const now = new Date().toISOString();
			this.sql.exec(
				"INSERT INTO meta (key, value) VALUES ('kouden_id', ?), ('created_at', ?)",
				caller.koudenId,
				now,
			);
			DEFAULT_EVENTS.forEach((e, i) => {
				const id = uuidv7();
				this.insertEvent(id, { ...e, date: null }, i + 1, now);
				this.log(SYSTEM_ACTOR, now, "event", id, "create", { name: [null, e.name] });
			});
			DEFAULT_RELATIONSHIPS.forEach((name, i) => {
				const id = uuidv7();
				this.insertRelationship(id, name, i + 1, now);
				this.log(SYSTEM_ACTOR, now, "relationship", id, "create", { name: [null, name] });
			});
		});
	}

	private async read<T>(caller: Caller, fn: () => T): Promise<LedgerResult<T>> {
		try {
			this.prepare(caller);
			if (this.migratedNow) {
				this.migratedNow = false;
				// 移行で増えた項目（return_pending など）も投影し直す
				await this.scheduleAlarm(true);
			}
			if (!can(caller.role, "ledger.read")) return { ok: false, error: { code: "forbidden" } };
			return { ok: true, value: fn() };
		} catch (err) {
			if (err instanceof LedgerFailure) return { ok: false, error: err.error };
			throw err;
		}
	}

	/** 書き込みの共通ラッパー。権限確認 → 1 トランザクションで実行 → 変更ログの記録を検査 → 投影を予約 */
	private async mutate<T>(
		caller: Caller,
		action: Action,
		fn: (now: string) => T,
	): Promise<LedgerResult<T>> {
		let value: T;
		let before = 0;
		try {
			this.prepare(caller);
			if (!can(caller.role, action)) return { ok: false, error: { code: "forbidden" } };
			before = this.lastSeq();
			value = this.ctx.storage.transactionSync(() => {
				const result = fn(new Date().toISOString());
				if (this.lastSeq() === before) throw new Error("ledger write without change_log");
				return result;
			});
		} catch (err) {
			if (err instanceof LedgerFailure) return { ok: false, error: err.error };
			throw err;
		}
		this.broadcastChanges(before, caller.tabId);
		await this.scheduleAlarm(true);
		return { ok: true, value };
	}

	private log(
		actor: { userId: string; displayName: string },
		now: string,
		entity: string,
		entityId: string,
		op: "create" | "update" | "delete",
		diff: Diff | null,
	): void {
		this.sql.exec(
			`INSERT INTO change_log (at, actor_user_id, actor_name, entity, entity_id, op, diff)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
			now,
			actor.userId,
			actor.displayName,
			entity,
			entityId,
			op,
			diff && Object.keys(diff).length > 0 ? JSON.stringify(diff) : null,
		);
	}

	private lastSeq(): number {
		return this.scalar("SELECT coalesce(max(seq), 0) AS n FROM change_log");
	}

	private meta(key: string): string | null {
		return (
			this.first<{ value: string }>("SELECT value FROM meta WHERE key = ?", key)?.value ?? null
		);
	}

	private all<T extends Row>(query: string, ...params: SqlStorageValue[]): T[] {
		return this.sql.exec<T>(query, ...params).toArray();
	}

	private first<T extends Row>(query: string, ...params: SqlStorageValue[]): T | undefined {
		return this.sql.exec<T>(query, ...params).toArray()[0];
	}

	private scalar(query: string, ...params: SqlStorageValue[]): number {
		return this.first<{ n: number }>(query, ...params)?.n ?? 0;
	}

	// ---- 個別の処理 ---------------------------------------------------------

	private events(): LedgerEvent[] {
		return this.all<{
			id: string;
			kind: string;
			name: string;
			date: string | null;
			sort_order: number;
			version: number;
			gift_count: number;
		}>(
			`SELECT e.id, e.kind, e.name, e.date, e.sort_order, e.version,
              (SELECT count(*) FROM gifts g WHERE g.event_id = e.id AND g.deleted_at IS NULL) AS gift_count
         FROM events e WHERE e.deleted_at IS NULL ORDER BY e.sort_order`,
		).map((e) => ({
			id: e.id,
			kind: e.kind as LedgerEvent["kind"],
			name: e.name,
			date: e.date,
			sortOrder: e.sort_order,
			version: e.version,
			giftCount: e.gift_count,
		}));
	}

	private insertEvent(
		id: string,
		input: { kind: string; name: string; date: string | null },
		sortOrder: number,
		now: string,
	): void {
		this.sql.exec(
			`INSERT INTO events (id, kind, name, date, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
			id,
			input.kind,
			input.name,
			input.date,
			sortOrder,
			now,
			now,
		);
	}

	private insertRelationship(id: string, name: string, sortOrder: number, now: string): void {
		this.sql.exec(
			"INSERT INTO relationships (id, name, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			id,
			name,
			sortOrder,
			now,
			now,
		);
	}

	private nextSortOrder(
		table: "events" | "relationships" | "return_items" | "return_rules",
	): number {
		return this.scalar(`SELECT coalesce(max(sort_order), 0) + 1 AS n FROM ${table}`);
	}

	/** 隣の行と並び順を入れ替える。端の行はそれ以上動かせない */
	private swapSortOrder(
		caller: Caller,
		now: string,
		table: "events" | "relationships" | "return_items",
		entity: string,
		id: string,
		direction: Direction,
		activeCondition: string,
	): void {
		const current = this.first<{ sort_order: number }>(
			`SELECT sort_order FROM ${table} WHERE id = ? AND ${activeCondition}`,
			id,
		);
		if (!current) throw new LedgerFailure({ code: "not_found" });
		const neighbor = this.first<{ id: string; sort_order: number }>(
			direction === "up"
				? `SELECT id, sort_order FROM ${table} WHERE sort_order < ? AND ${activeCondition} ORDER BY sort_order DESC LIMIT 1`
				: `SELECT id, sort_order FROM ${table} WHERE sort_order > ? AND ${activeCondition} ORDER BY sort_order LIMIT 1`,
			current.sort_order,
		);
		if (!neighbor) throw invalid("_form", direction === "up" ? "すでに先頭です" : "すでに末尾です");
		this.sql.exec(
			`UPDATE ${table} SET sort_order = ?, updated_at = ? WHERE id = ?`,
			neighbor.sort_order,
			now,
			id,
		);
		this.sql.exec(
			`UPDATE ${table} SET sort_order = ?, updated_at = ? WHERE id = ?`,
			current.sort_order,
			now,
			neighbor.id,
		);
		this.log(caller, now, entity, id, "update", {
			sort_order: [current.sort_order, neighbor.sort_order],
		});
	}

	private assertWithinLimit(caller: Caller): void {
		if (caller.plan !== "free") return;
		if (
			this.scalar("SELECT count(*) AS n FROM gifts WHERE deleted_at IS NULL") >= FREE_GIFT_LIMIT
		) {
			throw new LedgerFailure({ code: "limit_reached", limit: FREE_GIFT_LIMIT });
		}
	}

	/** 楽観ロックを確認し、変更前の行を返す。version はここで 1 つ進める（呼び出し側では進めない） */
	private lockGift(
		giftId: string,
		version: number,
	): Row & { event_id: string; receipt_no: number | null } {
		const current = this.first<
			Row & { event_id: string; receipt_no: number | null; version: number }
		>(
			`SELECT event_id, receipt_no, kind, amount, item_name, quantity, message, attendance, notes, version
         FROM gifts WHERE id = ? AND deleted_at IS NULL`,
			giftId,
		);
		if (!current) throw new LedgerFailure({ code: "not_found" });
		if (current.version !== version) throw new LedgerFailure({ code: "conflict" });
		this.sql.exec("UPDATE gifts SET version = version + 1 WHERE id = ?", giftId);
		const { version: _v, ...row } = current;
		return row;
	}

	/**
	 * 連名の負担額の合計は金額を超えられない（超えると差出人ごとの受取額が実際より多くなる）。
	 * 金額・負担額のどちらを変えた場合も、同じトランザクションの中で確認する
	 */
	private assertSharesWithinAmount(giftId: string, field: string): void {
		const row = this.first<{ amount: number | null; shares: number | null }>(
			`SELECT g.amount, sum(gc.share_amount) AS shares
         FROM gifts g JOIN gift_contributors gc ON gc.gift_id = g.id
        WHERE g.id = ? GROUP BY g.id`,
			giftId,
		);
		if (row && row.amount !== null && row.shares !== null && row.shares > row.amount) {
			throw invalid(field, "連名の負担額の合計が金額を超えています");
		}
	}

	private contributorIds(giftId: string): string[] {
		return this.all<{ person_id: string }>(
			"SELECT person_id FROM gift_contributors WHERE gift_id = ? ORDER BY rowid",
			giftId,
		).map((r) => r.person_id);
	}

	private finishContributorChange(
		caller: Caller,
		now: string,
		giftId: string,
		before: string[],
	): { version: number } {
		this.sql.exec(
			"UPDATE gifts SET updated_by = ?, updated_at = ? WHERE id = ?",
			caller.userId,
			now,
			giftId,
		);
		this.log(caller, now, "gift", giftId, "update", {
			contributors: [before, this.contributorIds(giftId)],
		});
		return { version: this.scalar("SELECT version AS n FROM gifts WHERE id = ?", giftId) };
	}

	private giftRecord(input: GiftInput) {
		return {
			event_id: input.eventId as string,
			kind: input.kind as string,
			amount: orNull(input.amount),
			item_name: orNull(input.itemName),
			quantity: orNull(input.quantity),
			message: orNull(input.message),
			attendance: orNull(input.attendance),
			notes: orNull(input.notes),
		};
	}

	/** 差出人の入力を保存用の形にする。関係は存在するものだけ（非表示の関係は、すでに設定済みなら維持できる） */
	private personRecord(input: Partial<PersonInput>, currentRelationshipId: string | null = null) {
		const relationshipId = orNull(input.relationshipId);
		if (relationshipId !== null) {
			const rel = this.first<{ is_hidden: number }>(
				"SELECT is_hidden FROM relationships WHERE id = ?",
				relationshipId,
			);
			if (!rel || (rel.is_hidden === 1 && relationshipId !== currentRelationshipId)) {
				throw invalid("relationshipId", "関係を選び直してください");
			}
		}
		return {
			name: orNull(input.name),
			name_kana: orNull(input.nameKana),
			organization: orNull(input.organization),
			position: orNull(input.position),
			relationship_id: relationshipId,
			postal_code: orNull(input.postalCode),
			address: orNull(input.address),
			phone: orNull(input.phone),
			notes: orNull(input.notes),
		};
	}

	private searchText(p: {
		name: string | null;
		name_kana: string | null;
		organization: string | null;
		address: string | null;
	}): string {
		return buildSearchText([p.name, p.name_kana, p.organization, p.address]);
	}

	/** 既存の差出人を確認する、または新しく作る */
	private resolvePerson(
		caller: Caller,
		now: string,
		ref: ContributorRef | ContributorAddInput["person"],
	): { id: string; name: string | null; organization: string | null } {
		if (ref.type === "existing") {
			const person = this.first<{ id: string; name: string | null; organization: string | null }>(
				"SELECT id, name, organization FROM persons WHERE id = ? AND deleted_at IS NULL",
				ref.personId,
			);
			if (!person) throw invalid("personId", "選んだ差出人が見つかりません");
			return person;
		}
		const id = uuidv7();
		const record = this.personRecord(ref.input);
		this.sql.exec(
			`INSERT INTO persons (id, name, name_kana, organization, position, relationship_id, postal_code,
                            address, phone, notes, search_text, created_by, created_at, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			id,
			record.name,
			record.name_kana,
			record.organization,
			record.position,
			record.relationship_id,
			record.postal_code,
			record.address,
			record.phone,
			record.notes,
			this.searchText(record),
			caller.userId,
			now,
			caller.userId,
			now,
		);
		this.log(caller, now, "person", id, "create", diffOf(null, record));
		return { id, name: record.name, organization: record.organization };
	}

	private activePersonCount(): number {
		return this.scalar(
			`SELECT count(DISTINCT gc.person_id) AS n
         FROM gift_contributors gc JOIN gifts g ON g.id = gc.gift_id
        WHERE g.deleted_at IS NULL`,
		);
	}

	/** 差出人ごとの件数と香典の合計（連名は按分） */
	private personTotals(): Map<string, { giftCount: number; kodenTotal: number }> {
		const rows = this.all<{
			gift_id: string;
			kind: string;
			amount: number | null;
			person_id: string;
			is_primary: number;
			share_amount: number | null;
		}>(
			`SELECT g.id AS gift_id, g.kind, g.amount, gc.person_id, gc.is_primary, gc.share_amount
         FROM gifts g JOIN gift_contributors gc ON gc.gift_id = g.id
        WHERE g.deleted_at IS NULL ORDER BY gc.rowid`,
		);
		const byGift = new Map<string, typeof rows>();
		for (const r of rows) byGift.set(r.gift_id, [...(byGift.get(r.gift_id) ?? []), r]);

		const totals = new Map<string, { giftCount: number; kodenTotal: number }>();
		for (const contributors of byGift.values()) {
			const first = contributors[0];
			if (!first) continue;
			const shares =
				first.kind === "koden" && first.amount !== null
					? allocateAmount(
							first.amount,
							contributors.map((c) => ({
								personId: c.person_id,
								isPrimary: c.is_primary === 1,
								shareAmount: c.share_amount,
							})),
						)
					: new Map<string, number>();
			for (const c of contributors) {
				const t = totals.get(c.person_id) ?? { giftCount: 0, kodenTotal: 0 };
				t.giftCount += 1;
				t.kodenTotal += shares.get(c.person_id) ?? 0;
				totals.set(c.person_id, t);
			}
		}
		return totals;
	}

	private toPersonView(
		p: PersonRow,
		totals: Map<string, { giftCount: number; kodenTotal: number }>,
	): PersonView {
		const t = totals.get(p.id);
		return {
			id: p.id,
			name: p.name,
			nameKana: p.name_kana,
			organization: p.organization,
			position: p.position,
			relationshipId: p.relationship_id,
			relationshipName: p.relationship_name,
			postalCode: p.postal_code,
			address: p.address,
			phone: p.phone,
			notes: p.notes,
			version: p.version,
			giftCount: t?.giftCount ?? 0,
			kodenTotal: t?.kodenTotal ?? 0,
		};
	}

	/** いただきもの（と差出人）を読む。where は ` AND ...` の形で渡す */
	private queryGifts(
		where: string,
		params: SqlStorageValue[],
		orderBy: string,
		limit?: number,
	): GiftView[] {
		const gifts = this.all<GiftRow>(
			`SELECT ${GIFT_COLUMNS} FROM gifts g JOIN events e ON e.id = g.event_id
        WHERE g.deleted_at IS NULL${where}
        ORDER BY ${orderBy}${limit ? ` LIMIT ${Math.floor(limit)}` : ""}`,
			...params,
		);
		if (gifts.length === 0) return [];

		const contributors = new Map<string, ContributorView[]>();
		const ids = gifts.map((g) => g.id);
		// SQLite の変数の上限を避けるため、一定数ごとに読む
		for (let i = 0; i < ids.length; i += 500) {
			const chunk = ids.slice(i, i + 500);
			const rows = this.all<ContributorRow>(
				`SELECT gc.gift_id, gc.person_id, p.name, p.name_kana, p.organization, r.name AS relationship_name,
                gc.is_primary, gc.share_amount
           FROM gift_contributors gc
           JOIN persons p ON p.id = gc.person_id
           LEFT JOIN relationships r ON r.id = p.relationship_id
          WHERE gc.gift_id IN (${chunk.map(() => "?").join(",")})
          ORDER BY gc.is_primary DESC, gc.rowid`,
				...chunk,
			);
			for (const r of rows) {
				const list = contributors.get(r.gift_id) ?? [];
				list.push({
					personId: r.person_id,
					name: r.name,
					nameKana: r.name_kana,
					organization: r.organization,
					relationshipName: r.relationship_name,
					isPrimary: r.is_primary === 1,
					shareAmount: r.share_amount,
				});
				contributors.set(r.gift_id, list);
			}
		}

		return gifts.map((g) => ({
			id: g.id,
			eventId: g.event_id,
			eventName: g.event_name,
			receiptNo: g.receipt_no,
			kind: g.kind as GiftView["kind"],
			amount: g.amount,
			itemName: g.item_name,
			quantity: g.quantity,
			message: g.message,
			attendance: g.attendance as GiftView["attendance"],
			notes: g.notes,
			version: g.version,
			createdAt: g.created_at,
			updatedAt: g.updated_at,
			contributors: contributors.get(g.id) ?? [],
		}));
	}

	// ---- 香典返しの個別の処理 -------------------------------------------------

	private returnItems(): ReturnItemView[] {
		return this.all<{
			id: string;
			name: string;
			category: string | null;
			price: number;
			description: string | null;
			image_r2_key: string | null;
			is_active: number;
			sort_order: number;
			version: number;
			used: number;
		}>(
			`SELECT i.*, (SELECT count(*) FROM return_lines l WHERE l.return_item_id = i.id)
                 + (SELECT count(*) FROM return_rules r WHERE r.suggested_item_id = i.id) AS used
         FROM return_items i ORDER BY i.sort_order`,
		).map((i) => ({
			id: i.id,
			name: i.name,
			category: i.category,
			price: i.price,
			description: i.description,
			imageKey: i.image_r2_key,
			isActive: i.is_active === 1,
			sortOrder: i.sort_order,
			version: i.version,
			usedCount: i.used,
		}));
	}

	private returnRules(): ReturnRuleView[] {
		return this.all<{
			id: string;
			min_amount: number;
			max_amount: number | null;
			ratio_numerator: number;
			ratio_denominator: number;
			suggested_item_id: string | null;
			item_name: string | null;
			version: number;
		}>(
			`SELECT r.*, i.name AS item_name FROM return_rules r
         LEFT JOIN return_items i ON i.id = r.suggested_item_id
        ORDER BY r.min_amount, r.sort_order`,
		).map((r) => ({
			id: r.id,
			minAmount: r.min_amount,
			maxAmount: r.max_amount,
			ratioNumerator: r.ratio_numerator,
			ratioDenominator: r.ratio_denominator,
			suggestedItemId: r.suggested_item_id,
			suggestedItemName: r.item_name,
			version: r.version,
		}));
	}

	private returnItemRecord(input: ReturnItemInput) {
		return {
			name: input.name,
			category: input.category,
			price: input.price,
			description: input.description,
		};
	}

	private returnRuleRecord(input: ReturnRuleInput) {
		return {
			min_amount: input.minAmount,
			max_amount: input.maxAmount,
			ratio_numerator: input.ratioNumerator,
			ratio_denominator: input.ratioDenominator,
			suggested_item_id: input.suggestedItemId,
		};
	}

	private returnItemUsage(itemId: string): number {
		return (
			this.scalar("SELECT count(*) AS n FROM return_lines WHERE return_item_id = ?", itemId) +
			this.scalar("SELECT count(*) AS n FROM return_rules WHERE suggested_item_id = ?", itemId)
		);
	}

	/** 推奨品は有効な品から選ぶ（すでに設定済みの品は、無効にした後もそのまま保存できる） */
	private assertSuggestedItem(itemId: string | null, currentItemId: string | null): void {
		if (itemId === null) return;
		const item = this.first<{ is_active: number }>(
			"SELECT is_active FROM return_items WHERE id = ?",
			itemId,
		);
		if (!item || (item.is_active !== 1 && itemId !== currentItemId)) {
			throw invalid("suggestedItemId", "推奨品を選び直してください");
		}
	}

	private activeItem(itemId: string): { id: string; name: string; price: number } {
		const item = this.first<{ id: string; name: string; price: number; is_active: number }>(
			"SELECT id, name, price, is_active FROM return_items WHERE id = ?",
			itemId,
		);
		if (!item || item.is_active !== 1) {
			throw invalid("itemId", "返礼品が見つかりません。カタログを確認してください");
		}
		return item;
	}

	/** 明細を 1 行追加する。品名・単価はその時点の値を写して持つ（カタログの変更の影響を受けない） */
	private insertReturnLine(
		returnId: string,
		line: { itemId: string | null; name: string; unitPrice: number; quantity: number },
	): { id: string; snapshot: { name: string; unitPrice: number; quantity: number } } {
		const id = uuidv7();
		this.sql.exec(
			`INSERT INTO return_lines (id, return_id, return_item_id, name, unit_price, quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
			id,
			returnId,
			line.itemId,
			line.name,
			line.unitPrice,
			line.quantity,
		);
		return {
			id,
			snapshot: { name: line.name, unitPrice: line.unitPrice, quantity: line.quantity },
		};
	}

	/** 楽観ロックを確認し、変更前の行を返す。version はここで 1 つ進める */
	private lockReturn(returnId: string, version: number): Row & { status: string } {
		const current = this.first<Row & { status: string; version: number }>(
			`SELECT status, method, on_day_amount, due_date, arranged_at, shipped_at, ship_name,
              ship_postal_code, ship_address, ship_phone, notes, version
         FROM returns WHERE id = ?`,
			returnId,
		);
		if (!current) throw new LedgerFailure({ code: "not_found" });
		if (current.version !== version) throw new LedgerFailure({ code: "conflict" });
		this.sql.exec("UPDATE returns SET version = version + 1 WHERE id = ?", returnId);
		const { version: _v, ...row } = current;
		return row;
	}

	private touchReturn(caller: Caller, now: string, returnId: string): void {
		this.sql.exec(
			"UPDATE returns SET updated_by = ?, updated_at = ? WHERE id = ?",
			caller.userId,
			now,
			returnId,
		);
	}

	/** 香典返しと明細を読む（returnId を省略するとすべて） */
	private returnViews(returnId?: string): ReturnView[] {
		const rows = this.all<{
			id: string;
			person_id: string;
			status: string;
			method: string | null;
			on_day_amount: number;
			due_date: string | null;
			arranged_at: string | null;
			shipped_at: string | null;
			ship_name: string | null;
			ship_postal_code: string | null;
			ship_address: string | null;
			ship_phone: string | null;
			notes: string | null;
			version: number;
			updated_at: string;
		}>(
			`SELECT * FROM returns ${returnId === undefined ? "" : "WHERE id = ?"}`,
			...(returnId === undefined ? [] : [returnId]),
		);
		if (rows.length === 0) return [];
		const lines = new Map<string, ReturnLineView[]>();
		for (const l of this.all<{
			id: string;
			return_id: string;
			return_item_id: string | null;
			name: string;
			unit_price: number;
			quantity: number;
		}>(
			`SELECT id, return_id, return_item_id, name, unit_price, quantity FROM return_lines
        ${returnId === undefined ? "" : "WHERE return_id = ?"} ORDER BY rowid`,
			...(returnId === undefined ? [] : [returnId]),
		)) {
			const list = lines.get(l.return_id) ?? [];
			list.push({
				id: l.id,
				itemId: l.return_item_id,
				name: l.name,
				unitPrice: l.unit_price,
				quantity: l.quantity,
			});
			lines.set(l.return_id, list);
		}
		return rows.map((r) => {
			const own = lines.get(r.id) ?? [];
			return {
				id: r.id,
				personId: r.person_id,
				status: r.status as ReturnView["status"],
				method: r.method as ReturnView["method"],
				onDayAmount: r.on_day_amount,
				dueDate: r.due_date,
				arrangedAt: r.arranged_at,
				shippedAt: r.shipped_at,
				shipName: r.ship_name,
				shipPostalCode: r.ship_postal_code,
				shipAddress: r.ship_address,
				shipPhone: r.ship_phone,
				notes: r.notes,
				version: r.version,
				lines: own,
				linesTotal: own.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
				updatedAt: r.updated_at,
			};
		});
	}

	/** 香典返しの期限の基準にする行事（日付のある四十九日のうち最も早いもの） */
	private dueEvent(): { id: string; name: string; date: string } | undefined {
		return this.first<{ id: string; name: string; date: string }>(
			`SELECT id, name, date FROM events
        WHERE kind = 'memorial_49' AND date IS NOT NULL AND deleted_at IS NULL
        ORDER BY date, sort_order LIMIT 1`,
		);
	}

	/**
	 * 未対応の香典返しの数: いただいた額（連名は按分）が 0 円より多い差出人のうち、香典返しがないか状況が「未対応」の人。
	 * 一括提案と同じ条件にする（連名で負担額が 0 円の人は数えない）
	 */
	private pendingReturnCount(): number {
		const totals = this.personTotals();
		const statuses = new Map(
			this.all<{ person_id: string; status: string }>("SELECT person_id, status FROM returns").map(
				(r) => [r.person_id, r.status],
			),
		);
		return this.all<{ id: string }>("SELECT id FROM persons WHERE deleted_at IS NULL").filter(
			(p) => {
				if ((totals.get(p.id)?.kodenTotal ?? 0) <= 0) return false;
				const status = statuses.get(p.id);
				return status === undefined || status === "pending";
			},
		).length;
	}

	/**
	 * 期限のお知らせ（E6-5）を作り直す。期限は香典帳に 1 つ（dueEvent: 日付のある四十九日のうち最も早いもの）で、
	 * その行事の分だけを予定する。行事を追加・変更・削除するたびに呼ぶ。日時が変わらないものは残す（送信済みの印を保つ）
	 */
	private syncReminders(now: string): void {
		const due = this.dueEvent();
		const wanted = due ? reminderSchedule(due.date, new Date(now)) : [];
		const existing = this.all<{ id: string; kind: string; event_id: string; fire_at: string }>(
			"SELECT id, kind, event_id, fire_at FROM reminders",
		);
		const same = (r: (typeof existing)[number], w: (typeof wanted)[number]) =>
			r.event_id === due?.id && r.kind === w.kind && r.fire_at === w.fireAt;
		for (const r of existing) {
			if (!wanted.some((w) => same(r, w))) {
				this.sql.exec("DELETE FROM reminders WHERE id = ?", r.id);
			}
		}
		for (const w of wanted) {
			if (due && !existing.some((r) => same(r, w))) {
				this.sql.exec(
					"INSERT INTO reminders (id, kind, event_id, fire_at) VALUES (?, ?, ?, ?)",
					uuidv7(),
					w.kind,
					due.id,
					w.fireAt,
				);
			}
		}
	}

	/**
	 * アラームを予約する。DO のアラームは 1 つだけなので、統計の投影（書き込みの数秒後）と
	 * 次のお知らせのうち、早い方に合わせる（03 §7）
	 */
	private async scheduleAlarm(projectionSoon: boolean): Promise<void> {
		const candidates: number[] = [];
		if (projectionSoon) candidates.push(Date.now() + PROJECTION_DELAY_MS);
		const next = this.first<{ at: string | null }>(
			"SELECT min(fire_at) AS at FROM reminders WHERE sent_at IS NULL",
		)?.at;
		if (next) candidates.push(Date.parse(next));
		if (candidates.length === 0) return;
		const wanted = Math.min(...candidates);
		const current = await this.ctx.storage.getAlarm();
		if (current === null || wanted < current) await this.ctx.storage.setAlarm(wanted);
	}

	/**
	 * 統計の投影（03 §7）。香典帳が D1 から削除済みなら false。
	 * 同じ seq でも上書きする（スキーマの移行で増えた項目を、変更ログが進む前に埋めるため。同じ seq なら中身も同じ）。
	 * 取り込みの後（meta の projection_replace）は、seq が小さくても上書きする
	 */
	private async project(koudenId: string): Promise<boolean> {
		const replace = this.meta("projection_replace") !== null;
		const stats = this.first<{ gift_count: number; total_amount: number }>(
			`SELECT count(*) AS gift_count, coalesce(sum(CASE WHEN kind = 'koden' THEN amount END), 0) AS total_amount
         FROM gifts WHERE deleted_at IS NULL`,
		);
		const last = this.first<{ seq: number; at: string; op: string }>(
			"SELECT seq, at, op FROM change_log ORDER BY seq DESC LIMIT 1",
		);
		if (!stats || !last) return true;
		// 取り込みの後まだ編集がなければ、旧アプリで最後に動いた時刻
		const activityAt =
			last.op === "import" ? (this.meta("imported_activity_at") ?? last.at) : last.at;
		try {
			await this.env.DB.prepare(
				`INSERT INTO kouden_stats (kouden_id, gift_count, total_amount, person_count, return_pending,
                                   last_activity_at, projected_seq)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (kouden_id) DO UPDATE SET
           gift_count = excluded.gift_count, total_amount = excluded.total_amount,
           person_count = excluded.person_count, return_pending = excluded.return_pending,
           last_activity_at = excluded.last_activity_at, projected_seq = excluded.projected_seq
         WHERE ? OR excluded.projected_seq >= kouden_stats.projected_seq`,
			)
				.bind(
					koudenId,
					stats.gift_count,
					stats.total_amount,
					this.activePersonCount(),
					this.pendingReturnCount(),
					activityAt,
					last.seq,
					replace ? 1 : 0,
				)
				.run();
			if (replace) this.sql.exec("DELETE FROM meta WHERE key = 'projection_replace'");
			return true;
		} catch (err) {
			// 香典帳が D1 から削除済みなら投影先がない。再試行しても成功しないので終える
			if (err instanceof Error && err.message.includes("FOREIGN KEY")) {
				log("warn", "ledger_projection_orphan", { koudenId });
				return false;
			}
			throw err;
		}
	}

	/**
	 * 期限の来たお知らせを送る（E6-5）。宛先はオーナーと、お知らせを希望した編集者（D1）。
	 * 未対応が 0 件のとき・アーカイブ中は送らずに送信済みにする。
	 * 全員への送信に失敗したら例外にする（alarm が REMINDER_RETRY_MS 後に送り直す）
	 */
	private async sendDueReminders(koudenId: string): Promise<void> {
		const due = this.all<{
			id: string;
			kind: string;
			event_id: string;
			event_name: string;
			date: string;
		}>(
			`SELECT r.id, r.kind, r.event_id, e.name AS event_name, e.date
         FROM reminders r JOIN events e ON e.id = r.event_id
        WHERE r.sent_at IS NULL AND r.fire_at <= ? AND e.deleted_at IS NULL AND e.date IS NOT NULL
        ORDER BY r.fire_at`,
			new Date().toISOString(),
		);
		if (due.length === 0) return;
		// 遅れて発火して同じ行事の分が重なった場合は、期限に近い方の 1 通だけ送る
		const latest = new Map<string, (typeof due)[number]>();
		for (const r of due) latest.set(r.event_id, r);

		const kouden = await this.env.DB.prepare("SELECT title, status FROM koudens WHERE id = ?")
			.bind(koudenId)
			.first<{ title: string; status: string }>();
		const pending = this.pendingReturnCount();
		const recipients =
			kouden?.status === "active" && pending > 0
				? (
						await this.env.DB.prepare(
							`SELECT u.email, u.display_name FROM kouden_members m JOIN users u ON u.id = m.user_id
                WHERE m.kouden_id = ? AND u.deleted_at IS NULL
                  AND (m.role = 'owner' OR (m.role = 'editor' AND m.notify_reminders = 1))`,
						)
							.bind(koudenId)
							.all<{ email: string; display_name: string }>()
					).results
				: [];

		for (const r of latest.values()) {
			let sent = 0;
			for (const to of recipients) {
				try {
					await this.mailer.send(
						reminderMail({
							to,
							koudenTitle: kouden?.title ?? "",
							days: r.kind === "return_due_14d" ? 14 : 3,
							eventName: r.event_name,
							dueDate: r.date,
							pending,
							url: `${this.env.APP_ORIGIN}/k/${koudenId}/returns`,
						}),
					);
					sent += 1;
				} catch (err) {
					log("error", "reminder_mail_failed", {
						koudenId,
						kind: r.kind,
						error: err instanceof Error ? err.message : String(err),
					});
				}
			}
			if (recipients.length > 0 && sent === 0) throw new Error("reminder mail failed");
			this.sql.exec(
				"UPDATE reminders SET sent_at = ? WHERE event_id = ? AND sent_at IS NULL AND fire_at <= ?",
				new Date().toISOString(),
				r.event_id,
				new Date().toISOString(),
			);
			log("info", "reminder_sent", { koudenId, kind: r.kind, recipients: sent, pending });
		}
	}
}
