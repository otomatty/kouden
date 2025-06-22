import { getAllMilestones } from "@/lib/milestones";
import { MilestonesTimeline } from "@/components/milestones/milestones-timeline";
import Container from "@/components/ui/container";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "開発マイルストーン - 香典帳アプリ",
	description:
		"香典帳アプリの今後の開発予定とロードマップをご紹介します。新機能の実装計画や進捗状況をご確認いただけます。",
	openGraph: {
		title: "開発マイルストーン - 香典帳アプリ",
		description: "香典帳アプリの今後の開発予定とロードマップをご紹介します。",
	},
};

export default async function MilestonesPage() {
	const milestones = await getAllMilestones();

	return (
		<Container className="py-8 md:py-12">
			{/* ヘッダーセクション */}
			<div className="text-center mb-12">
				<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
					開発マイルストーン
				</h1>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					香典帳アプリの今後の開発予定をご紹介します。
					<br />
					新機能の実装計画や進捗状況をタイムライン形式でご確認いただけます。
				</p>
			</div>

			{/* マイルストーンが存在しない場合の表示 */}
			{milestones.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">🚀</div>
					<h2 className="text-2xl font-semibold mb-2">マイルストーンを準備中です</h2>
					<p className="text-muted-foreground">
						開発計画が策定され次第、こちらでお知らせいたします。
					</p>
				</div>
			) : (
				<>
					{/* 統計情報（簡易版） */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
						<div className="text-center p-4 rounded-lg bg-muted/50">
							<div className="text-2xl font-bold text-primary">{milestones.length}</div>
							<div className="text-sm text-muted-foreground">マイルストーン</div>
						</div>
						<div className="text-center p-4 rounded-lg bg-muted/50">
							<div className="text-2xl font-bold text-green-600">
								{milestones.filter((m) => m.status === "completed").length}
							</div>
							<div className="text-sm text-muted-foreground">完了</div>
						</div>
						<div className="text-center p-4 rounded-lg bg-muted/50">
							<div className="text-2xl font-bold text-yellow-600">
								{milestones.filter((m) => m.status === "in-progress").length}
							</div>
							<div className="text-sm text-muted-foreground">進行中</div>
						</div>
						<div className="text-center p-4 rounded-lg bg-muted/50">
							<div className="text-2xl font-bold text-blue-600">
								{milestones.filter((m) => m.status === "planned").length}
							</div>
							<div className="text-sm text-muted-foreground">計画中</div>
						</div>
					</div>

					{/* タイムライン */}
					<MilestonesTimeline milestones={milestones} />

					{/* 注意事項 */}
					<div className="mt-12 p-6 rounded-lg bg-muted/30 border-l-4 border-primary">
						<h3 className="font-semibold mb-2">📝 開発計画について</h3>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• 開発スケジュールは予告なく変更される場合があります</li>
							<li>• 進捗状況は定期的に更新されます</li>
							<li>
								• ご意見・ご要望は
								<a href="/contact" className="text-primary hover:underline">
									お問い合わせ
								</a>
								よりお聞かせください
							</li>
						</ul>
					</div>
				</>
			)}
		</Container>
	);
}
