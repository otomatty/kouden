/**
 * KoudenLedger（DO）の SQLite スキーマ。docs/rebuild/03-domain-model.md §3・§4
 *
 * - 各 DO は起動後の最初の呼び出しで `meta.schema_version` を見て、未適用の分を順に実行する
 * - 番号は配列の添字 + 1。適用済みの要素は変更せず、変更は末尾に追加する
 * - 後方互換な変更（テーブル・列の追加）のみを基本とする
 */
export const MIGRATIONS: readonly string[] = [
	// 1: 台帳の骨格（M1）。香典返し・写真・リマインドのテーブルは後のマイルストーンで追加する
	`
CREATE TABLE events (
  id                TEXT PRIMARY KEY,
  kind              TEXT NOT NULL CHECK (kind IN ('wake','funeral','memorial_49','memorial_1y','memorial_other','other')),
  name              TEXT NOT NULL,
  date              TEXT,
  sort_order        INTEGER NOT NULL,
  next_receipt_no   INTEGER NOT NULL DEFAULT 1,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT
);

CREATE TABLE relationships (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  sort_order        INTEGER NOT NULL,
  is_hidden         INTEGER NOT NULL DEFAULT 0,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE persons (
  id                TEXT PRIMARY KEY,
  name              TEXT,
  name_kana         TEXT,
  organization      TEXT,
  position          TEXT,
  relationship_id   TEXT REFERENCES relationships(id),
  postal_code       TEXT,
  address           TEXT,
  phone             TEXT,
  notes             TEXT,
  search_text       TEXT NOT NULL DEFAULT '',
  version           INTEGER NOT NULL DEFAULT 1,
  created_by        TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  updated_by        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT,
  CHECK (name IS NOT NULL OR organization IS NOT NULL)
);
CREATE INDEX idx_persons_kana ON persons(name_kana);

CREATE TABLE gifts (
  id                TEXT PRIMARY KEY,
  event_id          TEXT NOT NULL REFERENCES events(id),
  receipt_no        INTEGER,
  kind              TEXT NOT NULL CHECK (kind IN ('koden','kumotsu','kyoka','choden','other')),
  amount            INTEGER,
  item_name         TEXT,
  quantity          INTEGER,
  message           TEXT,
  attendance        TEXT CHECK (attendance IN ('attended','condolence_visit','absent')),
  notes             TEXT,
  version           INTEGER NOT NULL DEFAULT 1,
  created_by        TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  updated_by        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT,
  CHECK (kind <> 'koden' OR amount IS NOT NULL)
);
CREATE UNIQUE INDEX uq_gifts_receipt ON gifts(event_id, receipt_no) WHERE receipt_no IS NOT NULL;
CREATE INDEX idx_gifts_event ON gifts(event_id) WHERE deleted_at IS NULL;

CREATE TABLE gift_contributors (
  gift_id           TEXT NOT NULL REFERENCES gifts(id),
  person_id         TEXT NOT NULL REFERENCES persons(id),
  is_primary        INTEGER NOT NULL DEFAULT 0,
  share_amount      INTEGER,
  PRIMARY KEY (gift_id, person_id)
);
CREATE INDEX idx_contributors_person ON gift_contributors(person_id);
-- 代表者は 1 件に 1 人
CREATE UNIQUE INDEX uq_contributors_primary ON gift_contributors(gift_id) WHERE is_primary = 1;

CREATE TABLE change_log (
  seq               INTEGER PRIMARY KEY AUTOINCREMENT,
  at                TEXT NOT NULL,
  actor_user_id     TEXT NOT NULL,
  actor_name        TEXT NOT NULL,
  entity            TEXT NOT NULL,
  entity_id         TEXT NOT NULL,
  op                TEXT NOT NULL CHECK (op IN ('create','update','delete','restore','merge','import')),
  diff              TEXT
);
CREATE INDEX idx_change_log_entity ON change_log(entity, entity_id);
`,
	// 2: 香典返し（M3）。カタログ・金額帯ルール・差出人ごとの香典返しと明細・期限のお知らせ
	`
CREATE TABLE return_items (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  category          TEXT,
  price             INTEGER NOT NULL,
  description       TEXT,
  image_r2_key      TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1,
  sort_order        INTEGER NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE return_rules (
  id                TEXT PRIMARY KEY,
  min_amount        INTEGER NOT NULL,
  max_amount        INTEGER,
  ratio_numerator   INTEGER NOT NULL,
  ratio_denominator INTEGER NOT NULL,
  suggested_item_id TEXT REFERENCES return_items(id),
  sort_order        INTEGER NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE returns (
  id                TEXT PRIMARY KEY,
  person_id         TEXT NOT NULL UNIQUE REFERENCES persons(id),
  status            TEXT NOT NULL CHECK (status IN ('pending','arranged','shipped','handed_on_day','not_required')),
  method            TEXT CHECK (method IN ('on_day','shipping','hand_delivery')),
  on_day_amount     INTEGER NOT NULL DEFAULT 0,
  due_date          TEXT,
  arranged_at       TEXT,
  shipped_at        TEXT,
  ship_name         TEXT,
  ship_postal_code  TEXT,
  ship_address      TEXT,
  ship_phone        TEXT,
  notes             TEXT,
  version           INTEGER NOT NULL DEFAULT 1,
  created_by        TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  updated_by        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX idx_returns_status ON returns(status);

CREATE TABLE return_lines (
  id                TEXT PRIMARY KEY,
  return_id         TEXT NOT NULL REFERENCES returns(id),
  return_item_id    TEXT REFERENCES return_items(id),
  name              TEXT NOT NULL,
  unit_price        INTEGER NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_return_lines_return ON return_lines(return_id);

CREATE TABLE reminders (
  id                TEXT PRIMARY KEY,
  kind              TEXT NOT NULL CHECK (kind IN ('return_due_14d','return_due_3d')),
  event_id          TEXT NOT NULL REFERENCES events(id),
  fire_at           TEXT NOT NULL,
  sent_at           TEXT,
  UNIQUE (kind, event_id)
);
CREATE INDEX idx_reminders_due ON reminders(fire_at) WHERE sent_at IS NULL;

-- この移行より前に日付を入れた四十九日にも、お知らせの予定を作る（14 日前・3 日前の 9:00 JST = 0:00 UTC）。
-- 期限は日付のある四十九日のうち最も早いもの（KoudenLedger.dueEvent と同じ）。
-- 時刻の形式は reminderSchedule（packages/domain）と同じ。過ぎた分は作らない
INSERT INTO reminders (id, kind, event_id, fire_at)
SELECT lower(hex(randomblob(16))), o.kind, e.id, strftime('%Y-%m-%dT00:00:00.000Z', e.date, o.offset)
  FROM events e
  JOIN (SELECT 'return_due_14d' AS kind, '-14 days' AS offset
        UNION ALL SELECT 'return_due_3d', '-3 days') o
 WHERE e.id = (SELECT id FROM events
                WHERE kind = 'memorial_49' AND date IS NOT NULL AND deleted_at IS NULL
                ORDER BY date, sort_order LIMIT 1)
   AND strftime('%Y-%m-%dT00:00:00.000Z', e.date, o.offset) > strftime('%Y-%m-%dT%H:%M:%fZ', 'now');
`,
];

/**
 * 未適用のマイグレーションを順に実行する。各段階は 1 トランザクションで、`meta.schema_version` も同時に進める。
 * 戻り値は適用後のスキーマのバージョン。
 */
export function migrate(storage: DurableObjectStorage, migrations: readonly string[]): number {
	const sql = storage.sql;
	sql.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
	const row = sql
		.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'schema_version'")
		.toArray()[0];
	let version = row ? Number(row.value) : 0;
	if (version > migrations.length) {
		// 新しいコードで移行した DO を古いコードで開いた（ロールバック直後など）。書き込みで壊さないよう止める
		throw new Error(`ledger schema ${version} is newer than this code (${migrations.length})`);
	}
	while (version < migrations.length) {
		const next = version + 1;
		storage.transactionSync(() => {
			sql.exec(migrations[next - 1] ?? "");
			sql.exec(
				`INSERT INTO meta (key, value) VALUES ('schema_version', ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
				String(next),
			);
		});
		version = next;
	}
	return version;
}
