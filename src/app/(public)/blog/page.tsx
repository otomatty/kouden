import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { getPublishedPosts } from "@/app/_actions/blog/posts";
import Container from "@/components/ui/container";
import { PageHero } from "@/app/(public)/_components/page-hero";
import { FeaturedPostsSection } from "./_components/featured-posts-section";
import { PostsGrid } from "./_components/posts-grid";
import { BlogSidebar } from "./_components/blog-sidebar";

export default async function BlogPage() {
	const { data: posts, error } = await getPublishedPosts();

	if (error) {
		return (
			<>
				<PageHero
					title="香典・葬儀のお役立ち情報"
					subtitle="香典のマナーから葬儀の準備まで、大切な時に知っておきたい情報をお届けします"
				/>
				<Container className="py-8">
					<p className="text-red-500 text-center">記事の読み込み中にエラーが発生しました。</p>
				</Container>
			</>
		);
	}

	if (!posts || posts.length === 0) {
		return (
			<>
				<PageHero
					title="香典・葬儀のお役立ち情報"
					subtitle="香典のマナーから葬儀の準備まで、大切な時に知っておきたい情報をお届けします"
					cta={{
						label: "アプリをダウンロード",
						href: "/download",
						icon: Download,
					}}
					secondaryCta={{
						label: "機能を見る",
						href: "/features",
						icon: ArrowRight,
					}}
				/>
				<Container className="py-8">
					<p className="text-center text-muted-foreground">まだ記事がありません。</p>
				</Container>
			</>
		);
	}

	// 記事を分類
	const featuredPosts = posts.slice(0, 3); // 注目記事
	const recentPosts = posts.slice(0, 8); // 最新記事
	const allPosts = posts.slice(3); // その他の記事

	return (
		<>
			{/* ヒーローセクション */}
			<PageHero
				title="香典・葬儀のお役立ち情報"
				subtitle="香典のマナーから葬儀の準備まで、大切な時に知っておきたい情報をお届けします"
				cta={{
					label: "アプリをダウンロード",
					href: "/download",
					icon: Download,
				}}
				secondaryCta={{
					label: "機能を見る",
					href: "/features",
					icon: ArrowRight,
				}}
				className="bg-gradient-to-b from-background to-muted/20"
			/>

			<Container className="py-12">
				{/* 注目記事セクション */}
				{featuredPosts.length > 0 && (
					<FeaturedPostsSection posts={featuredPosts} title="注目記事" />
				)}

				{/* 2カラムレイアウト */}
				<div className="grid gap-8 lg:grid-cols-3">
					{/* メインコンテンツ */}
					<div className="lg:col-span-2">
						{allPosts.length > 0 && <PostsGrid posts={allPosts} title="すべての記事" />}
					</div>

					{/* サイドバー */}
					<div className="lg:col-span-1">
						<BlogSidebar recentPosts={recentPosts} />
					</div>
				</div>
			</Container>
		</>
	);
}
