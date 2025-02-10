"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * 返礼品管理画面のエラー状態
 * - エラーメッセージを表示
 * - エラーをログに記録
 */
export default function ReturnRecordsError({
	error,
}: {
	error: Error & { digest?: string };
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="container mx-auto p-4">
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>エラーが発生しました</AlertTitle>
				<AlertDescription>
					返礼品管理画面の読み込み中にエラーが発生しました。時間をおいて再度お試しください。
				</AlertDescription>
			</Alert>
		</div>
	);
}
