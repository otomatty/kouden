import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ContainerProps {
	/** 子要素として描画するコンテンツ */
	children: ReactNode;
	/** 追加のクラス名を受け取る */
	className?: string;
	/** コンテナの最大幅を上書きするクラス名 (例: 'max-w-4xl') */
	maxWidthClassName?: string;
}

/**
 * ページ幅に合わせたコンテナレイアウトを提供するコンポーネント
 * デフォルトで `container mx-auto px-4 md:px-6` のクラスを適用します。
 */
export default function Container({
	children,
	className = "",
	maxWidthClassName = "",
}: ContainerProps) {
	return (
		<div
			className={cn(
				"container mx-auto max-w-7xl px-2 md:px-4 lg:px-6",
				maxWidthClassName,
				className,
			)}
		>
			{children}
		</div>
	);
}
