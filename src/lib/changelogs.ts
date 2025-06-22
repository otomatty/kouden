import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

/**
 * 更新履歴のメタデータ
 */
export interface ChangelogMeta {
	title: string;
	description: string;
	version: string; // 1.2.0 など
	releaseDate: string; // YYYY-MM-DD形式
	type: "major" | "minor" | "patch";
	category: "feature" | "bugfix" | "security" | "performance";
	highlights: string[];
	breaking: boolean; // 破壊的変更の有無
}

const changelogsDirectory = path.join(process.cwd(), "src/docs/changelogs");

/**
 * セマンティックバージョンを比較するためのユーティリティ
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
	const [major, minor, patch] = version.split(".").map(Number);
	return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

/**
 * バージョンを比較（新しい順にソートするため）
 */
function compareVersions(a: string, b: string): number {
	const versionA = parseVersion(a);
	const versionB = parseVersion(b);

	if (versionA.major !== versionB.major) {
		return versionB.major - versionA.major;
	}
	if (versionA.minor !== versionB.minor) {
		return versionB.minor - versionA.minor;
	}
	return versionB.patch - versionA.patch;
}

/**
 * 全更新履歴を取得（バージョン順でソート、新しい順）
 */
export async function getAllChangelogs(): Promise<ChangelogMeta[]> {
	try {
		// ディレクトリが存在しない場合は空配列を返す
		try {
			await fs.access(changelogsDirectory);
		} catch {
			return [];
		}

		const files = await fs.readdir(changelogsDirectory);
		const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

		const changelogs = await Promise.all(
			mdxFiles.map(async (fileName) => {
				const filePath = path.join(changelogsDirectory, fileName);
				const fileContents = await fs.readFile(filePath, "utf8");
				const { data } = matter(fileContents);
				const slug = fileName.replace(/\.mdx$/, "");

				return {
					...data,
					version: data.version || slug, // バージョンが設定されていない場合はスラッグを使用
				} as ChangelogMeta;
			}),
		);

		// セマンティックバージョニングでソート（新しい順）
		return changelogs.sort((a, b) => {
			// まずリリース日でソート（新しい順）
			const dateComparison = new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
			if (dateComparison !== 0) {
				return dateComparison;
			}
			// 同じ日付の場合はバージョンでソート
			return compareVersions(a.version, b.version);
		});
	} catch (error) {
		console.error("Error loading changelogs:", error);
		return [];
	}
}

/**
 * 指定されたスラッグの更新履歴を取得
 */
export async function getChangelogBySlug(slug: string) {
	const filePath = path.join(changelogsDirectory, `${slug}.mdx`);

	try {
		const fileContents = await fs.readFile(filePath, "utf8");
		const { data, content } = matter(fileContents);

		return {
			meta: {
				...data,
				version: data.version || slug,
			} as ChangelogMeta,
			content,
		};
	} catch (error) {
		console.error("Error loading changelog:", error);
		throw new Error(`Changelog not found: ${slug}`);
	}
}

/**
 * 前後の更新履歴を取得（ナビゲーション用）
 */
export async function getChangelogNavigation(currentSlug: string) {
	const allChangelogs = await getAllChangelogs();
	const currentIndex = allChangelogs.findIndex((changelog) => {
		const slug = changelog.version.replace(/\./g, "-"); // v1.2.0 -> v1-2-0
		return slug === currentSlug || changelog.version === currentSlug;
	});

	if (currentIndex === -1) {
		return { prev: null, next: null };
	}

	return {
		prev: currentIndex > 0 ? allChangelogs[currentIndex - 1] : null,
		next: currentIndex < allChangelogs.length - 1 ? allChangelogs[currentIndex + 1] : null,
	};
}

/**
 * 更新履歴の統計情報を取得
 */
export async function getChangelogStats() {
	const changelogs = await getAllChangelogs();

	const typeCount = changelogs.reduce(
		(acc, changelog) => {
			acc[changelog.type] = (acc[changelog.type] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const categoryCount = changelogs.reduce(
		(acc, changelog) => {
			acc[changelog.category] = (acc[changelog.category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	return {
		total: changelogs.length,
		breakingChanges: changelogs.filter((c) => c.breaking).length,
		lastRelease: changelogs[0]?.releaseDate || null,
		typeDistribution: typeCount,
		categoryDistribution: categoryCount,
	};
}

/**
 * 最近の更新履歴を取得（指定件数）
 */
export async function getRecentChangelogs(limit = 5): Promise<ChangelogMeta[]> {
	const allChangelogs = await getAllChangelogs();
	return allChangelogs.slice(0, limit);
}
