"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * ローディング画面の共通シェル。
 * 固定オーバーレイ + 中央配置のカードを提供する。
 */
export function LoadingOverlay({ children, className }: LoadingOverlayProps) {
	return (
		<div
			className={cn(
				"fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
				className,
			)}
		>
			<Card className="w-[90vw] max-w-[600px]">
				<CardContent className="p-6">{children}</CardContent>
			</Card>
		</div>
	);
}
