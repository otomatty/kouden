import { getAllChangelogs } from "@/lib/changelogs";
import { ChangelogsTimeline } from "@/components/changelogs/changelogs-timeline";
import Container from "@/components/ui/container";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "更新履歴 - 香典帳アプリ",
	description:
		"香典帳アプリの最新アップデート情報と過去のリリース履歴をご確認いただけます。新機能、改善、バグ修正などの詳細をお知らせします。",
	openGraph: {
		title: "更新履歴 - 香典帳アプリ",
		description: "香典帳アプリの最新アップデート情報と過去のリリース履歴をご確認いただけます。",
	},
};

export default async function ChangelogsPage() {
	const changelogs = await getAllChangelogs();

	return (
		<Container className="py-8 md:py-12">
			{/* ヘッダーセクション */}
			<div className="text-center mb-12">
				<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
					更新履歴
				</h1>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					香典帳アプリの最新アップデート情報をお届けします。
					<br />
					新機能の追加、改善、バグ修正などの詳細をご確認いただけます。
				</p>
			</div>

			{/* 更新履歴が存在しない場合の表示 */}
			{changelogs.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">📋</div>
					<h2 className="text-2xl font-semibold mb-2">更新履歴を準備中です</h2>
					<p className="text-muted-foreground">
						アップデート情報が公開され次第、こちらでお知らせいたします。
					</p>
				</div>
			) : (
				<>
					{/* 統計情報 */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
						<div className="text-center p-4 rounded-lg bg-muted/50">
							<div className="text-2xl font-bold text-primary">{changelogs.length}</div>
							<div className="text-sm text-muted-foreground">リリース</div>
						</div>
						<div className="text-center p-4 rounded-lg bg-muted/50">
							<div className="text-2xl font-bold text-red-600">
								{changelogs.filter((c) => c.type === "major").length}
							</div>
							<div className="text-sm text-muted-foreground">メジャー</div>
						</div>
						<div className="text-center p-4 rounded-lg bg-muted/50">
							<div className="text-2xl font-bold text-blue-600">
								{changelogs.filter((c) => c.type === "minor").length}
							</div>
							<div className="text-sm text-muted-foreground">マイナー</div>
						</div>
						<div className="text-center p-4 rounded-lg bg-muted/50">
							<div className="text-2xl font-bold text-green-600">
								{changelogs.filter((c) => c.type === "patch").length}
							</div>
							<div className="text-sm text-muted-foreground">パッチ</div>
						</div>
					</div>

					{/* 最新バージョンのハイライト */}
					{changelogs.length > 0 && (
						<div className="mb-12 p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
							<div className="flex items-center gap-2 mb-2">
								<span className="text-lg">🎉</span>
								<h2 className="text-lg font-semibold">最新バージョン</h2>
							</div>
							<div className="text-sm text-muted-foreground">
								<span className="font-medium text-primary">{changelogs[0]?.version}</span> が{" "}
								<span className="font-medium">
									{new Date(changelogs[0]?.releaseDate ?? "").toLocaleDateString("ja-JP")}
								</span>{" "}
								にリリースされました
							</div>
						</div>
					)}

					{/* タイムライン */}
					<ChangelogsTimeline changelogs={changelogs} />

					{/* バージョニングについて */}
					<div className="mt-12 p-6 rounded-lg bg-muted/30 border-l-4 border-primary">
						<h3 className="font-semibold mb-2">📝 バージョニングについて</h3>
						<div className="text-sm text-muted-foreground space-y-2">
							<p>
								• <strong className="text-red-600">メジャー</strong>: 大幅な機能追加や破壊的変更
							</p>
							<p>
								• <strong className="text-blue-600">マイナー</strong>: 新機能追加（後方互換性あり）
							</p>
							<p>
								• <strong className="text-green-600">パッチ</strong>: バグ修正やセキュリティ改善
							</p>
							<p className="pt-2 border-t border-border/50">
								セマンティックバージョニング（<code>major.minor.patch</code>）に準拠しています。
							</p>
						</div>
					</div>
				</>
			)}
		</Container>
	);
}
