"use client";

import Link from "next/link";
import { ChevronLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogNavigationProps {
	backHref?: string;
	backLabel?: string;
	showShareButton?: boolean;
}

/**
 * ブログ記事のナビゲーションコンポーネント
 * 戻るボタンやシェアボタンなどを提供
 */
export function BlogNavigation({
	backHref = "/blog",
	backLabel = "記事一覧に戻る",
	showShareButton = true,
}: BlogNavigationProps) {
	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: document.title,
					url: window.location.href,
				});
			} catch {
				// ユーザーがキャンセルした場合など、エラーを無視
				console.log("Share cancelled");
			}
		} else {
			// Web Share APIが利用できない場合はクリップボードにコピー
			try {
				await navigator.clipboard.writeText(window.location.href);
				// TODO: トースト通知を表示
				alert("URLをクリップボードにコピーしました");
			} catch (error) {
				console.error("Failed to copy URL:", error);
			}
		}
	};

	return (
		<div className="flex items-center justify-between mb-6">
			{/* 戻るボタン */}
			<Link
				href={backHref}
				className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
			>
				<ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
				{backLabel}
			</Link>

			{/* シェアボタン */}
			{showShareButton && (
				<Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
					<Share2 className="h-4 w-4" />
					シェア
				</Button>
			)}
		</div>
	);
}
