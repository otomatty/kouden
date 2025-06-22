import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ChangelogMeta } from "@/lib/changelogs";

interface ChangelogNavigationProps {
	prevChangelog?: ChangelogMeta | null;
	nextChangelog?: ChangelogMeta | null;
}

export function ChangelogNavigation({ prevChangelog, nextChangelog }: ChangelogNavigationProps) {
	// 前後両方ともない場合は何も表示しない
	if (!prevChangelog) {
		return null;
	}

	if (!nextChangelog) {
		return null;
	}

	// バージョンスラッグの生成
	const getVersionSlug = (version: string) => version.replace(/\./g, "-");

	// 日付フォーマット
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
			{/* 前の更新履歴（より新しいバージョン） */}
			<div className="flex-1">
				{prevChangelog && (
					<Link
						href={`/changelogs/${getVersionSlug(prevChangelog.version)}`}
						className="group block max-w-sm"
					>
						<div className="flex items-start text-muted-foreground hover:text-foreground transition-colors">
							<ChevronLeft className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
							<div>
								<div className="text-xs uppercase tracking-wide mb-1 text-muted-foreground">
									より新しいバージョン
								</div>
								<div className="font-medium group-hover:underline line-clamp-2">
									v{prevChangelog.version} - {prevChangelog.title}
								</div>
								<div className="text-xs text-muted-foreground mt-1">
									{formatDate(prevChangelog.releaseDate)}
								</div>
							</div>
						</div>
					</Link>
				)}
			</div>

			{/* 中央のスペーサー */}
			<div className="flex-shrink-0 mx-4">
				{prevChangelog && nextChangelog && <div className="w-px h-12 bg-border" />}
			</div>

			{/* 次の更新履歴（より古いバージョン） */}
			<div className="flex-1 text-right">
				{nextChangelog && (
					<Link
						href={`/changelogs/${getVersionSlug(nextChangelog.version)}`}
						className="group block max-w-sm ml-auto"
					>
						<div className="flex items-start justify-end text-muted-foreground hover:text-foreground transition-colors">
							<div className="text-right">
								<div className="text-xs uppercase tracking-wide mb-1 text-muted-foreground">
									より古いバージョン
								</div>
								<div className="font-medium group-hover:underline line-clamp-2">
									v{nextChangelog.version} - {nextChangelog.title}
								</div>
								<div className="text-xs text-muted-foreground mt-1">
									{formatDate(nextChangelog.releaseDate)}
								</div>
							</div>
							<ChevronRight className="w-5 h-5 ml-2 mt-0.5 flex-shrink-0" />
						</div>
					</Link>
				)}
			</div>
		</div>
	);
}
