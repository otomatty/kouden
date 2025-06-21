"use client";

import { useState, useTransition, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleBookmark, isPostBookmarked } from "@/app/_actions/blog/bookmarks";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface BookmarkButtonProps {
	postId: string;
	initialBookmarked: boolean;
	className?: string;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg" | "icon";
	showText?: boolean;
}

/**
 * ブックマークボタンコンポーネント
 * 認証チェック、楽観的UI更新、適切なフィードバックを提供
 *
 * @param postId - 記事ID
 * @param initialBookmarked - 初期ブックマーク状態（未使用、実際は動的に取得）
 * @param className - 追加のCSSクラス
 * @param variant - ボタンのバリアント
 * @param size - ボタンのサイズ
 * @param showText - テキスト表示の有無
 */
export function BookmarkButton({
	postId,
	initialBookmarked,
	className = "",
	variant = "outline",
	size = "sm",
	showText = true,
}: BookmarkButtonProps) {
	const [bookmarked, setBookmarked] = useState(initialBookmarked);
	const [isPending, startTransition] = useTransition();
	const [loading, setLoading] = useState(true);
	const { user } = useAuth();

	// ユーザーがログインしている場合、実際のブックマーク状態を取得
	useEffect(() => {
		const fetchBookmarkStatus = async () => {
			if (!user) {
				setLoading(false);
				return;
			}

			try {
				const bookmarked = await isPostBookmarked(postId);
				setBookmarked(bookmarked);
			} catch (error) {
				console.error("Failed to fetch bookmark status:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchBookmarkStatus();
	}, [user, postId]);

	const handleToggle = () => {
		if (!user) {
			toast.error("ブックマークするにはログインが必要です", {
				description: "アカウントを作成またはログインしてください",
				action: {
					label: "ログイン",
					onClick: () => {
						// ログインページにリダイレクト
						window.location.href = "/auth/login";
					},
				},
			});
			return;
		}

		// 楽観的UI更新
		const previousBookmarked = bookmarked;
		setBookmarked(!bookmarked);

		startTransition(async () => {
			try {
				const result = await toggleBookmark(postId);

				if (result.success) {
					// サーバーからの結果で状態を更新
					setBookmarked(result.bookmarked ?? false);

					toast.success(
						result.bookmarked ? "ブックマークに追加しました" : "ブックマークから削除しました",
						{
							description: result.bookmarked
								? "プロフィールからいつでも確認できます"
								: "再度ボタンを押すと追加できます",
						},
					);
				} else {
					// エラー時は元の状態に戻す
					setBookmarked(previousBookmarked);
					toast.error("操作に失敗しました", {
						description: result.error || "しばらく時間をおいて再度お試しください",
					});
				}
			} catch (error) {
				// ネットワークエラー等の場合も元に戻す
				setBookmarked(previousBookmarked);
				toast.error("ネットワークエラーが発生しました", {
					description: "インターネット接続を確認して再度お試しください",
				});
				console.error("Bookmark toggle error:", error);
			}
		});
	};

	const buttonVariant = bookmarked && variant === "outline" ? "default" : variant;
	const icon = bookmarked ? BookmarkCheck : Bookmark;
	const IconComponent = icon;

	// ログインユーザーの場合はローディング状態を表示
	if (user && loading) {
		return (
			<Button
				variant={variant}
				size={size}
				disabled
				className={`transition-all duration-200 ${className}`}
			>
				<Bookmark className={`h-4 w-4 ${showText ? "mr-2" : ""} animate-pulse`} />
				{showText && <span>読み込み中...</span>}
			</Button>
		);
	}

	return (
		<Button
			variant={buttonVariant}
			size={size}
			onClick={handleToggle}
			disabled={isPending}
			className={`transition-all duration-200 ${className}`}
			aria-label={bookmarked ? "ブックマークから削除" : "ブックマークに追加"}
		>
			<IconComponent
				className={`h-4 w-4 ${showText ? "mr-2" : ""} ${
					bookmarked ? "fill-current" : ""
				} ${isPending ? "animate-pulse" : ""}`}
			/>
			{showText && (
				<span>{isPending ? "処理中..." : bookmarked ? "ブックマーク済み" : "ブックマーク"}</span>
			)}
		</Button>
	);
}
