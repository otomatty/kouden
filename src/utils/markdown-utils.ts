/**
 * Markdownヘッダー用のユーティリティ関数
 */

export interface TocItem {
	id: string;
	text: string;
	level: number;
}

/**
 * テキストからIDを生成
 * 日本語も考慮したURL-safeなIDを生成
 */
export function generateHeaderId(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "") // 特殊文字を除去
		.replace(/[\s_-]+/g, "-") // スペースやアンダースコアをハイフンに
		.replace(/^-+|-+$/g, "") // 先頭末尾のハイフンを除去
		.slice(0, 50); // 長すぎる場合は切り詰め
}

/**
 * 重複しないユニークなIDを生成
 */
export function getUniqueHeaderId(baseId: string, usedIds: Set<string>): string {
	let uniqueId = baseId;
	let counter = 1;

	while (usedIds.has(uniqueId)) {
		uniqueId = `${baseId}-${counter}`;
		counter++;
	}

	usedIds.add(uniqueId);
	return uniqueId;
}

/**
 * Markdownコンテンツからヘッダーを抽出
 */
export function extractHeaders(content: string): TocItem[] {
	const headerRegex = /^(#{1,3})\s+(.+)$/gm;
	const headers: TocItem[] = [];
	const usedIds = new Set<string>();
	let match: RegExpExecArray | null;

	match = headerRegex.exec(content);
	while (match !== null) {
		const level = match[1]?.length || 0;
		const text = match[2]?.trim() || "";
		const baseId = generateHeaderId(text);
		const id = getUniqueHeaderId(baseId, usedIds);

		headers.push({
			id,
			text,
			level,
		});

		match = headerRegex.exec(content);
	}

	return headers;
}
