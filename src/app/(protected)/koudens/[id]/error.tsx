"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[ERROR] Error in kouden detail page:", error);
	}, [error]);

	return (
		<div className="container mx-auto py-8">
			<Alert variant="destructive" className="mb-4">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>エラーが発生しました</AlertTitle>
				<AlertDescription>{error.message}</AlertDescription>
			</Alert>

			<div className="flex gap-4">
				<Button onClick={() => reset()}>再試行</Button>
				<Button variant="outline" onClick={() => window.history.back()}>
					戻る
				</Button>
			</div>
		</div>
	);
}
