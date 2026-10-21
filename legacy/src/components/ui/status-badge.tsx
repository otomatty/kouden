import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 返礼ステータスの型定義
export type ReturnStatus = "PENDING" | "PARTIAL_RETURNED" | "COMPLETED" | "NOT_REQUIRED";

// ステータスのマッピング
export const returnStatusMap = {
	PENDING: "未対応",
	PARTIAL_RETURNED: "一部返礼",
	COMPLETED: "完了",
	NOT_REQUIRED: "返礼不要",
} as const;

// ステータスのバッジ色設定
export const returnStatusBadgeVariant = {
	PENDING: "outline",
	PARTIAL_RETURNED: "secondary",
	COMPLETED: "default",
	NOT_REQUIRED: "destructive",
} as const;

// カスタム色設定（CSS-in-JSスタイル）
export const returnStatusCustomColors: Record<ReturnStatus, React.CSSProperties> = {
	PENDING: {
		backgroundColor: "hsl(0 0% 0%)",
		color: "hsl(0 0% 100%)",
		borderColor: "hsl(0 0% 0%)",
	},
	PARTIAL_RETURNED: {
		backgroundColor: "hsl(45.4 93.4% 47.5%)",
		color: "hsl(0 0% 0%)",
		borderColor: "hsl(45.4 93.4% 47.5%)",
	},
	COMPLETED: {
		backgroundColor: "hsl(142.1 76.2% 36.3%)",
		color: "hsl(0 0% 100%)",
		borderColor: "hsl(142.1 76.2% 36.3%)",
	},
	NOT_REQUIRED: {
		backgroundColor: "hsl(217.2 91.2% 59.8%)",
		color: "hsl(0 0% 100%)",
		borderColor: "hsl(217.2 91.2% 59.8%)",
	},
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	status: ReturnStatus;
	useCustomColors?: boolean;
}

/**
 * 返礼ステータス表示用のバッジコンポーネント
 * @param status - 返礼ステータス
 * @param useCustomColors - カスタム色を使用するかどうか（デフォルト: false）
 * @param className - 追加のCSSクラス
 */
export function StatusBadge({
	status,
	useCustomColors = false,
	className,
	...props
}: StatusBadgeProps) {
	const variant = returnStatusBadgeVariant[status] || "outline";
	const displayText = returnStatusMap[status] || status;

	if (useCustomColors) {
		const customStyle = returnStatusCustomColors[status];
		return (
			<Badge
				variant={variant as "outline" | "secondary" | "default" | "destructive"}
				className={cn("font-medium", className)}
				style={customStyle}
				{...props}
			>
				{displayText}
			</Badge>
		);
	}

	return (
		<Badge
			variant={variant as "outline" | "secondary" | "default" | "destructive"}
			className={cn("font-medium", className)}
			{...props}
		>
			{displayText}
		</Badge>
	);
}

StatusBadge.displayName = "StatusBadge";
