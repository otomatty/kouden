import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { getCategoryOrder, getDocOrder } from "./docs-config";

/**
 * ドキュメントのメタデータを取得して、ドキュメントの一覧を取得する
 * @returns ドキュメントのメタデータ
 * ドキュメントはsrc/docsディレクトリに配置されている
 * ドキュメントはmdxファイルである
 * ドキュメントのメタデータはmdxファイルの先頭に配置されている
 *
 * ドキュメントのメタデータは以下のような形式である
 * ```mdx
 * ---
 * title: "ドキュメントのタイトル"
 * description: "ドキュメントの説明"
 * slug: "ドキュメントのスラッグ"
 * category: "ドキュメントのカテゴリ"
 */

const docsDirectory = path.join(process.cwd(), "src/docs");

export interface DocMeta {
	title: string;
	description: string;
	slug: string;
	category: string;
	categoryOrder: number;
	docOrder: number;
}

export async function getAllDocs(): Promise<DocMeta[]> {
	const categories = await fs.readdir(docsDirectory);
	const dirStats = await Promise.all(
		categories.map(async (file) => ({
			file,
			stat: await fs.stat(path.join(docsDirectory, file)),
		})),
	);
	const dirs = dirStats.filter(({ stat }) => stat.isDirectory()).map(({ file }) => file);

	const allDocs = await Promise.all(
		dirs.map(async (category) => {
			const categoryPath = path.join(docsDirectory, category);
			const files = await fs.readdir(categoryPath);

			const docs = await Promise.all(
				files.map(async (fileName) => {
					const filePath = path.join(categoryPath, fileName);
					const fileContents = await fs.readFile(filePath, "utf8");
					const { data } = matter(fileContents);
					const slug = fileName.replace(/\.mdx$/, "");

					return {
						...data,
						slug,
						category,
						categoryOrder: getCategoryOrder(category),
						docOrder: getDocOrder(category, slug),
					} as DocMeta;
				}),
			);

			return docs;
		}),
	);

	// 順序でソートして返す
	return allDocs.flat().sort((a, b) => {
		// まずカテゴリの順序でソート
		if (a.categoryOrder !== b.categoryOrder) {
			return a.categoryOrder - b.categoryOrder;
		}
		// 同じカテゴリ内ではドキュメントの順序でソート
		return a.docOrder - b.docOrder;
	});
}

export async function getDocBySlug(category: string, slug: string) {
	const filePath = path.join(docsDirectory, category, `${slug}.mdx`);
	const fileContents = await fs.readFile(filePath, "utf8");
	const { data, content } = matter(fileContents);

	return {
		meta: {
			...data,
			slug,
			category,
			categoryOrder: getCategoryOrder(category),
			docOrder: getDocOrder(category, slug),
		} as DocMeta,
		content,
	};
}
