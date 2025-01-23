import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const docsDirectory = path.join(process.cwd(), "src/docs");

export interface DocMeta {
	title: string;
	description: string;
	slug: string;
	category: string;
}

export async function getAllDocs(): Promise<DocMeta[]> {
	const categories = await fs.readdir(docsDirectory);
	const dirStats = await Promise.all(
		categories.map(async (file) => ({
			file,
			stat: await fs.stat(path.join(docsDirectory, file)),
		})),
	);
	const dirs = dirStats
		.filter(({ stat }) => stat.isDirectory())
		.map(({ file }) => file);

	const allDocs = await Promise.all(
		dirs.map(async (category) => {
			const categoryPath = path.join(docsDirectory, category);
			const files = await fs.readdir(categoryPath);

			const docs = await Promise.all(
				files.map(async (fileName) => {
					const filePath = path.join(categoryPath, fileName);
					const fileContents = await fs.readFile(filePath, "utf8");
					const { data } = matter(fileContents);

					return {
						...data,
						slug: fileName.replace(/\.mdx$/, ""),
						category,
					} as DocMeta;
				}),
			);

			return docs;
		}),
	);

	return allDocs.flat();
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
		} as DocMeta,
		content,
	};
}
