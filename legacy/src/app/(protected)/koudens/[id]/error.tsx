"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function KoudenError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex h-full flex-col items-center justify-center space-y-4">
			<h2 className="text-2xl font-bold">エラーが発生しました</h2>
			<p className="text-muted-foreground">{error.message || "予期せぬエラーが発生しました。"}</p>
			<div className="flex gap-4">
				<Button onClick={reset} variant="outline" className="flex items-center gap-2">
					<RefreshCcw className="h-4 w-4" />
					<span>再試行</span>
				</Button>
				<Button variant="ghost" className="flex items-center gap-2" asChild>
					<Link href="/koudens">
						<ArrowLeft className="h-4 w-4" />
						<span>一覧に戻る</span>
					</Link>
				</Button>
			</div>
		</div>
	);
}
