import { cn } from "@/lib/utils";
import Container from "./container";
import type { ReactNode } from "react";

interface SectionProps {
	/** セクションの id 属性 */
	id?: string;
	/** 背景色や背景クラス名を上書き */
	bgClassName?: string;
	/** 追加のクラス名を受け取る */
	className?: string;
	/** コンテナの最大幅を上書きするクラス名 (例: 'max-w-4xl') */
	maxWidthClassName?: string;
	/** セクション内に描画するコンテンツ */
	children: ReactNode;
}

/**
 * セクション要素を統一的に扱うコンポーネント
 * デフォルトで `py-16 md:py-32` の上下余白を持ち、Container コンポーネントでラップします。
 */
export function Section({
	id,
	bgClassName = "",
	className = "",
	maxWidthClassName = "",
	children,
}: SectionProps) {
	return (
		<section id={id} className={cn("py-16 md:py-32", bgClassName, className)}>
			<Container maxWidthClassName={maxWidthClassName}>{children}</Container>
		</section>
	);
}
