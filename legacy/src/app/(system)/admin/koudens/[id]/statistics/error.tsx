"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

/**
 * 管理者用統計のエラー表示コンポーネント
 * - エラーメッセージとリトライボタンを表示
 */
export default function AdminStatisticsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// 詳細は診断用にログのみへ送る（UI へは内部情報を露出しない）
		console.error("[AdminStatisticsError]", error);
	}, [error]);

	return (
		<Alert variant="destructive" className="mx-auto max-w-2xl">
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>統計情報の取得に失敗しました</AlertTitle>
			<AlertDescription className="mt-2 flex flex-col gap-2">
				<p>統計情報の取得中に問題が発生しました。時間をおいて再試行してください。</p>
				<button
					type="button"
					onClick={reset}
					className="text-sm text-destructive underline hover:text-destructive/80"
				>
					もう一度試す
				</button>
			</AlertDescription>
		</Alert>
	);
}
