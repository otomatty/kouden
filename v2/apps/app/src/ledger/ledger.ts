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
	type PersonInput,
	personLabel,
	type ReceptionInput,
	type RelationshipInput,
	toSearchKey,
	uuidv7,
} from "@kouden/domain";
import { DurableObject } from "cloudflare:workers";
import { log } from "../lib/logger.ts";
import { MIGRATIONS, migrate } from "./schema.ts";
import type {
	Caller,
	ContributorView,
	GiftView,
	LedgerError,
	LedgerEvent,
	LedgerRelationship,
	LedgerResult,
	Overview,
	PersonDetail,
	PersonView,
	ReceptionResult,
} from "./types.ts";

/** 書き込みから統計の投影（D1 kouden_stats）までの待ち時間（03 §7） */
export const PROJECTION_DELAY_MS = 5_000;

const SYSTEM_ACTOR = { userId: "system", displayName: "システム" } as const;

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
			return { ...this.toPersonView(row, this.personTotals()), gifts };
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
			const before = this.contributorIds(giftId);
			if (!before.includes(personId)) throw new LedgerFailure({ code: "not_found" });
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
			this.log(caller, now, "gift", giftId, "update", {
				[`contributor:${personId}`]: [null, input],
			});
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

	// ---- 香典帳の削除・投影 --------------------------------------------------

	/**
	 * 香典帳の削除（03 §8）。オーナーの確認は Worker が D1 で行う。
	 * 削除済みの印（meta.deleted_at）だけを残し、削除の直前に権限確認を通った要求が遅れて届いても、
	 * 台帳を作り直さずに not_found を返す。
	 */
	async deleteAll(): Promise<void> {
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
		this.sql.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
		this.sql.exec(
			"INSERT OR REPLACE INTO meta (key, value) VALUES ('deleted_at', ?)",
			new Date().toISOString(),
		);
		this.state = "deleted";
	}

	/** 統計の投影（03 §7）。書き込みの数秒後に D1 の kouden_stats を更新する */
	override async alarm(): Promise<void> {
		if (!this.ensureSchema()) return;
		const koudenId = this.meta("kouden_id");
		if (koudenId === null) return;
		const stats = this.first<{ gift_count: number; total_amount: number }>(
			`SELECT count(*) AS gift_count, coalesce(sum(CASE WHEN kind = 'koden' THEN amount END), 0) AS total_amount
         FROM gifts WHERE deleted_at IS NULL`,
		);
		const last = this.first<{ seq: number; at: string }>(
			"SELECT seq, at FROM change_log ORDER BY seq DESC LIMIT 1",
		);
		if (!stats || !last) return;
		try {
			await this.env.DB.prepare(
				`INSERT INTO kouden_stats (kouden_id, gift_count, total_amount, person_count, return_pending,
                                   last_activity_at, projected_seq)
         VALUES (?, ?, ?, ?, 0, ?, ?)
         ON CONFLICT (kouden_id) DO UPDATE SET
           gift_count = excluded.gift_count, total_amount = excluded.total_amount,
           person_count = excluded.person_count, return_pending = excluded.return_pending,
           last_activity_at = excluded.last_activity_at, projected_seq = excluded.projected_seq
         WHERE excluded.projected_seq > kouden_stats.projected_seq`,
			)
				.bind(
					koudenId,
					stats.gift_count,
					stats.total_amount,
					this.activePersonCount(),
					last.at,
					last.seq,
				)
				.run();
		} catch (err) {
			// 香典帳が D1 から削除済みなら投影先がない。再試行しても成功しないので終える
			if (err instanceof Error && err.message.includes("FOREIGN KEY")) {
				log("warn", "ledger_projection_orphan", { koudenId });
				return;
			}
			throw err;
		}
	}

	// ---- 共通の仕組み -------------------------------------------------------

	/** スキーマを用意する。削除済みの香典帳なら false（スキーマは作らない） */
	private ensureSchema(): boolean {
		if (this.state === "unknown") {
			this.sql.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
			if (this.meta("deleted_at") !== null) {
				this.state = "deleted";
			} else {
				migrate(this.ctx.storage, MIGRATIONS);
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
		try {
			this.prepare(caller);
			if (!can(caller.role, action)) return { ok: false, error: { code: "forbidden" } };
			const before = this.lastSeq();
			value = this.ctx.storage.transactionSync(() => {
				const result = fn(new Date().toISOString());
				if (this.lastSeq() === before) throw new Error("ledger write without change_log");
				return result;
			});
		} catch (err) {
			if (err instanceof LedgerFailure) return { ok: false, error: err.error };
			throw err;
		}
		if ((await this.ctx.storage.getAlarm()) === null) {
			await this.ctx.storage.setAlarm(Date.now() + PROJECTION_DELAY_MS);
		}
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

	private nextSortOrder(table: "events" | "relationships"): number {
		return this.scalar(`SELECT coalesce(max(sort_order), 0) + 1 AS n FROM ${table}`);
	}

	/** 隣の行と並び順を入れ替える。端の行はそれ以上動かせない */
	private swapSortOrder(
		caller: Caller,
		now: string,
		table: "events" | "relationships",
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
}
