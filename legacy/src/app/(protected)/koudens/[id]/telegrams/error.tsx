"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * 電報一覧のエラー表示コンポーネント
 * - エラーメッセージとリトライボタンを表示
 */
export default function TelegramsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// エラーをログに出力
		console.error(error);
	}, [error]);

	return (
		<Alert variant="destructive" className="mx-auto max-w-2xl">
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>電報一覧の取得に失敗しました</AlertTitle>
			<AlertDescription className="mt-2 flex flex-col gap-2">
				<p>{error.message}</p>
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
