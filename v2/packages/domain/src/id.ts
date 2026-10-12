/**
 * UUIDv7（RFC 9562）を生成する。
 * 先頭 48 ビットがミリ秒単位の Unix 時刻なので、生成順に並び、索引の局所性が良い。
 */
export function uuidv7(now: number = Date.now()): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);

	// 48 ビットのタイムスタンプ（ビッグエンディアン）
	let ts = now;
	for (let i = 5; i >= 0; i--) {
		bytes[i] = ts % 256;
		ts = Math.floor(ts / 256);
	}
	// version = 7
	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
	// variant = 0b10
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
