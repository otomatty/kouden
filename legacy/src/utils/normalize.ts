// Utility functions for input normalization

/**
 * 全角数字と全角ハイフンを半角に変換します。
 * @param value 入力文字列
 * @returns 半角に変換された文字列
 */
export function normalizeNumericInput(value: string): string {
	return value
		.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
		.replace(/[ー―−]/g, "-");
}
