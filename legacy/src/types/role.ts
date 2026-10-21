// 定数定義
export const KOUDEN_ROLES = {
	EDITOR: "editor",
	VIEWER: "viewer",
} as const;

export const KOUDEN_ROLE_LABELS = {
	[KOUDEN_ROLES.EDITOR]: "編集者",
	[KOUDEN_ROLES.VIEWER]: "閲覧者",
} as const;

// インターフェースと型定義
export interface KoudenRole {
	id: string;
	name: string;
}

export type KoudenRoleType = (typeof KOUDEN_ROLES)[keyof typeof KOUDEN_ROLES];
export type KoudenPermission = "owner" | "editor" | "viewer";
