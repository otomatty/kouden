import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

/**
 * マイルストーンのメタデータ
 */
export interface MilestoneMeta {
	title: string;
	description: string;
	period: string; // 2024-q4, 2025-q1 など
	targetDate: string; // YYYY-MM-DD形式
	status: "planned" | "in-progress" | "completed";
	priority: "high" | "medium" | "low";
	features: string[];
	progress: number; // 0-100の進捗率
	category: "feature" | "improvement" | "infrastructure";
}

const milestonesDirectory = path.join(process.cwd(), "src/docs/milestones");

/**
 * 全マイルストーンを取得（期限日順でソート）
 */
export async function getAllMilestones(): Promise<MilestoneMeta[]> {
	try {
		// ディレクトリが存在しない場合は空配列を返す
		try {
			await fs.access(milestonesDirectory);
		} catch {
			return [];
		}

		const files = await fs.readdir(milestonesDirectory);
		const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

		const milestones = await Promise.all(
			mdxFiles.map(async (fileName) => {
				const filePath = path.join(milestonesDirectory, fileName);
				const fileContents = await fs.readFile(filePath, "utf8");
				const { data } = matter(fileContents);
				const slug = fileName.replace(/\.mdx$/, "");

				return {
					...data,
					period: slug, // ファイル名をperiodとして使用
				} as MilestoneMeta;
			}),
		);

		// 期限日順でソート（早い順）
		return milestones.sort((a, b) => {
			const dateA = new Date(a.targetDate);
			const dateB = new Date(b.targetDate);
			return dateA.getTime() - dateB.getTime();
		});
	} catch (error) {
		console.error("Error loading milestones:", error);
		return [];
	}
}

/**
 * 指定されたスラッグのマイルストーンを取得
 */
export async function getMilestoneBySlug(slug: string) {
	const filePath = path.join(milestonesDirectory, `${slug}.mdx`);

	try {
		const fileContents = await fs.readFile(filePath, "utf8");
		const { data, content } = matter(fileContents);

		return {
			meta: {
				...data,
				period: slug,
			} as MilestoneMeta,
			content,
		};
	} catch (error) {
		console.error("Error loading milestone:", error);
		throw new Error(`Milestone not found: ${slug}`);
	}
}

/**
 * 前後のマイルストーンを取得（ナビゲーション用）
 */
export async function getMilestoneNavigation(currentSlug: string) {
	const allMilestones = await getAllMilestones();
	const currentIndex = allMilestones.findIndex((milestone) => milestone.period === currentSlug);

	if (currentIndex === -1) {
		return { prev: null, next: null };
	}

	return {
		prev: currentIndex > 0 ? allMilestones[currentIndex - 1] : null,
		next: currentIndex < allMilestones.length - 1 ? allMilestones[currentIndex + 1] : null,
	};
}

/**
 * ステータス別のマイルストーン数を取得
 */
export async function getMilestoneStats() {
	const milestones = await getAllMilestones();

	return {
		total: milestones.length,
		planned: milestones.filter((m) => m.status === "planned").length,
		inProgress: milestones.filter((m) => m.status === "in-progress").length,
		completed: milestones.filter((m) => m.status === "completed").length,
		averageProgress:
			milestones.length > 0
				? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
				: 0,
	};
}
