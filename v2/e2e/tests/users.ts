/**
 * E2E で使う利用者。scripts/prepare.ts が D1 に利用者とセッションを入れ、
 * テストはセッションの Cookie を付けてログイン済みとして操作する（Google のログインは通さない）。
 *
 * 書き込みの回数制限（ユーザーごと 120 回/分）を分け合わないよう、テストファイルごとに別の利用者を使う。
 */
export interface E2EUser {
	id: string;
	email: string;
	name: string;
	/** セッションの Cookie の値（D1 にはハッシュを保存する） */
	token: string;
}

const user = (key: string, name: string): E2EUser => ({
	id: `e2e-${key}`,
	email: `${key}@e2e.test`,
	name,
	token: `e2e-session-${key}-0123456789abcdef`,
});

export const USERS = {
	public: user("public", "公開 確認"),
	ledger: user("ledger", "山田 太郎"),
	liveOwner: user("live-owner", "佐藤 花子"),
	liveEditor: user("live-editor", "鈴木 次郎"),
	returns: user("returns", "高橋 三郎"),
	account: user("account", "田中 四郎"),
} as const;

/**
 * アカウントの削除のテストで使う利用者。削除すると元に戻せないので、CI の再試行（retries: 1）でも
 * 使えるよう、試行ごとに別の利用者を用意する（`test.info().retry` 番目を使う）
 */
export const LEAVING_USERS = [0, 1].map((n) => user(`leaving-${n}`, "退会 予定"));
