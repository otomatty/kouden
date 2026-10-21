import type { Role } from "./labels.ts";

/** 権限の判定（03 §5）。DO と画面（ボタンの出し分け）の両方で使う */
export type Action =
	/** 閲覧・印刷・Excel 出力 */
	| "ledger.read"
	/** いただきもの・差出人・香典返しの登録・編集・削除 */
	| "ledger.write"
	/** 行事・関係・カタログ・金額帯ルールの編集 */
	| "settings.write"
	/** メンバー招待・ロール変更・除外 */
	| "members.manage"
	/** 購入・譲渡・アーカイブ・削除・香典帳の名前の変更 */
	| "kouden.manage";

const ALLOWED: Record<Action, readonly Role[]> = {
	"ledger.read": ["owner", "editor", "viewer"],
	"ledger.write": ["owner", "editor"],
	"settings.write": ["owner", "editor"],
	"members.manage": ["owner"],
	"kouden.manage": ["owner"],
};

export function can(role: Role, action: Action): boolean {
	return ALLOWED[action].includes(role);
}
