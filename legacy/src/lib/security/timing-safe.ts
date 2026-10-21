/**
 * 2つの文字列を定数時間で比較する（タイミング攻撃対策）。
 * 短絡評価せず全文字をXORして集約することで、最初の不一致位置を漏らさない。
 *
 * 注意:
 *   入力長が一致しない場合は早期に false を返す。これは入力長が一致する正規系での
 *   タイミング差を消すことを目的とした実装であり、Node.js の `crypto.timingSafeEqual`
 *   と同じ前提に立つ。長さそのものは比較対象から漏れうるため、機密値とのペアでは
 *   呼び出し側であらかじめハッシュ化して長さを揃えることが望ましい。
 *
 * @param a 比較対象A
 * @param b 比較対象B
 * @returns 完全一致なら true
 */
export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}
