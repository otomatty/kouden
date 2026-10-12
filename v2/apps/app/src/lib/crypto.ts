/** URL セーフな base64（パディングなし） */
export function base64url(bytes: Uint8Array): string {
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** 暗号学的に安全な乱数トークン（既定 32 バイト = 256 ビット） */
export function randomToken(bytes = 32): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return base64url(buf);
}

export async function sha256(input: string): Promise<Uint8Array> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
	return new Uint8Array(digest);
}

export async function sha256Hex(input: string): Promise<string> {
	const bytes = await sha256(input);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
