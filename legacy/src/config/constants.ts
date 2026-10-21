/**
 * アプリケーション全体で利用する定数の一元管理。
 *
 * ハードコーディングされた値（価格・バリデーション上限・UIの調整値など）を
 * ここへ集約することで、変更を一箇所で完結できるようにする。
 * 命名規則は `SCREAMING_SNAKE_CASE` で統一する。
 */

/**
 * フルサポートプランの料金体系。
 *
 * 表示・料金シミュレーション（`/plans/full-support`）で共通して参照する。
 * 金額の単位は「円（税込）」。
 */
export const FULL_SUPPORT_PRICING = {
	/** プレミアムプランの月額料金 */
	PREMIUM_PLAN_PRICE: 7980,
	/** 基本サポート料金（100件まで）の下限 */
	BASE_SUPPORT_MIN: 7020,
	/** 基本サポート料金（100件まで）の上限 */
	BASE_SUPPORT_MAX: 17020,
	/** 追加サポート料金（50件ごと）の下限 */
	ADDITIONAL_BLOCK_PRICE_MIN: 3000,
	/** 追加サポート料金（50件ごと）の上限 */
	ADDITIONAL_BLOCK_PRICE_MAX: 5000,
	/** 基本サポートに含まれる件数 */
	BASE_SUPPORT_INCLUDED_COUNT: 100,
	/** 追加サポート料金の課金単位（件数） */
	ADDITIONAL_BLOCK_SIZE: 50,
} as const;

/**
 * 料金シミュレーションのスライダー設定。
 */
export const PRICING_SLIDER = {
	/** スライダーの最小値（件数） */
	MIN_VALUE: 0,
	/** スライダーの最大値（件数） */
	MAX_VALUE: 500,
} as const;

/**
 * 文字列バリデーションの最大文字数。
 *
 * 各スキーマ（`src/schemas/`）で共通して利用する上限値。
 */
export const TEXT_MAX_LENGTH = {
	/** 名前・組織名・役職などの短いテキスト */
	SHORT: 100,
	/** メッセージ・備考などの長いテキスト */
	LONG: 1000,
} as const;

/**
 * 金額入力の上限（円）。
 */
export const AMOUNT_MAX = 10_000_000;
