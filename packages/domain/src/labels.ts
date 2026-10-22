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
	funeral: "葬儀・告別式",
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

/**
 * 香典帳の作成時に用意する行事（E2-1）。通夜と告別式の香典は「葬儀」にまとめる。
 * 分けたい人や、四十九日などの法要は設定で足す（08 §7.1）
 */
export const DEFAULT_EVENTS: readonly { kind: EventKind; name: string }[] = [
	{ kind: "funeral", name: "葬儀" },
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

/** 香典返しの対応状況（03 §3 returns.status, E6-4） */
export const RETURN_STATUSES = {
	pending: "未対応",
	arranged: "手配済み",
	shipped: "発送済み",
	handed_on_day: "当日返し済み",
	not_required: "不要",
} as const;
export type ReturnStatus = keyof typeof RETURN_STATUSES;
export const RETURN_STATUS_VALUES = Object.keys(RETURN_STATUSES) as [
	ReturnStatus,
	...ReturnStatus[],
];

/** 香典返しの渡し方（03 §3 returns.method） */
export const RETURN_METHODS = {
	on_day: "当日返し",
	shipping: "配送",
	hand_delivery: "手渡し",
} as const;
export type ReturnMethod = keyof typeof RETURN_METHODS;
export const RETURN_METHOD_VALUES = Object.keys(RETURN_METHODS) as [
	ReturnMethod,
	...ReturnMethod[],
];

/** 金額帯ルールで選べる返礼の目安率（E6-2） */
export const RETURN_RATIOS = {
	"1/2": "半返し（2 分の 1）",
	"1/3": "3 分の 1 返し",
	"1/4": "4 分の 1 返し",
} as const;
export type ReturnRatio = keyof typeof RETURN_RATIOS;
export const RETURN_RATIO_VALUES = Object.keys(RETURN_RATIOS) as [ReturnRatio, ...ReturnRatio[]];
