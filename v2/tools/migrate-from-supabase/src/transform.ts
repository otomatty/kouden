/**
 * 旧データ → 新しい形への変換（05 §3 の対応表）。入出力だけの関数で、何度呼んでも同じ結果になる。
 * 自動で直せない・判断が要るデータは warnings に入れる（検証レポートに載せる）
 */
import {
	type Attendance,
	type GiftKind,
	IMPORT_USERS_PER_REQUEST,
	type ImportKoudenPayload,
	type ImportUser,
	type ImportUsersPayload,
	type LedgerSnapshot,
	type ReturnMethod,
	type ReturnStatus,
	type Role,
} from "@kouden/domain";
import { newId } from "./ids.ts";
import type {
	LegacyAuthUser,
	LegacyEntry,
	LegacyKoudenSource,
	LegacyProfile,
	LegacyReturnRecord,
} from "./source.ts";

export interface Warning {
	code: string;
	/** 旧データの ID（どの行か） */
	legacyId: string;
	message: string;
}

/** R2 へコピーする画像（05 §2 の 3c） */
export interface FileCopy {
	/** 旧データの画像の場所（return_items.image_url など） */
	source: string;
	/** R2 のキー */
	key: string;
}

export interface KoudenTransform {
	koudenId: string;
	payload: ImportKoudenPayload;
	files: FileCopy[];
	warnings: Warning[];
}

/** 氏名・団体名のどちらもない差出人に入れる名前（差出人の必須条件、05 §3） */
export const MISSING_NAME = "（氏名未記入）";
export const MISSING_NAME_NOTE = "移行時に補完: 旧データに氏名・団体名がありませんでした";
/** 旧データの「返礼済み」の印から作った香典返しの備考 */
export const COMPLETED_FLAG_NOTE =
	"移行時に作成: 旧データで返礼済みになっていました（品・送付先の記録はありません）";

const iso = (value: string) => new Date(value).toISOString();

/** 日付（YYYY-MM-DD）。時刻付きなら日本時間の日付にする */
function isoDate(value: string | null): string | null {
	if (value === null || value === "") return null;
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
	const t = new Date(value).getTime();
	if (Number.isNaN(t)) return null;
	return new Date(t + 9 * 3_600_000).toISOString().slice(0, 10);
}

const trimOrNull = (value: string | null | undefined) => {
	const v = value?.trim();
	return v ? v : null;
};

const yen = (value: number | null | undefined) =>
	value === null || value === undefined ? null : Math.max(0, Math.round(value));

const byCreated = <T extends { created_at: string | null }>(a: T, b: T) =>
	(a.created_at ?? "").localeCompare(b.created_at ?? "");

// ---- ユーザー ---------------------------------------------------------------------

export function transformUsers(
	users: LegacyAuthUser[],
	profiles: LegacyProfile[],
): { users: ImportUser[]; warnings: Warning[] } {
	const names = new Map(profiles.map((p) => [p.id, p.display_name]));
	const warnings: Warning[] = [];
	const out = users.map((u): ImportUser => {
		const email = u.email?.trim() ?? "";
		if (email === "") {
			warnings.push({
				code: "user_without_email",
				legacyId: u.id,
				message: "メールアドレスがありません。運営者による手動の紐づけができません",
			});
		}
		const google = u.identities.find((i) => i.provider === "google");
		const displayName = trimOrNull(names.get(u.id)) ?? trimOrNull(email.split("@")[0]) ?? "利用者";
		return {
			id: newId.user(u.id),
			legacyUserId: u.id,
			email,
			// 旧データの表示名は切り詰めない（画面の上限は、本人が表示名を変えるときに検証される）
			displayName,
			googleSub: google?.provider_id ?? null,
			createdAt: iso(u.created_at),
		};
	});
	return { users: out, warnings };
}

/** ユーザーの取り込みは、D1 への 1 回の要求の上限に収まる人数ずつに分けて送る */
export function userPayloads(users: ImportUser[]): ImportUsersPayload[] {
	const out: ImportUsersPayload[] = [];
	for (let i = 0; i < users.length; i += IMPORT_USERS_PER_REQUEST) {
		out.push({ users: users.slice(i, i + IMPORT_USERS_PER_REQUEST) });
	}
	return out;
}

// ---- 香典帳 -----------------------------------------------------------------------

/** 「故 山田 一郎 様」→「山田 一郎」。形が違えば香典帳の名前をそのまま使う（05 §3: 初回表示時にオーナーへ確認を促す） */
export function guessDeceasedName(title: string): string {
	// 敬称まであるときだけ取り出す（「故人を偲ぶ会」のような名前から「人を偲ぶ会」を作らない）
	const m = /^故\s*(.+?)\s*(様|殿)$/.exec(title.trim());
	return (m?.[1] ?? title).trim() || title;
}

/** ロールの権限に編集を含めば編集者、なければ閲覧者（05 §3） */
const EDIT_PERMISSIONS = new Set(["edit", "entry.write", "write", "manage", "admin"]);

const ATTENDANCE: Record<string, Attendance> = {
	FUNERAL: "attended",
	CONDOLENCE_VISIT: "condolence_visit",
	ABSENT: "absent",
};

const OFFERING_KIND: Record<string, GiftKind> = {
	FLOWER: "kyoka",
	INCENSE: "kumotsu",
	FOOD: "kumotsu",
	MONEY: "other",
	OTHER: "other",
};

/** 品名がない供物に入れる名前（旧データの種類） */
const OFFERING_LABEL: Record<string, string> = {
	FLOWER: "供花",
	INCENSE: "線香",
	FOOD: "供物",
	MONEY: "御供料",
	OTHER: "その他",
};

const RETURN_STATUS: Record<string, ReturnStatus> = {
	PENDING: "pending",
	PARTIAL_RETURNED: "arranged",
	COMPLETED: "shipped",
	NOT_REQUIRED: "not_required",
};

/**
 * 旧アプリの返礼方法は自由入力（入力欄の例は「直接お渡し、郵送など」）。よくある言い方を新しい方法に写像する。
 * 当日返しの言い方を先に見る（「当日お渡し」は手渡しではなく当日返し）
 */
const RETURN_METHOD_PATTERNS: [RegExp, ReturnMethod][] = [
	[/^on_day$|当日/i, "on_day"],
	[/^hand_delivery$|手渡|直接|持参|お渡し|持って/i, "hand_delivery"],
	[/^shipping$|郵送|配送|宅配|発送|送付|郵便|ゆうパック|宅急便|mail|delivery/i, "shipping"],
];

export function returnMethodOf(value: string | null): ReturnMethod | null {
	const v = value?.trim();
	if (!v) return null;
	return RETURN_METHOD_PATTERNS.find(([pattern]) => pattern.test(v))?.[1] ?? null;
}

type Person = LedgerSnapshot["persons"][number];
type Gift = LedgerSnapshot["gifts"][number];
type Contributor = LedgerSnapshot["contributors"][number];

/**
 * 香典帳 1 冊分を変換する。knownUsers は移行するユーザーの旧 ID（メンバー・購入の参照先の確認に使う）
 */
export function transformKouden(
	source: LegacyKoudenSource,
	knownUsers: ReadonlySet<string>,
): KoudenTransform {
	const warnings: Warning[] = [];
	const warn = (code: string, legacyId: string, message: string) =>
		warnings.push({ code, legacyId, message });
	const k = source.kouden;
	const koudenId = newId.kouden(k.id);
	if (!knownUsers.has(k.owner_id)) {
		throw new Error(`kouden ${k.id}: owner ${k.owner_id} is not in auth.users`);
	}

	// ---- D1 ----
	const deceasedName = guessDeceasedName(k.title);
	warn(
		"deceased_name_guessed",
		k.id,
		`故人のお名前を香典帳の名前から「${deceasedName}」としました`,
	);
	// 新しい香典帳には説明の欄がない。作成時に書かれた説明は移さず、検証レポートで知らせる
	const koudenDescription = trimOrNull(k.description);
	if (koudenDescription !== null) {
		warn(
			"kouden_description_dropped",
			k.id,
			`香典帳の説明「${koudenDescription}」は移しませんでした（新しい画面に説明の欄がありません）`,
		);
	}
	let koudenStatus: "active" | "archived" = "active";
	if (k.status === "archived") koudenStatus = "archived";
	else if (k.status !== "active")
		warn("kouden_status", k.id, `状態「${k.status}」を active にしました`);

	const roles = new Map(source.roles.map((r) => [r.id, r]));
	const members: ImportKoudenPayload["members"] = [
		{ userId: newId.user(k.owner_id), role: "owner", joinedAt: iso(k.created_at), invitedBy: null },
	];
	for (const m of source.members.toSorted(byCreated)) {
		if (m.user_id === k.owner_id) continue;
		if (!knownUsers.has(m.user_id)) {
			warn("member_without_user", m.user_id, "ユーザーが存在しないメンバーを移しませんでした");
			continue;
		}
		const permissions = roles.get(m.role_id)?.permissions ?? [];
		const role: Role = permissions.some((p) => EDIT_PERMISSIONS.has(p)) ? "editor" : "viewer";
		const invitedBy =
			m.added_by && m.added_by !== m.user_id && knownUsers.has(m.added_by)
				? newId.user(m.added_by)
				: null;
		members.push({ userId: newId.user(m.user_id), role, joinedAt: iso(m.created_at), invitedBy });
	}

	const purchases: ImportKoudenPayload["purchases"] = source.purchases.map((p) => {
		let userId = p.user_id;
		if (!knownUsers.has(userId)) {
			warn(
				"purchase_without_user",
				p.id,
				"購入者のユーザーが存在しないため、オーナーの購入として移しました",
			);
			userId = k.owner_id;
		}
		return {
			id: newId.purchase(p.id),
			userId: newId.user(userId),
			amount: yen(p.amount_paid) ?? 0,
			stripeCheckoutSessionId: trimOrNull(p.stripe_session_id),
			createdAt: iso(p.purchased_at),
		};
	});

	// ---- 台帳 ----
	const eventId = newId.event(k.id);
	const audit = (
		row: { created_by: string; created_at: string; updated_at: string },
		updatedBy?: string | null,
	) => ({
		createdBy: newId.user(row.created_by),
		createdAt: iso(row.created_at),
		updatedBy: newId.user(updatedBy ?? row.created_by),
		updatedAt: iso(row.updated_at),
	});

	const relationships = source.relationships
		.toSorted((a, b) => byCreated(a, b) || a.name.localeCompare(b.name))
		.map((r, i) => ({
			id: newId.relationship(r.id),
			name: r.name.trim() || "（名前なし）",
			sortOrder: i + 1,
			isHidden: !r.is_enabled,
		}));
	// 新しい関係には説明の欄がない。旧画面で書かれた説明は移さず、検証レポートで知らせる
	for (const r of source.relationships) {
		const description = trimOrNull(r.description);
		if (description !== null) {
			warn(
				"relationship_description_dropped",
				r.id,
				`関係「${r.name}」の説明「${description}」は移しませんでした（新しい画面に説明の欄がありません）`,
			);
		}
	}
	const relationshipIds = new Set(source.relationships.map((r) => r.id));

	const persons: Person[] = [];
	const gifts: Gift[] = [];
	const contributors: Contributor[] = [];
	/** 旧の香典 1 件 → 差出人（1 件 = 1 人。自動での名寄せはしない） */
	const entryPerson = new Map<string, string>();

	const pushPerson = (
		id: string,
		legacyId: string,
		fields: {
			name: string | null;
			organization: string | null;
			position: string | null;
			relationshipId?: string | null;
			postalCode?: string | null;
			address?: string | null;
			phone?: string | null;
		},
		auditFields: ReturnType<typeof audit>,
	) => {
		let name = trimOrNull(fields.name);
		const organization = trimOrNull(fields.organization);
		let notes: string | null = null;
		if (name === null && organization === null) {
			name = MISSING_NAME;
			notes = MISSING_NAME_NOTE;
			warn("person_without_name", legacyId, "氏名・団体名がないため「（氏名未記入）」にしました");
		}
		persons.push({
			id,
			name,
			nameKana: null,
			organization,
			position: trimOrNull(fields.position),
			relationshipId: fields.relationshipId ?? null,
			postalCode: trimOrNull(fields.postalCode),
			address: trimOrNull(fields.address),
			phone: trimOrNull(fields.phone),
			notes,
			...auditFields,
		});
	};

	const giftBase = {
		eventId,
		amount: null,
		itemName: null,
		quantity: null,
		message: null,
		attendance: null,
		notes: null,
	};

	for (const e of source.entries.toSorted(byCreated)) {
		const personId = newId.entryPerson(e.id);
		const giftId = newId.entryGift(e.id);
		const a = audit(e, e.last_modified_by);
		let relationshipId: string | null = null;
		if (e.relationship_id !== null) {
			if (relationshipIds.has(e.relationship_id))
				relationshipId = newId.relationship(e.relationship_id);
			else
				warn("unknown_relationship", e.id, "存在しない関係を参照していたので、関係なしにしました");
		}
		pushPerson(
			personId,
			e.id,
			{
				name: e.name,
				organization: e.organization,
				position: e.position,
				relationshipId,
				postalCode: e.postal_code,
				address: e.address,
				phone: e.phone_number,
			},
			a,
		);
		entryPerson.set(e.id, personId);
		const attendance = ATTENDANCE[e.attendance_type] ?? null;
		if (attendance === null && e.attendance_type) {
			warn("unknown_attendance", e.id, `参列「${e.attendance_type}」を未選択にしました`);
		}
		if (e.amount < 0) warn("negative_amount", e.id, `金額 ${e.amount} を 0 にしました`);
		gifts.push({
			...giftBase,
			id: giftId,
			kind: "koden",
			amount: yen(e.amount) ?? 0,
			attendance,
			notes: trimOrNull(e.notes),
			...a,
		});
		contributors.push({ giftId, personId, isPrimary: true, shareAmount: null });
	}

	for (const o of source.offerings.toSorted(byCreated)) {
		const giftId = newId.offeringGift(o.id);
		const kind = OFFERING_KIND[o.type] ?? "other";
		if (!(o.type in OFFERING_KIND))
			warn("unknown_offering_type", o.id, `種類「${o.type}」をその他にしました`);
		const amount = yen(o.price);
		const gift: Gift = {
			...giftBase,
			id: giftId,
			kind,
			amount,
			itemName: trimOrNull(o.description) ?? OFFERING_LABEL[o.type] ?? "供物",
			quantity: Math.max(0, Math.round(o.quantity)),
			notes: trimOrNull(o.notes),
			...audit(o),
		};
		gifts.push(gift);
		/** 按分ごとの備考。連名の差出人には備考の欄がないので、供物の備考に「差出人: 備考」として足す */
		const allocationNotes: string[] = [];

		// 紐づく香典の差出人を供物の差出人にする（負担額は按分の記録、代表者は 1 人）
		const linked = new Map<string, Contributor>();
		const allocations = source.offeringAllocations
			.filter((x) => x.offering_id === o.id && x.kouden_entry_id !== null)
			.toSorted(byCreated);
		for (const x of allocations) {
			const personId = entryPerson.get(x.kouden_entry_id ?? "");
			if (!personId) {
				warn("allocation_without_entry", o.id, "存在しない香典への按分を移しませんでした");
				continue;
			}
			const contributionNotes = trimOrNull(x.contribution_notes);
			if (contributionNotes !== null) {
				const person = persons.find((p) => p.id === personId);
				const named = person?.name === MISSING_NAME ? null : (person?.name ?? null);
				const label = named ?? person?.organization ?? person?.name ?? "差出人";
				allocationNotes.push(`${label}: ${contributionNotes}`);
			}
			if (linked.has(personId)) continue;
			linked.set(personId, {
				giftId,
				personId,
				isPrimary: x.is_primary_contributor === true,
				shareAmount: yen(x.allocated_amount),
			});
		}
		for (const x of source.offeringEntries
			.filter((y) => y.offering_id === o.id)
			.toSorted(byCreated)) {
			const personId = entryPerson.get(x.kouden_entry_id);
			if (personId && !linked.has(personId)) {
				linked.set(personId, { giftId, personId, isPrimary: false, shareAmount: null });
			}
		}
		let list = [...linked.values()];
		if (list.length === 0) {
			const personId = newId.offeringPerson(o.id);
			pushPerson(
				personId,
				o.id,
				{ name: o.provider_name, organization: null, position: null },
				audit(o),
			);
			list = [{ giftId, personId, isPrimary: true, shareAmount: null }];
		}
		const primary = list.find((c) => c.isPrimary) ?? list[0];
		list = list.map((c) => ({ ...c, isPrimary: c === primary }));
		const shares = list.reduce((sum, c) => sum + (c.shareAmount ?? 0), 0);
		if (amount !== null && shares > amount) {
			warn(
				"shares_exceed_amount",
				o.id,
				`負担額の合計 ${shares} 円が金額 ${amount} 円を超えています`,
			);
		}
		contributors.push(...list);
		if (allocationNotes.length > 0) {
			gift.notes = [gift.notes, ...new Set(allocationNotes)].filter((n) => n !== null).join("\n");
		}
	}

	for (const t of source.telegrams.toSorted(byCreated)) {
		const giftId = newId.telegramGift(t.id);
		gifts.push({
			...giftBase,
			id: giftId,
			kind: "choden",
			message: trimOrNull(t.message),
			notes: trimOrNull(t.notes),
			...audit(t),
		});
		let personId = t.kouden_entry_id ? entryPerson.get(t.kouden_entry_id) : undefined;
		if (!personId) {
			if (t.kouden_entry_id)
				warn(
					"telegram_without_entry",
					t.id,
					"存在しない香典を参照していたので、差出人を新しく作りました",
				);
			personId = newId.telegramPerson(t.id);
			pushPerson(
				personId,
				t.id,
				{ name: t.sender_name, organization: t.sender_organization, position: t.sender_position },
				audit(t),
			);
		}
		contributors.push({ giftId, personId, isPrimary: true, shareAmount: null });
	}

	// ---- 香典返し ----
	const files: FileCopy[] = [];
	const items = source.returnItems.toSorted(
		(a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || byCreated(a, b),
	);
	const itemNames = new Map(items.map((i) => [i.id, i.name]));
	const returnItems: LedgerSnapshot["returnItems"] = items.map((i, index) => {
		let imageR2Key: string | null = null;
		const image = trimOrNull(i.image_url);
		if (image) {
			imageR2Key = `koudens/${koudenId}/return-items/${newId.returnItemImage(i.id)}`;
			files.push({ source: image, key: imageR2Key });
		}
		return {
			id: newId.returnItem(i.id),
			name: i.name.trim() || "（品名なし）",
			category: trimOrNull(i.category),
			price: yen(i.price) ?? 0,
			description: trimOrNull(i.description),
			imageR2Key,
			isActive: i.is_active !== false,
			sortOrder: index + 1,
			createdAt: iso(i.created_at),
			updatedAt: iso(i.updated_at),
		};
	});
	// 返礼品の推奨金額は、金額帯ルール（目安は半返し）の初期値にする（05 §3）
	const returnRules: LedgerSnapshot["returnRules"] = items
		.filter((i) => i.recommended_amount_min !== null)
		.toSorted((a, b) => (a.recommended_amount_min ?? 0) - (b.recommended_amount_min ?? 0))
		.map((i, index) => ({
			id: newId.returnRule(i.id),
			minAmount: yen(i.recommended_amount_min) ?? 0,
			maxAmount: yen(i.recommended_amount_max),
			ratioNumerator: 1,
			ratioDenominator: 2,
			suggestedItemId: i.is_active === false ? null : newId.returnItem(i.id),
			sortOrder: index + 1,
		}));

	const returns: LedgerSnapshot["returns"] = [];
	const returnLines: LedgerSnapshot["returnLines"] = [];
	for (const [entryId, sorted] of returnRecordsByEntry(source)) {
		const personId = entryPerson.get(entryId);
		if (!personId) {
			warn("return_without_entry", entryId, "存在しない香典の香典返しを移しませんでした");
			continue;
		}
		const first = sorted[0] as LegacyReturnRecord;
		const latest = sorted[sorted.length - 1] as LegacyReturnRecord;
		if (sorted.length > 1) {
			warn("returns_merged", entryId, `${sorted.length} 件の香典返しの記録を 1 件にまとめました`);
		}
		const status = returnStatusOf(latest);
		if (!(latest.return_status in RETURN_STATUS)) {
			warn("unknown_return_status", latest.id, `状況「${latest.return_status}」を未対応にしました`);
		}
		const returnId = newId.return(entryId);
		const remarks = [
			...new Set(sorted.map((r) => trimOrNull(r.remarks)).filter((r) => r !== null)),
		];
		// 写像できない返礼方法は捨てずに備考に残す
		const method = returnMethodOf(latest.return_method);
		const methodText = trimOrNull(latest.return_method);
		const notes = [...remarks];
		if (method === null && methodText !== null) {
			notes.push(`返礼方法（旧データ）: ${methodText}`);
			warn(
				"unknown_return_method",
				latest.id,
				`返礼方法「${methodText}」を未選択にし、備考に残しました`,
			);
		}
		const ret: LedgerSnapshot["returns"][number] = {
			id: returnId,
			personId,
			status,
			method,
			onDayAmount: yen(latest.funeral_gift_amount) ?? 0,
			arrangedAt: isoDate(latest.arrangement_date),
			// 旧データには発送日がない。発送済みなら最後に更新した日を発送日にする
			shippedAt: status === "shipped" ? isoDate(latest.updated_at) : null,
			shipName: null,
			shipPostalCode: trimOrNull(latest.shipping_postal_code),
			shipAddress: trimOrNull(latest.shipping_address),
			shipPhone: trimOrNull(latest.shipping_phone_number),
			notes: notes.length > 0 ? notes.join("\n") : null,
			createdBy: newId.user(first.created_by),
			createdAt: iso(first.created_at),
			updatedBy: newId.user(latest.created_by),
			updatedAt: iso(latest.updated_at),
		};
		returns.push(ret);
		// 明細は記録ごとに作る。旧画面が表示・編集するのは記録の return_items 列（一括更新などはこちらにだけ書く）
		// なので、列が配列ならそれを正とする（品をすべて消すと空の配列になる）。表（return_record_items）は古い
		// 書き込み口の名残で、列と食い違うことがある。列がない（null）か、品がすべて形の合わない記録だけ表の行から
		// 作り、それ以外で列にない表の行は移さずに警告する
		for (const record of sorted) {
			const rows = source.returnRecordItems.filter((l) => l.return_record_id === record.id);
			const embedded: EmbeddedItem[] = [];
			for (const item of embeddedItems(record.return_items)) {
				if (item === null) {
					warn(
						"invalid_embedded_item",
						record.id,
						"形の合わない返礼品（return_items 列）を移しませんでした",
					);
				} else {
					embedded.push(item);
				}
			}
			const fromColumn =
				Array.isArray(record.return_items) &&
				(record.return_items.length === 0 || embedded.length > 0);
			if (!fromColumn) {
				for (const l of rows) {
					const name = itemNames.get(l.return_item_master_id);
					if (name === undefined) {
						warn("line_without_item", l.id, "存在しない返礼品の明細を「（品名不明）」にしました");
					}
					returnLines.push({
						id: newId.returnLine(l.id),
						returnId,
						returnItemId: name === undefined ? null : newId.returnItem(l.return_item_master_id),
						name: name?.trim() || "（品名不明）",
						unitPrice: yen(l.price) ?? 0,
						quantity: Math.max(1, Math.round(l.quantity)),
					});
					// 明細には備考の欄がないので、香典返しの備考に残す（列の品と同じ扱い）
					const lineNotes = trimOrNull(l.notes);
					if (lineNotes !== null) notes.push(`${name?.trim() || "（品名不明）"}: ${lineNotes}`);
				}
				continue;
			}
			const inEmbedded = new Set<string>();
			embedded.forEach((item, index) => {
				const masterId = item.masterId ?? item.id;
				const name = item.name.trim() || "（品名不明）";
				const unitPrice = yen(item.price) ?? 0;
				if (masterId !== undefined) inEmbedded.add(`id:${masterId}`);
				inEmbedded.add(`name:${name}:${unitPrice}`);
				// 明細には備考の欄がないので、品ごとの備考は香典返しの備考に残す
				if (item.notes !== undefined) notes.push(`${name}: ${item.notes}`);
				returnLines.push({
					id: newId.embeddedReturnLine(record.id, index),
					returnId,
					returnItemId:
						masterId !== undefined && itemNames.has(masterId) ? newId.returnItem(masterId) : null,
					name,
					unitPrice,
					quantity: Math.max(1, Math.round(item.quantity)),
				});
			});
			for (const l of rows) {
				const name = itemNames.get(l.return_item_master_id)?.trim() || "（品名不明）";
				if (
					inEmbedded.has(`id:${l.return_item_master_id}`) ||
					inEmbedded.has(`name:${name}:${yen(l.price) ?? 0}`)
				) {
					continue;
				}
				warn(
					"stale_table_item",
					l.id,
					`旧画面に表示されていない返礼品の明細（${name}）を移しませんでした（return_items 列を正としました）`,
				);
			}
		}
		const allNotes = [...new Set(notes)];
		ret.notes = allNotes.length > 0 ? allNotes.join("\n") : null;
	}

	// 旧アプリの古い形式: 香典返しの記録がなく、香典に「返礼済み」の印（is_return_completed）だけがある。
	// 旧画面は記録がなければこの印で返礼済みと表示していたので、発送済みの香典返しとして作る
	const recorded = returnRecordsByEntry(source);
	for (const e of source.entries) {
		if (e.is_return_completed !== true || recorded.has(e.id)) continue;
		const personId = entryPerson.get(e.id) as string;
		returns.push({
			id: newId.return(e.id),
			personId,
			status: "shipped",
			method: null,
			onDayAmount: 0,
			arrangedAt: null,
			shippedAt: isoDate(e.updated_at),
			shipName: null,
			shipPostalCode: null,
			shipAddress: null,
			shipPhone: null,
			notes: COMPLETED_FLAG_NOTE,
			...audit(e, e.last_modified_by),
		});
	}

	const payload: ImportKoudenPayload = {
		koudenId,
		kouden: {
			legacyKoudenId: k.id,
			title: k.title.trim() || `故 ${deceasedName} 様`,
			deceasedName,
			ownerUserId: newId.user(k.owner_id),
			status: koudenStatus,
			createdAt: iso(k.created_at),
			updatedAt: iso(k.updated_at),
		},
		members,
		purchases,
		ledger: {
			// 旧データには行事がないので、すべて「葬儀」に入れる。受付番号は付けない（05 §3）
			events: [{ id: eventId, kind: "funeral", name: "葬儀", date: null, sortOrder: 1 }],
			relationships,
			persons,
			gifts,
			contributors,
			returnItems,
			returnRules,
			returns,
			returnLines,
		},
	};
	return { koudenId, payload, files, warnings };
}

/** 香典返しの記録を香典（= 差出人）ごとにまとめ、更新順に並べる。状況などは最後に更新した記録に従う */
function returnRecordsByEntry(source: LegacyKoudenSource): Map<string, LegacyReturnRecord[]> {
	const byEntry = new Map<string, LegacyReturnRecord[]>();
	for (const r of source.returnRecords) {
		byEntry.set(r.kouden_entry_id, [...(byEntry.get(r.kouden_entry_id) ?? []), r]);
	}
	for (const [entryId, records] of byEntry) {
		byEntry.set(
			entryId,
			records.toSorted(
				(a, b) => a.updated_at.localeCompare(b.updated_at) || a.id.localeCompare(b.id),
			),
		);
	}
	return byEntry;
}

const returnStatusOf = (record: LegacyReturnRecord): ReturnStatus =>
	RETURN_STATUS[record.return_status] ?? "pending";

/** 記録の return_items 列の 1 品（旧アプリの ReturnItem 型。一括更新は masterId・id も書く） */
interface EmbeddedItem {
	name: string;
	price: number;
	quantity: number;
	id?: string;
	masterId?: string;
	notes?: string;
}

const nonEmptyString = (x: unknown) => (typeof x === "string" && x !== "" ? x : undefined);

/** return_items 列の品。形の合わない要素は null */
function embeddedItems(value: unknown): (EmbeddedItem | null)[] {
	if (!Array.isArray(value)) return [];
	return value.map((v: unknown) => {
		if (v === null || typeof v !== "object") return null;
		const o = v as Record<string, unknown>;
		if (
			typeof o.name !== "string" ||
			typeof o.price !== "number" ||
			typeof o.quantity !== "number"
		) {
			return null;
		}
		return {
			name: o.name,
			price: o.price,
			quantity: o.quantity,
			id: nonEmptyString(o.id),
			masterId: nonEmptyString(o.masterId),
			notes: typeof o.notes === "string" ? nonEmptyString(o.notes.trim()) : undefined,
		};
	});
}

/** 香典返しの状況ごとの件数（差出人単位にまとめた後。変換と同じ規則） */
function legacyReturnStatuses(source: LegacyKoudenSource): Record<ReturnStatus, number> {
	const counts: Record<ReturnStatus, number> = {
		pending: 0,
		arranged: 0,
		shipped: 0,
		handed_on_day: 0,
		not_required: 0,
	};
	const entries = new Set(source.entries.map((e) => e.id));
	const recorded = returnRecordsByEntry(source);
	for (const [entryId, records] of recorded) {
		const latest = records[records.length - 1];
		if (entries.has(entryId) && latest) counts[returnStatusOf(latest)] += 1;
	}
	// 記録がなく「返礼済み」の印だけがある香典（変換と同じく発送済みとして数える）
	for (const e of source.entries) {
		if (e.is_return_completed === true && !recorded.has(e.id)) counts.shipped += 1;
	}
	return counts;
}

/** 検証用（05 §5）: 旧データの件数。取り込んだ後の件数（LedgerImportSummary）と比べる */
export function legacyCounts(source: LegacyKoudenSource, knownUsers: ReadonlySet<string>) {
	const kinds = { koden: 0, kumotsu: 0, kyoka: 0, choden: 0, other: 0 };
	kinds.koden = source.entries.length;
	for (const o of source.offerings) kinds[OFFERING_KIND[o.type] ?? "other"] += 1;
	kinds.choden = source.telegrams.length;
	return {
		gifts: kinds,
		kodenTotal: source.entries.reduce((sum, e: LegacyEntry) => sum + (yen(e.amount) ?? 0), 0),
		returnItems: source.returnItems.length,
		returns: legacyReturnStatuses(source),
		// 変換と同じく、存在しないユーザーのメンバーは数えない（オーナーは必ずいる）
		members: new Set([
			source.kouden.owner_id,
			...source.members.map((m) => m.user_id).filter((id) => knownUsers.has(id)),
		]).size,
	};
}
