import type {
	AuditLog,
	Dashboard,
	KoudenDetail,
	KoudenRow,
	LegacyRow,
	PurchaseRow,
	UserDetail,
	UserRow,
} from "../../../apps/admin/src/store.ts";

/** 運営者画面のサンプルデータ（実在のアカウントではない） */

const at = (ymdHm: string) => new Date(`${ymdHm}:00+09:00`).toISOString();

export const adminDashboard: Dashboard = {
	users: 1_284,
	koudens: { active: 903, archived: 241, paid: 312 },
	purchases: { paid: 318, refunded: 6, revenue: 1_590_000 },
	activity: { gifts: 48_211, returnPending: 1_932, activeLast30Days: 87 },
	months: [
		{ month: "2026-10", users: 64, koudens: 41, purchases: 17, revenue: 85_000 },
		{ month: "2026-09", users: 58, koudens: 39, purchases: 15, revenue: 75_000 },
		{ month: "2026-08", users: 71, koudens: 52, purchases: 22, revenue: 110_000 },
		{ month: "2026-07", users: 49, koudens: 33, purchases: 12, revenue: 60_000 },
		{ month: "2026-06", users: 45, koudens: 30, purchases: 11, revenue: 55_000 },
		{ month: "2026-05", users: 52, koudens: 36, purchases: 14, revenue: 70_000 },
	],
};

export const userRows: UserRow[] = [
	{
		id: "u-owner",
		email: "hanako.yamada@example.com",
		displayName: "山田 花子",
		createdAt: at("2026-10-08T20:55"),
		deletedAt: null,
		legacyUserId: null,
		googleLinked: true,
		koudenCount: 2,
	},
	{
		id: "u-legacy",
		email: "yamada.old@example.net",
		displayName: "山田 花子（旧）",
		createdAt: at("2026-10-20T03:10"),
		deletedAt: null,
		legacyUserId: "legacy-0042",
		googleLinked: false,
		koudenCount: 1,
	},
	{
		id: "u-gone",
		email: "deleted-u-gone@invalid",
		displayName: "退会したユーザー",
		createdAt: at("2026-03-02T12:00"),
		deletedAt: at("2026-08-30T08:00"),
		legacyUserId: null,
		googleLinked: false,
		koudenCount: 0,
	},
];

export const koudenRows: KoudenRow[] = [
	{
		id: "demo",
		title: "故 山田 太郎 様",
		ownerName: "山田 花子",
		ownerEmail: "hanako.yamada@example.com",
		plan: "free",
		status: "active",
		createdAt: at("2026-10-08T21:00"),
		giftCount: 14,
		lastActivityAt: at("2026-10-21T19:42"),
	},
	{
		id: "k-old",
		title: "故 山田 キヨ 様（七回忌）",
		ownerName: "山田 花子",
		ownerEmail: "hanako.yamada@example.com",
		plan: "paid",
		status: "archived",
		createdAt: at("2025-04-01T10:00"),
		giftCount: 52,
		lastActivityAt: at("2025-06-02T09:10"),
	},
];

export const purchaseRows: PurchaseRow[] = [
	{
		id: "pur-1",
		koudenId: "k-old",
		koudenTitle: "故 山田 キヨ 様（七回忌）",
		buyerName: "山田 花子",
		amount: 5_000,
		source: "stripe",
		status: "paid",
		stripeCheckoutSessionId: "cs_test_a1B2c3D4e5",
		createdAt: at("2025-04-02T09:30"),
		refundedAt: null,
	},
	{
		id: "pur-0",
		koudenId: "k-old",
		koudenTitle: "故 山田 キヨ 様（七回忌）",
		buyerName: "山田 花子",
		amount: 5_000,
		source: "stripe",
		status: "refunded",
		stripeCheckoutSessionId: "cs_test_z9Y8x7W6v5",
		createdAt: at("2025-04-01T22:10"),
		refundedAt: at("2025-04-02T09:00"),
	},
];

export const userDetailFixture: UserDetail = {
	...userRows[0]!,
	memberships: [
		{ koudenId: "demo", title: "故 山田 太郎 様", role: "owner", plan: "free", status: "active" },
		{
			koudenId: "k-old",
			title: "故 山田 キヨ 様（七回忌）",
			role: "owner",
			plan: "paid",
			status: "archived",
		},
	],
	purchases: purchaseRows,
	legacy: null,
};

export const legacyUserDetail: UserDetail = {
	...userRows[1]!,
	memberships: [
		{
			koudenId: "k-old",
			title: "故 山田 キヨ 様（七回忌）",
			role: "editor",
			plan: "paid",
			status: "archived",
		},
	],
	purchases: [],
	legacy: {
		email: "yamada.old@example.net",
		authProvider: "email",
		linkedAt: null,
		linkedBy: null,
	},
};

export const koudenDetailFixture: KoudenDetail = {
	...koudenRows[0]!,
	deceasedName: "山田 太郎",
	ownerId: "u-owner",
	personCount: 12,
	returnPending: 7,
	members: [
		{
			userId: "u-owner",
			displayName: "山田 花子",
			email: "hanako.yamada@example.com",
			role: "owner",
			joinedAt: at("2026-10-08T21:00"),
		},
		{
			userId: "u-editor",
			displayName: "山田 次郎",
			email: "jiro.yamada@example.com",
			role: "editor",
			joinedAt: at("2026-10-08T21:30"),
		},
		{
			userId: "u-viewer",
			displayName: "佐藤 美咲",
			email: "sato.misaki@example.com",
			role: "viewer",
			joinedAt: at("2026-10-12T19:45"),
		},
	],
	purchases: [],
};

export const paidKoudenDetail: KoudenDetail = {
	...koudenRows[1]!,
	deceasedName: "山田 キヨ",
	ownerId: "u-owner",
	personCount: 44,
	returnPending: 0,
	members: koudenDetailFixture.members.slice(0, 1),
	purchases: purchaseRows,
};

export const legacyRows: LegacyRow[] = [
	{
		legacyUserId: "legacy-0042",
		email: "yamada.old@example.net",
		displayName: "山田 花子",
		authProvider: "email",
		linkedUserId: null,
		linkedAt: null,
		linkedBy: null,
		userId: "u-legacy",
		koudenCount: 1,
	},
	{
		legacyUserId: "legacy-0107",
		email: "k.suzuki@example.org",
		displayName: "鈴木 一子",
		authProvider: "email",
		linkedUserId: null,
		linkedAt: null,
		linkedBy: null,
		userId: "u-legacy2",
		koudenCount: 3,
	},
	{
		legacyUserId: "legacy-0003",
		email: "tanaka@example.com",
		displayName: null,
		authProvider: "google",
		linkedUserId: "u-tanaka",
		linkedAt: at("2026-10-21T10:02"),
		linkedBy: "ops@example.com",
		userId: "u-tanaka",
		koudenCount: 2,
	},
];

export const auditLogRows: AuditLog[] = [
	{
		id: "al-3",
		adminEmail: "ops@example.com",
		action: "link_legacy_user",
		targetType: "user",
		targetId: "u-tanaka",
		detail: JSON.stringify({ legacyUserId: "legacy-0003" }),
		createdAt: at("2026-10-21T10:02"),
	},
	{
		id: "al-2",
		adminEmail: "ops@example.com",
		action: "revoke_purchase",
		targetType: "purchase",
		targetId: "pur-0",
		detail: JSON.stringify({ reason: "二重決済のため返金" }),
		createdAt: at("2025-04-02T09:00"),
	},
	{
		id: "al-1",
		adminEmail: "ops@example.com",
		action: "grant_paid",
		targetType: "kouden",
		targetId: "k-suzuki",
		detail: JSON.stringify({ reason: "障害の補償" }),
		createdAt: at("2025-03-15T15:30"),
	},
];
