import type { ChangelogMeta } from "@/lib/changelogs";
import { ChangelogItem } from "./changelog-item";

interface ChangelogsTimelineProps {
	changelogs: ChangelogMeta[];
}

export function ChangelogsTimeline({ changelogs }: ChangelogsTimelineProps) {
	if (changelogs.length === 0) {
		return null;
	}

	return (
		<div className="relative max-w-4xl mx-auto">
			{/* 縦タイムライン線 */}
			<div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-border to-transparent" />

			<div className="space-y-12">
				{changelogs.map((changelog, index) => {
					// リリース年でグループ化するための年取得
					const currentYear = new Date(changelog?.releaseDate ?? "").getFullYear();
					const prevYear =
						index > 0 ? new Date(changelogs[index - 1]?.releaseDate ?? "").getFullYear() : null;
					const showYearHeader = index === 0 || currentYear !== prevYear;

					return (
						<div key={`${changelog.version}-${changelog.releaseDate}`}>
							{/* 年ヘッダー */}
							{showYearHeader && (
								<div className="relative flex items-center mb-8">
									{/* 年ラベル */}
									<div className="absolute left-0 w-16 h-8 bg-primary text-primary-foreground text-sm font-bold rounded-full flex items-center justify-center shadow-lg">
										{currentYear}
									</div>
									{/* 区切り線 */}
									<div className="ml-20 flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
								</div>
							)}

							{/* タイムラインアイテム */}
							<div className="relative flex items-start">
								{/* タイムライン点 */}
								<div className="absolute left-6 w-4 h-4 bg-primary rounded-full border-4 border-background shadow-lg z-10">
									{/* バージョンタイプに応じたアイコン */}
									<div className="absolute inset-0 flex items-center justify-center">
										{changelog.type === "major" && (
											<div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
										)}
										{changelog.type === "minor" && (
											<div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
										)}
										{changelog.type === "patch" && (
											<div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
										)}
									</div>
								</div>

								{/* コンテンツ */}
								<div className="ml-16 flex-1">
									<ChangelogItem changelog={changelog} />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* フッター */}
			<div className="text-center mt-16 pt-8 border-t border-border/50">
				<div className="text-sm text-muted-foreground">
					🎯 これですべての更新履歴をご確認いただきました
				</div>
			</div>
		</div>
	);
}
