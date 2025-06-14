"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ReturnItemsErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * 返礼品管理ページのエラー表示
 */
export default function ReturnItemsError({ error, reset }: ReturnItemsErrorProps) {
	useEffect(() => {
		console.error("[ERROR] Return items page error:", error);
	}, [error]);

	return (
		<div className="container mx-auto py-6">
			<div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
				<AlertTriangle className="h-12 w-12 text-destructive" />
				<div className="text-center space-y-2">
					<h2 className="text-xl font-semibold">返礼品管理の読み込みに失敗しました</h2>
					<p className="text-muted-foreground">
						データの取得中にエラーが発生しました。再試行してください。
					</p>
				</div>
				<Button onClick={reset} variant="outline">
					再試行
				</Button>
			</div>
		</div>
	);
}
