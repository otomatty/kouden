import type { PhotoReading } from "@kouden/domain";

/**
 * 写真から氏名・金額・住所を読む（08 案 D、ADR-T16）。送り先（Claude API・Workers AI など）は
 * 実物の香典袋で精度と費用を比べて決めるので、差し替えられるようにしておく。
 * 実装は、送ったデータを学習に使わない送り先に限り、写真と読み取った結果をログに出さず、保存もしない
 */
export interface PhotoReader {
	read(image: { bytes: ArrayBuffer; type: string }): Promise<PhotoReading>;
}

/** 設定（deploy.settings.ts の photoReader）に合う実装。"off" なら null（画面と API を出さない） */
export function photoReaderFor(env: Env): PhotoReader | null {
	if (env.PHOTO_READER === "fake") return fakePhotoReader;
	return null;
}

/** 開発・E2E 用の仮の実装（development でだけ使える）。写真の中身は読まず、写真ごとに決まった見本を返す */
export const fakePhotoReader: PhotoReader = {
	read: async ({ bytes }) => FAKE_SAMPLES[fingerprint(bytes) % FAKE_SAMPLES.length] ?? {},
};

/** 香典袋の書き方（旧字体の金額・全角の郵便番号）と、読み取れない欄を含む見本 */
export const FAKE_SAMPLES: PhotoReading[] = [
	{
		name: "佐藤 一郎",
		nameKana: "さとう いちろう",
		amount: "金壱萬円",
		postalCode: "〒１００ー０００１",
		address: "東京都千代田区千代田1-1",
	},
	{
		name: "鈴木 花子",
		amount: "五千円",
		postalCode: "530-0001",
		address: "大阪府大阪市北区梅田1-2-3",
	},
	{ organization: "株式会社 見本商事 一同", amount: "30,000" },
	{ name: "高橋 次郎", amount: "読めない" },
];

/** 写真ごとに見本を選ぶための値（中身の一部から作る。同じ写真なら同じ値） */
function fingerprint(bytes: ArrayBuffer): number {
	const view = new Uint8Array(bytes);
	let hash = 2166136261;
	const step = Math.max(1, Math.floor(view.length / 4096));
	for (let i = 0; i < view.length; i += step) {
		hash = Math.imul(hash ^ (view[i] ?? 0), 16777619) >>> 0;
	}
	return hash;
}
