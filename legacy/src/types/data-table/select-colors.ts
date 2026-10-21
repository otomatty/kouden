/**
 * セレクトボックス用の色設定
 */
export interface SelectColorConfig {
	background: string;
	text: string;
	border: string;
	hoverBackground?: string;
	hoverText?: string;
}

/**
 * デフォルトのステータス色設定
 */
export const defaultStatusColors: Record<string, SelectColorConfig> = {
	// 成功・完了系
	success: {
		background: "hsl(142.1 76.2% 36.3%)", // green-600
		text: "hsl(0 0% 100%)", // white
		border: "hsl(142.1 76.2% 36.3%)",
		hoverBackground: "hsl(142.1 70.6% 45.3%)", // green-500
		hoverText: "hsl(0 0% 100%)",
	},
	// 警告・一部完了系
	warning: {
		background: "hsl(45.4 93.4% 47.5%)", // yellow-500
		text: "hsl(0 0% 0%)", // black
		border: "hsl(45.4 93.4% 47.5%)",
		hoverBackground: "hsl(47.9 95.8% 53.1%)", // yellow-400
		hoverText: "hsl(0 0% 0%)",
	},
	// エラー・削除・不要系
	error: {
		background: "hsl(0 84.2% 60.2%)", // red-500
		text: "hsl(0 0% 100%)", // white
		border: "hsl(0 84.2% 60.2%)",
		hoverBackground: "hsl(0 72.2% 50.6%)", // red-600
		hoverText: "hsl(0 0% 100%)",
	},
	// 未対応・保留系
	pending: {
		background: "hsl(210 40% 98%)", // slate-50
		text: "hsl(222.2 84% 4.9%)", // slate-900
		border: "hsl(214.3 31.8% 91.4%)", // slate-200
		hoverBackground: "hsl(210 40% 96%)", // slate-100
		hoverText: "hsl(222.2 84% 4.9%)",
	},
	// 情報・進行中系
	info: {
		background: "hsl(221.2 83.2% 53.3%)", // blue-500
		text: "hsl(0 0% 100%)", // white
		border: "hsl(221.2 83.2% 53.3%)",
		hoverBackground: "hsl(217.2 91.2% 59.8%)", // blue-400
		hoverText: "hsl(0 0% 100%)",
	},
	// セカンダリ・その他系
	secondary: {
		background: "hsl(210 40% 96%)", // slate-100
		text: "hsl(222.2 84% 4.9%)", // slate-900
		border: "hsl(214.3 31.8% 91.4%)", // slate-200
		hoverBackground: "hsl(210 40% 94%)", // slate-150 (custom)
		hoverText: "hsl(222.2 84% 4.9%)",
	},
};

/**
 * バリアント名からデフォルト色を取得
 */
export const getDefaultColorByVariant = (variant?: string): SelectColorConfig | undefined => {
	switch (variant) {
		case "default":
		case "completed":
			return defaultStatusColors.success;
		case "secondary":
		case "partial":
			return defaultStatusColors.warning;
		case "destructive":
		case "error":
		case "not_required":
			return defaultStatusColors.error;
		case "outline":
		case "pending":
			return defaultStatusColors.pending;
		case "info":
			return defaultStatusColors.info;
		default:
			return defaultStatusColors.secondary;
	}
};
