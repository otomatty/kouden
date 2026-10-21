/**
 * Gyazo URLを画像URLに変換する
 * @param url 変換対象のURL
 * @returns 変換後のURL
 */
export function convertGyazoUrl(url: string): string {
	// Gyazo URLのパターンをチェック
	const gyazoMatch = url.match(/^https:\/\/gyazo\.com\/([a-zA-Z0-9]+)$/);
	if (gyazoMatch) {
		const imageId = gyazoMatch[1];
		return `https://i.gyazo.com/${imageId}.png`;
	}

	// 既に画像URLの場合はそのまま返す
	if (url.match(/^https:\/\/i\.gyazo\.com\/[a-zA-Z0-9]+\.(png|jpg|jpeg|gif)$/)) {
		return url;
	}

	// その他のURLはそのまま返す
	return url;
}

/**
 * URL文字列が画像URLかどうかを判定する
 * @param url 判定対象のURL
 * @returns 画像URLの場合true
 */
export function isImageUrl(url: string): boolean {
	return /\.(png|jpg|jpeg|gif|webp|svg|avif)(\?.*)?$/i.test(url);
}

/**
 * Gyazo URLかどうかを判定する
 * @param url 判定対象のURL
 * @returns Gyazo URLの場合true
 */
export function isGyazoUrl(url: string): boolean {
	return /^https:\/\/(i\.)?gyazo\.com\//.test(url);
}
