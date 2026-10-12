/** いただきものの種別（03 §3 gifts.kind） */
export const GIFT_KINDS = {
	koden: "香典",
	kumotsu: "供物",
	kyoka: "供花",
	choden: "弔電",
	other: "その他",
} as const;
export type GiftKind = keyof typeof GIFT_KINDS;
export const GIFT_KIND_VALUES = Object.keys(GIFT_KINDS) as [GiftKind, ...GiftKind[]];

/** 行事の種類（03 §3 events.kind） */
export const EVENT_KINDS = {
	wake: "通夜",
	funeral: "告別式",
	memorial_49: "四十九日",
	memorial_1y: "一周忌",
	memorial_other: "その他の法要",
	other: "その他",
} as const;
export type EventKind = keyof typeof EVENT_KINDS;
export const EVENT_KIND_VALUES = Object.keys(EVENT_KINDS) as [EventKind, ...EventKind[]];

/** 参列の区分（03 §3 gifts.attendance） */
export const ATTENDANCES = {
	attended: "参列",
	condolence_visit: "弔問",
	absent: "欠席（郵送・代理）",
} as const;
export type Attendance = keyof typeof ATTENDANCES;
export const ATTENDANCE_VALUES = Object.keys(ATTENDANCES) as [Attendance, ...Attendance[]];

/** 香典帳の作成時に用意する行事（E2-1） */
export const DEFAULT_EVENTS: readonly { kind: EventKind; name: string }[] = [
	{ kind: "wake", name: EVENT_KINDS.wake },
	{ kind: "funeral", name: EVENT_KINDS.funeral },
];

/** 香典帳の作成時に用意する関係（E2-1）。名前の変更・追加・非表示はユーザーが行える */
export const DEFAULT_RELATIONSHIPS: readonly string[] = [
	"親族",
	"友人",
	"会社関係",
	"近所",
	"その他",
];

export type Role = "owner" | "editor" | "viewer";
export const ROLES: Record<Role, string> = {
	owner: "オーナー",
	editor: "編集者",
	viewer: "閲覧者",
};

export type Plan = "free" | "paid";
