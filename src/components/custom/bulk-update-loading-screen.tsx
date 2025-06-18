"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Loader2, Database, CheckCircle2 } from "lucide-react";

interface BulkUpdateLoadingScreenProps {
	/** 表示するタイトル */
	title: string;
	/** 表示するTips */
	hints: { id: string; text: string }[];
	/** ローディング状態 */
	isLoading: boolean;
	/** 処理対象件数 */
	totalCount?: number;
	/** 追加のクラス名 */
	className?: string;
}

/**
 * 一括更新専用のローディング画面
 * - 実際の処理に合わせた不確定プログレスバー
 * - 返礼記録に特化したTips表示
 * - カルーセル形式でTipsを自動循環
 */
export function BulkUpdateLoadingScreen({
	title,
	hints,
	isLoading,
	totalCount,
	className,
}: BulkUpdateLoadingScreenProps) {
	const [currentHintIndex, setCurrentHintIndex] = useState(0);

	// Tipsの自動循環（3秒ごと）
	useEffect(() => {
		if (!isLoading || hints.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentHintIndex((prev) => (prev + 1) % hints.length);
		}, 3000);

		return () => clearInterval(interval);
	}, [isLoading, hints.length]);

	// ローディング状態でない場合は何も表示しない
	if (!isLoading) return null;

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
				className,
			)}
		>
			<Card className="w-[90vw] max-w-[600px]">
				<CardContent className="p-6">
					<div className="text-center space-y-6">
						{/* タイトルとアイコン */}
						<div className="space-y-3">
							<div className="flex items-center justify-center">
								<div className="relative">
									<Database className="h-12 w-12 text-primary" />
									<Loader2 className="h-6 w-6 text-primary animate-spin absolute -bottom-1 -right-1" />
								</div>
							</div>
							<h2 className="text-2xl font-bold">{title}</h2>
							{totalCount && (
								<p className="text-sm text-muted-foreground">
									{totalCount}件のデータを処理しています
								</p>
							)}
						</div>

						{/* 不確定プログレスバー */}
						<div className="space-y-2">
							<Progress className="h-2" />
							<p className="text-xs text-muted-foreground">処理中です。しばらくお待ちください...</p>
						</div>

						{/* Tips表示（カルーセル） */}
						{hints.length > 0 && (
							<div className="space-y-3">
								<div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
									<CheckCircle2 className="h-4 w-4" />
									アプリケーションTips
								</div>

								<Carousel className="w-full" opts={{ loop: true }}>
									<CarouselContent>
										{hints.map((hint) => (
											<CarouselItem key={hint.id}>
												<div className="p-4 text-center min-h-[80px] flex items-center justify-center">
													<p className="text-muted-foreground leading-relaxed">{hint.text}</p>
												</div>
											</CarouselItem>
										))}
									</CarouselContent>
									{hints.length > 1 && (
										<>
											<CarouselPrevious />
											<CarouselNext />
										</>
									)}
								</Carousel>

								{/* インジケーター */}
								{hints.length > 1 && (
									<div className="flex justify-center gap-2">
										{hints.map((hint, index) => (
											<div
												key={hint.id}
												className={cn(
													"h-2 w-2 rounded-full transition-colors",
													index === currentHintIndex % hints.length
														? "bg-primary"
														: "bg-muted-foreground/30",
												)}
											/>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
