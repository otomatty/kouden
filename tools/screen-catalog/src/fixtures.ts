import {
	type GiftKind,
	type Role,
	type ReturnStatus,
	personLabel,
	suggestReturn,
} from "@kouden/domain";
import type { SessionUser } from "../../../apps/app/src/auth/session-store.ts";
import type { Invitation, Member, Transfer } from "../../../apps/app/src/kouden/members.ts";
import type { KoudenContext, KoudenListItem } from "../../../apps/app/src/kouden/store.ts";
import type {
	Caller,
	ContributorView,
	GiftView,
	History,
	LedgerEvent,
	LedgerRelationship,
	OutputData,
	Overview,
	PersonDetail,
	PersonView,
	ReturnDetail,
	ReturnItemView,
	ReturnRuleView,
	ReturnsBoard,
	ReturnView,
} from "../../../apps/app/src/ledger/types.ts";
import type { ProposalRow } from "../../../apps/app/src/views/kouden/returns.tsx";

/**
 * 画面カタログのサンプルデータ。実在の人物・住所ではない。
 * 日付は 2026-10 の葬儀（通夜 10/9・告別式 10/10）を想定し、表示時刻は NOW に固定する。
 */

export const NOW = new Date("2026-10-22T10:30:00+09:00");

const at = (ymdHm: string) => new Date(`${ymdHm}:00+09:00`).toISOString();

// ---- 利用者 -------------------------------------------------------------------

export const owner: SessionUser = {
	id: "u-owner",
	email: "hanako.yamada@example.com",
	displayName: "山田 花子",
	avatarUrl: null,
};

export const editorUser: SessionUser = {
	id: "u-editor",
	email: "jiro.yamada@example.com",
	displayName: "山田 次郎",
	avatarUrl: null,
};

export const viewerUser: SessionUser = {
	id: "u-viewer",
	email: "sato.misaki@example.com",
	displayName: "佐藤 美咲",
	avatarUrl: null,
};

const userOf: Record<Role, SessionUser> = {
	owner,
	editor: editorUser,
	viewer: viewerUser,
};

export const sessionUserFor = (role: Role) => userOf[role];

// ---- 香典帳 -------------------------------------------------------------------

export const KOUDEN_ID = "demo";
export const base = `/k/${KOUDEN_ID}`;

export const kouden: KoudenContext = {
	id: KOUDEN_ID,
	title: "故 山田 太郎 様",
	deceasedName: "山田 太郎",
	needsDeceasedNameConfirmation: false,
	ownerUserId: owner.id,
	plan: "free",
	status: "active",
	memberRole: "owner",
};

export function koudenAs(overrides: Partial<KoudenContext> = {}): KoudenContext {
	return { ...kouden, ...overrides };
}

export function callerFor(k: KoudenContext): Caller {
	const user = userOf[k.memberRole];
	// アーカイブ中は全員が閲覧者として扱われる（kouden-access ミドルウェア）
	return {
		koudenId: k.id,
		userId: user.id,
		displayName: user.displayName,
		role: k.status === "archived" ? "viewer" : k.memberRole,
		plan: k.plan,
	};
}

export const dashboardKoudens: KoudenListItem[] = [
	{
		id: KOUDEN_ID,
		title: kouden.title,
		deceasedName: kouden.deceasedName,
		plan: "free",
		role: "owner",
		giftCount: 14,
		totalAmount: 205_000,
		lastActivityAt: at("2026-10-21T19:42"),
	},
	{
		id: "k-suzuki",
		title: "鈴木家 告別式",
		deceasedName: "鈴木 一郎",
		plan: "paid",
		role: "editor",
		giftCount: 128,
		totalAmount: 1_830_000,
		lastActivityAt: at("2026-10-15T16:05"),
	},
	{
		id: "k-tanaka",
		title: "故 田中 ハル 様",
		deceasedName: "田中 ハル",
		plan: "free",
		role: "viewer",
		giftCount: 37,
		totalAmount: 412_000,
		lastActivityAt: at("2026-09-30T11:20"),
	},
];

export const archivedKoudens: KoudenListItem[] = [
	{
		id: "k-old",
		title: "故 山田 キヨ 様（七回忌）",
		deceasedName: "山田 キヨ",
		plan: "paid",
		role: "owner",
		giftCount: 52,
		totalAmount: 640_000,
		lastActivityAt: at("2025-06-02T09:10"),
	},
];

// ---- 行事・関係 ---------------------------------------------------------------

export const events: LedgerEvent[] = [
	{
		id: "ev-wake",
		kind: "wake",
		name: "通夜",
		date: "2026-10-09",
		sortOrder: 1,
		version: 1,
		giftCount: 6,
	},
	{
		id: "ev-funeral",
		kind: "funeral",
		name: "告別式",
		date: "2026-10-10",
		sortOrder: 2,
		version: 1,
		giftCount: 8,
	},
	{
		id: "ev-49",
		kind: "memorial_49",
		name: "四十九日",
		date: "2026-11-27",
		sortOrder: 3,
		version: 2,
		giftCount: 0,
	},
];

export const relationships: LedgerRelationship[] = [
	{ id: "rel-family", name: "親族", sortOrder: 1, isHidden: false, version: 1, personCount: 4 },
	{ id: "rel-friend", name: "友人", sortOrder: 2, isHidden: false, version: 1, personCount: 3 },
	{ id: "rel-work", name: "会社関係", sortOrder: 3, isHidden: false, version: 1, personCount: 3 },
	{ id: "rel-near", name: "近所", sortOrder: 4, isHidden: false, version: 1, personCount: 2 },
	{ id: "rel-other", name: "その他", sortOrder: 5, isHidden: false, version: 1, personCount: 0 },
	{ id: "rel-town", name: "町内会", sortOrder: 6, isHidden: true, version: 3, personCount: 0 },
];

const relName = (id: string | null) => relationships.find((r) => r.id === id)?.name ?? null;

// ---- 差出人 -------------------------------------------------------------------

type PersonSeed = Omit<PersonView, "version" | "giftCount" | "kodenTotal" | "relationshipName"> & {
	relationshipId: string | null;
};

const personSeeds: PersonSeed[] = [
	{
		id: "p-ichiro",
		name: "山田 一郎",
		nameKana: "やまだ いちろう",
		organization: null,
		position: null,
		relationshipId: "rel-family",
		postalCode: "166-0001",
		address: "東京都杉並区阿佐谷北1-2-3",
		phone: "03-1234-5678",
		notes: "故人の弟",
	},
	{
		id: "p-kazuko",
		name: "山田 和子",
		nameKana: "やまだ かずこ",
		organization: null,
		position: null,
		relationshipId: "rel-family",
		postalCode: "166-0001",
		address: "東京都杉並区阿佐谷北1-2-3",
		phone: null,
		notes: null,
	},
	{
		id: "p-takahashi",
		name: "高橋 健一",
		nameKana: "たかはし けんいち",
		organization: null,
		position: null,
		relationshipId: "rel-friend",
		postalCode: "180-0004",
		address: "東京都武蔵野市吉祥寺本町2-4-6 グリーンハイツ203",
		phone: "090-1111-2222",
		notes: null,
	},
	{
		id: "p-ito",
		name: "伊藤 さくら",
		nameKana: "いとう さくら",
		organization: null,
		position: null,
		relationshipId: "rel-friend",
		postalCode: null,
		address: null,
		phone: null,
		notes: null,
	},
	{
		id: "p-watanabe",
		name: "渡辺 誠",
		nameKana: "わたなべ まこと",
		organization: "株式会社みどり商事",
		position: "代表取締役",
		relationshipId: "rel-work",
		postalCode: "100-0005",
		address: "東京都千代田区丸の内3-1-1",
		phone: "03-9876-5432",
		notes: null,
	},
	{
		id: "p-midori",
		name: null,
		nameKana: null,
		organization: "株式会社みどり商事 営業部一同",
		position: null,
		relationshipId: "rel-work",
		postalCode: "100-0005",
		address: "東京都千代田区丸の内3-1-1",
		phone: null,
		notes: null,
	},
	{
		id: "p-kobayashi",
		name: "小林 直樹",
		nameKana: "こばやし なおき",
		organization: "株式会社みどり商事",
		position: "営業部長",
		relationshipId: "rel-work",
		postalCode: "113-0033",
		address: "東京都文京区本郷4-5-6",
		phone: null,
		notes: null,
	},
	{
		id: "p-nakamura",
		name: "中村 洋子",
		nameKana: "なかむら ようこ",
		organization: null,
		position: null,
		relationshipId: "rel-near",
		postalCode: "166-0002",
		address: "東京都杉並区高円寺北3-7-8",
		phone: null,
		notes: "町内会の班長",
	},
	{
		id: "p-kato",
		name: "加藤 修",
		nameKana: "かとう おさむ",
		organization: null,
		position: null,
		relationshipId: "rel-near",
		postalCode: "166-0002",
		address: "東京都杉並区高円寺北3-9-1",
		phone: null,
		notes: null,
	},
	{
		id: "p-yoshida",
		name: "吉田 美穂",
		nameKana: "よしだ みほ",
		organization: null,
		position: null,
		relationshipId: "rel-family",
		postalCode: "231-0023",
		address: "神奈川県横浜市中区山下町10-2",
		phone: "045-000-1234",
		notes: "姪",
	},
	{
		id: "p-yamamoto",
		name: "山本 隆",
		nameKana: "やまもと たかし",
		organization: null,
		position: null,
		relationshipId: "rel-friend",
		postalCode: "460-0008",
		address: "愛知県名古屋市中区栄2-3-4",
		phone: null,
		notes: null,
	},
	{
		id: "p-hayashi",
		name: "林 恵子",
		nameKana: "はやし けいこ",
		organization: null,
		position: null,
		relationshipId: "rel-family",
		postalCode: null,
		address: null,
		phone: null,
		notes: null,
	},
];

// ---- いただきもの -------------------------------------------------------------

interface GiftSeed {
	id: string;
	eventId: string;
	receiptNo: number | null;
	kind: GiftKind;
	amount: number | null;
	itemName?: string;
	quantity?: number;
	message?: string;
	attendance?: GiftView["attendance"];
	notes?: string;
	/** 先頭が代表者。shareAmount を省くと均等割り */
	contributors: { personId: string; shareAmount?: number }[];
	createdAt: string;
}

const giftSeeds: GiftSeed[] = [
	{
		id: "g-01",
		eventId: "ev-wake",
		receiptNo: 1,
		kind: "koden",
		amount: 30_000,
		attendance: "attended",
		contributors: [{ personId: "p-ichiro" }, { personId: "p-kazuko" }],
		createdAt: "2026-10-09T17:32",
	},
	{
		id: "g-02",
		eventId: "ev-wake",
		receiptNo: 2,
		kind: "koden",
		amount: 10_000,
		attendance: "attended",
		contributors: [{ personId: "p-takahashi" }],
		createdAt: "2026-10-09T17:40",
	},
	{
		id: "g-03",
		eventId: "ev-wake",
		receiptNo: 3,
		kind: "koden",
		amount: 5_000,
		attendance: "attended",
		contributors: [{ personId: "p-ito" }],
		createdAt: "2026-10-09T17:44",
	},
	{
		id: "g-04",
		eventId: "ev-wake",
		receiptNo: 4,
		kind: "koden",
		amount: 5_000,
		attendance: "condolence_visit",
		contributors: [{ personId: "p-nakamura" }],
		createdAt: "2026-10-09T18:02",
	},
	{
		id: "g-05",
		eventId: "ev-wake",
		receiptNo: 5,
		kind: "kyoka",
		amount: 15_000,
		itemName: "供花（白菊）",
		quantity: 1,
		contributors: [{ personId: "p-midori" }],
		createdAt: "2026-10-09T15:10",
	},
	{
		id: "g-06",
		eventId: "ev-wake",
		receiptNo: 6,
		kind: "koden",
		amount: 3_000,
		attendance: "attended",
		contributors: [{ personId: "p-kato" }],
		createdAt: "2026-10-09T18:15",
	},
	{
		id: "g-07",
		eventId: "ev-funeral",
		receiptNo: 1,
		kind: "koden",
		amount: 50_000,
		attendance: "attended",
		notes: "会社として",
		contributors: [{ personId: "p-watanabe" }],
		createdAt: "2026-10-10T10:05",
	},
	{
		id: "g-08",
		eventId: "ev-funeral",
		receiptNo: 2,
		kind: "koden",
		amount: 30_000,
		attendance: "attended",
		contributors: [
			{ personId: "p-midori", shareAmount: 20_000 },
			{ personId: "p-kobayashi", shareAmount: 10_000 },
		],
		createdAt: "2026-10-10T10:12",
	},
	{
		id: "g-09",
		eventId: "ev-funeral",
		receiptNo: 3,
		kind: "koden",
		amount: 10_000,
		attendance: "attended",
		contributors: [{ personId: "p-yoshida" }],
		createdAt: "2026-10-10T10:20",
	},
	{
		id: "g-10",
		eventId: "ev-funeral",
		receiptNo: 4,
		kind: "koden",
		amount: 10_000,
		attendance: "absent",
		notes: "現金書留で到着",
		contributors: [{ personId: "p-yamamoto" }],
		createdAt: "2026-10-10T11:48",
	},
	{
		id: "g-11",
		eventId: "ev-funeral",
		receiptNo: 5,
		kind: "choden",
		amount: null,
		message:
			"ご尊父様のご逝去を悼み、謹んでお悔やみ申し上げます。\n安らかにご永眠されますようお祈り申し上げます。",
		contributors: [{ personId: "p-yamamoto" }],
		createdAt: "2026-10-10T09:30",
	},
	{
		id: "g-12",
		eventId: "ev-funeral",
		receiptNo: 6,
		kind: "kumotsu",
		amount: null,
		itemName: "果物かご",
		quantity: 1,
		contributors: [{ personId: "p-hayashi" }],
		createdAt: "2026-10-10T09:50",
	},
	{
		id: "g-13",
		eventId: "ev-funeral",
		receiptNo: 7,
		kind: "koden",
		amount: 20_000,
		attendance: "attended",
		contributors: [{ personId: "p-hayashi" }],
		createdAt: "2026-10-10T10:40",
	},
	{
		id: "g-14",
		eventId: "ev-funeral",
		receiptNo: 8,
		kind: "koden",
		amount: 5_000,
		attendance: "attended",
		contributors: [{ personId: "p-nakamura" }],
		createdAt: "2026-10-10T10:55",
	},
];

/** 連名の按分（負担額のない人は残りを均等に割る）。05 §6 の簡略版 */
function shares(g: GiftSeed): Map<string, number> {
	const result = new Map<string, number>();
	if (g.kind !== "koden" || g.amount === null) return result;
	const fixed = g.contributors.reduce((s, c) => s + (c.shareAmount ?? 0), 0);
	const rest = g.contributors.filter((c) => c.shareAmount === undefined);
	for (const c of g.contributors) {
		result.set(
			c.personId,
			c.shareAmount ?? Math.floor((g.amount - fixed) / Math.max(1, rest.length)),
		);
	}
	return result;
}

export const persons: PersonView[] = personSeeds.map((p) => {
	const mine = giftSeeds.filter((g) => g.contributors.some((c) => c.personId === p.id));
	return {
		...p,
		relationshipName: relName(p.relationshipId),
		version: 1,
		giftCount: mine.length,
		kodenTotal: mine.reduce((s, g) => s + (shares(g).get(p.id) ?? 0), 0),
	};
});

export const personById = (id: string): PersonView => {
	const p = persons.find((x) => x.id === id);
	if (!p) throw new Error(`unknown person: ${id}`);
	return p;
};

function contributorView(personId: string, isPrimary: boolean, share?: number): ContributorView {
	const p = personById(personId);
	return {
		personId,
		name: p.name,
		nameKana: p.nameKana,
		organization: p.organization,
		relationshipName: p.relationshipName,
		isPrimary,
		shareAmount: share ?? null,
	};
}

export const gifts: GiftView[] = giftSeeds.map((g) => ({
	id: g.id,
	eventId: g.eventId,
	eventName: events.find((e) => e.id === g.eventId)?.name ?? "",
	receiptNo: g.receiptNo,
	kind: g.kind,
	amount: g.amount,
	itemName: g.itemName ?? null,
	quantity: g.quantity ?? null,
	message: g.message ?? null,
	attendance: g.attendance ?? null,
	notes: g.notes ?? null,
	version: 3,
	createdAt: at(g.createdAt),
	updatedAt: at(g.createdAt),
	contributors: g.contributors.map((c, i) => contributorView(c.personId, i === 0, c.shareAmount)),
}));

export const giftById = (id: string): GiftView => {
	const g = gifts.find((x) => x.id === id);
	if (!g) throw new Error(`unknown gift: ${id}`);
	return g;
};

/** 一覧の並び（行事の順 → 受付番号の順） */
export const giftsSorted = gifts.toSorted(
	(a, b) =>
		(events.find((e) => e.id === a.eventId)?.sortOrder ?? 0) -
			(events.find((e) => e.id === b.eventId)?.sortOrder ?? 0) ||
		(a.receiptNo ?? 0) - (b.receiptNo ?? 0),
);

/** 差出人の詳細 */
export function personDetail(id: string, ret: PersonDetail["ret"] = null): PersonDetail {
	return {
		...personById(id),
		gifts: gifts.filter((g) => g.contributors.some((c) => c.personId === id)),
		ret,
	};
}

// ---- トップの集計 -------------------------------------------------------------

export function overviewOf(list: GiftView[]): Overview {
	const koden = list.filter((g) => g.kind === "koden");
	const kodenTotal = koden.reduce((s, g) => s + (g.amount ?? 0), 0);
	const personIds = new Set(list.flatMap((g) => g.contributors.map((c) => c.personId)));
	const kinds = [...new Set(list.map((g) => g.kind))];
	return {
		totals: {
			giftCount: list.length,
			kodenCount: koden.length,
			kodenTotal,
			personCount: personIds.size,
		},
		byKind: kinds.map((kind) => {
			const of = list.filter((g) => g.kind === kind);
			return { kind, count: of.length, amount: of.reduce((s, g) => s + (g.amount ?? 0), 0) };
		}),
		byEvent: list.length
			? events.map((e) => {
					const of = list.filter((g) => g.eventId === e.id);
					return {
						eventId: e.id,
						name: e.name,
						date: e.date,
						count: of.length,
						kodenTotal: of
							.filter((g) => g.kind === "koden")
							.reduce((s, g) => s + (g.amount ?? 0), 0),
					};
				})
			: [],
		byRelationship: relationships
			.filter((r) => !r.isHidden)
			.map((r) => {
				const of = koden.filter(
					(g) => personById(g.contributors[0]!.personId).relationshipId === r.id,
				);
				return {
					relationshipId: r.id,
					name: r.name,
					count: of.length,
					kodenTotal: of.reduce((s, g) => s + (g.amount ?? 0), 0),
				};
			})
			.filter((r) => r.count > 0),
		recent: list.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
	};
}

// ---- 変更履歴 -----------------------------------------------------------------

export const giftHistory: History = {
	entries: [
		{
			seq: 41,
			at: at("2026-10-11T09:15"),
			actorName: "山田 花子",
			op: "update",
			diff: JSON.stringify({ amount: [20_000, 30_000], notes: [null, "後日、差額を確認"] }),
		},
		{
			seq: 12,
			at: at("2026-10-09T17:32"),
			actorName: "山田 次郎",
			op: "create",
			diff: JSON.stringify({
				event_id: [null, "ev-wake"],
				kind: [null, "koden"],
				amount: [null, 20_000],
				attendance: [null, "attended"],
				contributors: [null, ["p-ichiro", "p-kazuko"]],
			}),
		},
	],
	names: { "ev-wake": "通夜", "p-ichiro": "山田 一郎", "p-kazuko": "山田 和子" },
};

export const personHistory: History = {
	entries: [
		{
			seq: 52,
			at: at("2026-10-12T20:03"),
			actorName: "山田 花子",
			op: "update",
			diff: JSON.stringify({ phone: [null, "090-1111-2222"] }),
		},
		{
			seq: 14,
			at: at("2026-10-09T17:40"),
			actorName: "山田 次郎",
			op: "create",
			diff: JSON.stringify({ name: [null, "高橋 健一"], relationship_id: [null, "rel-friend"] }),
		},
	],
	names: { "rel-friend": "友人" },
};

// ---- 香典返し -----------------------------------------------------------------

export const returnItems: ReturnItemView[] = [
	{
		id: "item-towel",
		name: "今治タオルセット",
		category: "タオル",
		price: 3_000,
		description: "フェイスタオル 2 枚・ウォッシュタオル 1 枚",
		imageKey: null,
		isActive: true,
		sortOrder: 1,
		version: 1,
		usedCount: 3,
	},
	{
		id: "item-tea",
		name: "静岡茶と海苔の詰め合わせ",
		category: "食品",
		price: 5_000,
		description: null,
		imageKey: "koudens/demo/return-items/0199c9d2-0000-7000-8000-000000000001",
		isActive: true,
		sortOrder: 2,
		version: 2,
		usedCount: 2,
	},
	{
		id: "item-catalog",
		name: "カタログギフト（1 万円コース）",
		category: "カタログ",
		price: 10_000,
		description: "お相手に選んでいただける",
		imageKey: null,
		isActive: true,
		sortOrder: 3,
		version: 1,
		usedCount: 1,
	},
	{
		id: "item-sweets",
		name: "焼き菓子の詰め合わせ",
		category: "食品",
		price: 2_500,
		description: null,
		imageKey: null,
		isActive: false,
		sortOrder: 4,
		version: 1,
		usedCount: 0,
	},
];

export const returnRules: ReturnRuleView[] = [
	{
		id: "rule-1",
		minAmount: 0,
		maxAmount: 9_999,
		ratioNumerator: 1,
		ratioDenominator: 2,
		suggestedItemId: "item-towel",
		suggestedItemName: "今治タオルセット",
		version: 1,
	},
	{
		id: "rule-2",
		minAmount: 10_000,
		maxAmount: 29_999,
		ratioNumerator: 1,
		ratioDenominator: 2,
		suggestedItemId: "item-tea",
		suggestedItemName: "静岡茶と海苔の詰め合わせ",
		version: 1,
	},
	{
		id: "rule-3",
		minAmount: 30_000,
		maxAmount: null,
		ratioNumerator: 1,
		ratioDenominator: 3,
		suggestedItemId: "item-catalog",
		suggestedItemName: "カタログギフト（1 万円コース）",
		version: 1,
	},
];

const itemLine = (id: string, quantity = 1) => {
	const item = returnItems.find((i) => i.id === id)!;
	return { id: `line-${id}`, itemId: id, name: item.name, unitPrice: item.price, quantity };
};

function returnView(
	id: string,
	personId: string,
	status: ReturnStatus,
	extra: Partial<ReturnView> = {},
): ReturnView {
	const lines = extra.lines ?? [];
	return {
		id,
		personId,
		status,
		method: null,
		onDayAmount: 0,
		dueDate: null,
		arrangedAt: null,
		shippedAt: null,
		shipName: null,
		shipPostalCode: null,
		shipAddress: null,
		shipPhone: null,
		notes: null,
		version: 2,
		lines,
		linesTotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
		updatedAt: at("2026-10-18T14:20"),
		...extra,
	};
}

export const returns: ReturnView[] = [
	returnView("r-ichiro", "p-ichiro", "shipped", {
		method: "shipping",
		arrangedAt: "2026-10-15",
		shippedAt: "2026-10-17",
		lines: [itemLine("item-tea")],
	}),
	returnView("r-watanabe", "p-watanabe", "arranged", {
		method: "shipping",
		arrangedAt: "2026-10-18",
		shipName: "株式会社みどり商事 渡辺 誠 様",
		shipPostalCode: "100-0005",
		shipAddress: "東京都千代田区丸の内3-1-1",
		lines: [itemLine("item-catalog"), itemLine("item-towel")],
	}),
	returnView("r-takahashi", "p-takahashi", "pending", {
		method: "shipping",
		lines: [itemLine("item-tea")],
	}),
	returnView("r-ito", "p-ito", "handed_on_day", { method: "on_day", onDayAmount: 2_500 }),
	returnView("r-kato", "p-kato", "not_required", { notes: "辞退のお申し出あり" }),
];

const DUE_DATE = "2026-11-27";

export const returnsBoard: ReturnsBoard = {
	rows: persons
		.filter((p) => p.giftCount > 0)
		.map((p) => ({ person: p, ret: returns.find((r) => r.personId === p.id) ?? null })),
	items: returnItems,
	rules: returnRules,
	dueDate: DUE_DATE,
	dueEventName: "四十九日",
};

export function proposalsOf(board: ReturnsBoard, onDay = 0): ProposalRow[] {
	return board.rows
		.filter((row) => !row.ret && row.person.kodenTotal > 0)
		.map((row) => ({
			person: row.person,
			suggestion: suggestReturn({
				total: row.person.kodenTotal,
				onDayAmount: onDay,
				rules: board.rules,
				items: board.items,
			}),
		}));
}

export function returnDetail(id: string): ReturnDetail {
	const r = returns.find((x) => x.id === id);
	if (!r) throw new Error(`unknown return: ${id}`);
	return { ...r, person: personById(r.personId), koudenDueDate: DUE_DATE };
}

export const returnHistory: History = {
	entries: [
		{
			seq: 88,
			at: at("2026-10-18T14:20"),
			actorName: "山田 花子",
			op: "update",
			diff: JSON.stringify({ status: ["pending", "arranged"], arranged_at: [null, "2026-10-18"] }),
		},
		{
			seq: 80,
			at: at("2026-10-16T21:02"),
			actorName: "山田 花子",
			op: "update",
			diff: JSON.stringify({
				"line:line-item-catalog": [
					null,
					{ name: "カタログギフト（1 万円コース）", unitPrice: 10_000, quantity: 1 },
				],
			}),
		},
		{ seq: 79, at: at("2026-10-16T21:00"), actorName: "山田 花子", op: "create", diff: null },
	],
	names: {},
};

// ---- 印刷・出力 ---------------------------------------------------------------

export const outputData: OutputData = {
	events,
	gifts: giftsSorted,
	persons: persons.toSorted((a, b) => (a.nameKana ?? "ん").localeCompare(b.nameKana ?? "ん", "ja")),
	returns,
};

// ---- メンバー -----------------------------------------------------------------

export const members: Member[] = [
	{
		userId: owner.id,
		displayName: owner.displayName,
		email: owner.email,
		role: "owner",
		joinedAt: at("2026-10-08T21:00"),
		notifyReminders: true,
	},
	{
		userId: editorUser.id,
		displayName: editorUser.displayName,
		email: editorUser.email,
		role: "editor",
		joinedAt: at("2026-10-08T21:30"),
		notifyReminders: true,
	},
	{
		userId: "u-editor2",
		displayName: "山田 三郎",
		email: "saburo@example.com",
		role: "editor",
		joinedAt: at("2026-10-09T08:12"),
		notifyReminders: false,
	},
	{
		userId: viewerUser.id,
		displayName: viewerUser.displayName,
		email: viewerUser.email,
		role: "viewer",
		joinedAt: at("2026-10-12T19:45"),
		notifyReminders: false,
	},
];

export const invitations: Invitation[] = [
	{
		id: "inv-1",
		role: "editor",
		maxUses: 5,
		usedCount: 2,
		expiresAt: at("2026-10-29T21:00"),
		createdAt: at("2026-10-22T09:00"),
	},
	{
		id: "inv-2",
		role: "viewer",
		maxUses: null,
		usedCount: 0,
		expiresAt: at("2026-10-25T12:00"),
		createdAt: at("2026-10-18T12:00"),
	},
];

/** 譲渡の申し出（オーナー → 次郎） */
export const transfer: Transfer = {
	id: "tr-1",
	koudenId: KOUDEN_ID,
	koudenTitle: kouden.title,
	fromUserId: owner.id,
	fromName: owner.displayName,
	toUserId: editorUser.id,
	toName: editorUser.displayName,
	expiresAt: at("2026-10-29T10:30"),
};

/** 招待リンクの QR コードの代わり（実物は uqr で生成する） */
export const QR_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" shape-rendering="crispEdges"><rect width="29" height="29" fill="#fffffc"/><path fill="#1a1a1a" d="M2 2h7v7H2zM20 2h7v7h-7zM2 20h7v7H2z"/><path fill="#fffffc" d="M3 3h5v5H3zM21 3h5v5h-5zM3 21h5v5H3z"/><path fill="#1a1a1a" d="M4 4h3v3H4zM22 4h3v3h-3zM4 22h3v3H4zM11 2h1v2h-1zM13 3h2v1h-2zM11 6h3v1h-3zM15 8h1v3h-1zM11 11h3v2h-3zM17 11h2v2h-2zM20 11h1v1h-1zM23 11h3v1h-3zM2 11h2v1H2zM6 12h2v2H6zM13 15h3v1h-3zM18 15h1v4h-1zM11 17h2v2h-2zM20 17h3v1h-3zM24 19h2v2h-2zM14 20h1v3h-1zM11 23h2v1h-2zM16 24h3v2h-3zM21 22h1v4h-1zM24 25h2v1h-2z"/></svg>`,
)}`;

// ---- 運営者画面 ---------------------------------------------------------------

export const ADMIN_EMAIL = "ops@example.com";

/** 表示用の差出人の名前（印刷・一覧の確認用） */
export const labelOf = (id: string) => personLabel(personById(id));
