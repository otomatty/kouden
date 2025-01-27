// 香典帳の権限を管理するatom
// Jotaiを使用した権限管理は表示制御に使用する(クライアントサイド限定)
// CRUD操作の権限管理はServer Actionsなどサーバーサイドで行う

import { atom } from "jotai";
import type { KoudenPermission } from "@/types/role";

// 初期値は最も制限の強い'viewer'に設定
export const permissionAtom = atom<KoudenPermission>("viewer");
// ----------------
// UI表示権限(香典帳本体)
// ----------------
// 作成は誰でもできるのでここでは管理しない
// 香典帳の更新
export const canUpdateKouden = (permission: KoudenPermission) =>
	permission === "owner" || permission === "editor";
// 香典帳の削除
export const canDeleteKouden = (permission: KoudenPermission) =>
	permission === "owner";

// ----------------
// UI表示権限(香典情報、お供え物、弔電、返礼品)
// ----------------
// 香典情報の作成
export const canCreateEntry = (permission: KoudenPermission) =>
	permission === "owner" || permission === "editor";
// 香典情報の更新
export const canUpdateEntry = (permission: KoudenPermission) =>
	permission === "owner" || permission === "editor";
// 香典情報の削除
export const canDeleteEntry = (permission: KoudenPermission) =>
	permission === "owner" || permission === "editor";
// ----------------

// ----------------
// UI表示権限(メンバー)
// ----------------
// メンバーの作成
// メンバーは招待することで作成されるので招待の権限を使用する
// メンバーの更新
export const canUpdateMember = (permission: KoudenPermission) =>
	permission === "owner";
// メンバーの削除
export const canDeleteMember = (permission: KoudenPermission) =>
	permission === "owner";
// ----------------

// ----------------
// UI表示権限(招待)
// ----------------
// 招待の作成
export const canCreateInvitation = (permission: KoudenPermission) =>
	permission === "owner" || permission === "editor";
// 招待の更新
export const canUpdateInvitation = (permission: KoudenPermission) =>
	permission === "owner" || permission === "editor";
// 招待の削除
export const canDeleteInvitation = (permission: KoudenPermission) =>
	permission === "owner" || permission === "editor";
// ----------------

// 以下表示権限のテンプレート
// ----------------
// 表示権限()
// ----------------
// の作成
// export const canCreate = (permission: KoudenPermission) =>
// 	permission === "owner" || permission === "editor";
// の更新
// export const canUpdate= (permission: KoudenPermission) =>
// 	permission === "owner" || permission === "editor";
// の削除
// export const canDelete = (permission: KoudenPermission) =>
// 	permission === "owner" || permission === "editor";
// ----------------
