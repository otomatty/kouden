import { getMilestoneBySlug, getMilestoneNavigation } from "@/lib/milestones";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/lib/mdx-components";
import { mdxOptions } from "@/lib/mdx";
import Container from "@/components/ui/container";
import { MilestoneNavigation } from "@/components/milestones/milestone-navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BackLink } from "@/components/custom/back-link";
import { CheckCircle, Clock, Loader } from "lucide-react";
import type { Metadata } from "next";

type PageParams = Promise<{
	slug: string;
}>;

export async function generateMetadata({
	params,
}: {
	params: PageParams;
}): Promise<Metadata> {
	const resolvedParams = await params;

	try {
		const { meta } = await getMilestoneBySlug(resolvedParams.slug);
		return {
			title: `${meta.title} - マイルストーン`,
			description: meta.description,
			openGraph: {
				title: meta.title,
				description: meta.description,
			},
		};
	} catch {
		return {
			title: "マイルストーンが見つかりません",
			description: "指定されたマイルストーンが見つかりませんでした。",
		};
	}
}

export default async function MilestoneDetailPage({
	params,
}: {
	params: PageParams;
}) {
	const resolvedParams = await params;

	try {
		const { meta, content } = await getMilestoneBySlug(resolvedParams.slug);
		const { prev, next } = await getMilestoneNavigation(resolvedParams.slug);

		// ステータス設定
		const statusConfig = {
			planned: {
				color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
				icon: Clock,
				label: "計画中",
			},
			"in-progress": {
				color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
				icon: Loader,
				label: "進行中",
			},
			completed: {
				color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
				icon: CheckCircle,
				label: "完了",
			},
		};

		const StatusIcon = statusConfig[meta.status].icon;

		// 日付フォーマット
		const formatDate = (dateString: string) => {
			return new Date(dateString).toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		};

		return (
			<Container className="py-8 md:py-12">
				{/* 戻るリンク */}
				<div className="mb-6">
					<BackLink href="/milestones" label="マイルストーン一覧に戻る" />
				</div>

				{/* ヘッダー情報 */}
				<div className="mb-8 p-6 rounded-lg bg-muted/30 border">
					<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
						<div className="flex items-center gap-3">
							<Badge className={statusConfig[meta.status].color}>
								<StatusIcon className="w-4 h-4 mr-1" />
								{statusConfig[meta.status].label}
							</Badge>
							<Badge variant="outline">
								{meta.priority === "high"
									? "🔴 高優先度"
									: meta.priority === "medium"
										? "🟡 中優先度"
										: "🔵 低優先度"}
							</Badge>
							<Badge variant="secondary">
								{meta.category === "feature"
									? "🆕 新機能"
									: meta.category === "improvement"
										? "🔧 改善"
										: "🏗️ インフラ"}
							</Badge>
						</div>
						<div className="text-sm text-muted-foreground">期限: {formatDate(meta.targetDate)}</div>
					</div>

					<h1 className="text-3xl md:text-4xl font-bold mb-2">{meta.title}</h1>
					<p className="text-lg text-muted-foreground mb-4">{meta.description}</p>

					{/* 進捗バー */}
					<div className="mb-4">
						<div className="flex justify-between text-sm mb-2">
							<span className="font-medium">進捗状況</span>
							<span className="text-primary font-semibold">{meta.progress}%</span>
						</div>
						<Progress value={meta.progress} className="w-full h-3" />
					</div>

					{/* 主要機能一覧 */}
					{meta.features.length > 0 && (
						<div>
							<h3 className="font-semibold mb-2">📋 主要機能</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								{meta.features.map((feature) => (
									<div key={feature} className="flex items-center text-sm">
										<div className="w-2 h-2 bg-primary rounded-full mr-2 flex-shrink-0" />
										<span>{feature}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* MDXコンテンツ */}
				<article className="prose prose-slate dark:prose-invert max-w-none">
					{content && content.trim().length > 0 ? (
						<MDXRemote source={content} options={mdxOptions} components={mdxComponents} />
					) : (
						<div className="text-center py-12 text-muted-foreground">
							<div className="text-6xl mb-4">📝</div>
							<p className="text-lg">詳細情報はまだ準備中です</p>
							<p className="text-sm">近日中に更新予定です。</p>
						</div>
					)}
				</article>

				{/* ナビゲーション */}
				<MilestoneNavigation prevMilestone={prev} nextMilestone={next} />
			</Container>
		);
	} catch {
		return (
			<Container className="py-8 md:py-12">
				<div className="text-center py-12">
					<div className="text-6xl mb-4">🔍</div>
					<h1 className="text-2xl font-bold mb-2">マイルストーンが見つかりません</h1>
					<p className="text-muted-foreground mb-6">
						指定されたマイルストーンが存在しないか、削除された可能性があります。
					</p>
					<BackLink href="/milestones" label="マイルストーン一覧に戻る" />
				</div>
			</Container>
		);
	}
}
