import type { Database } from "@/types/supabase";

// Supabaseから取得するプラン型
export type Plan = Database["public"]["Tables"]["plans"]["Row"];

// プラン選択のモード
export type PlanSelectorMode = "create" | "upgrade";

// プラン選択の基本Props
export interface PlanSelectorProps {
	/** 選択可能なプラン一覧 */
	plans: Plan[];
	/** 現在選択されているプランコード */
	selectedPlan?: string;
	/** 予想件数（premium_full_supportプラン用） */
	expectedCount?: number;
	/** 現在のプラン（アップグレード時のみ） */
	currentPlan?: Plan;
	/** プラン選択のモード */
	mode: PlanSelectorMode;
	/** プラン変更時のコールバック */
	onPlanChange: (planCode: string) => void;
	/** 予想件数変更時のコールバック */
	onExpectedCountChange: (count: number) => void;
	/** ローディング状態 */
	loading?: boolean;
	/** 無効化状態 */
	disabled?: boolean;
	/** 追加のクラス名 */
	className?: string;
}

// プラン選択のフォームデータ
export interface PlanSelectorFormData {
	planCode: string;
	expectedCount?: number;
}

// プラン表示用の計算済みデータ
export interface PlanDisplayData extends Plan {
	/** 表示用の価格（予想件数を考慮した計算済み価格） */
	displayPrice: number;
	/** 現在のプランかどうか */
	isCurrent: boolean;
	/** アップグレード可能かどうか */
	isUpgradable: boolean;
	/** 選択可能かどうか */
	isSelectable: boolean;
}

// プラン選択hook用の戻り値
export interface UsePlanSelectionReturn {
	/** 選択されたプラン */
	selectedPlan?: Plan;
	/** 予想件数 */
	expectedCount: number;
	/** 表示用プランデータ */
	planDisplayData: PlanDisplayData[];
	/** プラン変更ハンドラ */
	handlePlanChange: (planCode: string) => void;
	/** 予想件数変更ハンドラ */
	handleExpectedCountChange: (count: number) => void;
	/** バリデーションエラー */
	validationErrors: Record<string, string>;
	/** フォームの有効性 */
	isValid: boolean;
}
