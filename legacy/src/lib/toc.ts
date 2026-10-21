export interface TocItem {
	id: string;
	title: string;
	level: number;
}

/**
 * MDXコンテンツから見出しを抽出してTOCアイテムを生成する
 */
export function extractTocFromMdx(content: string): TocItem[] {
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;
	const toc: TocItem[] = [];
	let match: RegExpExecArray | null = null;
	let headingIndex = 0;

	// biome-ignore lint/suspicious/noAssignInExpressions: regex exec pattern
	while ((match = headingRegex.exec(content)) !== null) {
		const level = match[1]?.length ?? 0;
		const title = match[2]?.trim() ?? "";

		// IDを生成（位置情報を含む一意のID）
		const baseId = generateHeadingId(title);
		const id = `${baseId}-${headingIndex}`;

		toc.push({
			id,
			title,
			level,
		});

		headingIndex++;
	}

	return toc;
}

/**
 * タイトルからヘッディングIDを生成する
 */
function generateHeadingId(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, "") // 日本語と英数字、ハイフン、スペースのみ残す
		.replace(/\s+/g, "-") // スペースをハイフンに置換
		.replace(/^-+|-+$/g, "") // 先頭末尾のハイフンを除去
		.slice(0, 50); // 長すぎる場合は制限
}

/**
 * TOCの階層構造を整理する
 */
export function normalizeToc(toc: TocItem[]): TocItem[] {
	if (toc.length === 0) return [];

	// 最小レベルを基準にして、相対的な階層を計算
	const minLevel = Math.min(...toc.map((item) => item.level));

	return toc.map((item) => ({
		...item,
		level: item.level - minLevel + 1, // 1から始まるように正規化
	}));
}
