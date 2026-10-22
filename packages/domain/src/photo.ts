import { z } from "zod";
import { parseYenText } from "./forms.ts";

/**
 * 写真から読み取った内容（08 案 D、ADR-T16）。読み取りの実装（AI など）の出力をそのまま信用せず、
 * 形と長さを確かめてから下書きにする。読めなかった欄は空か省略
 */
export const photoReadingSchema = z.object({
	name: z.string().max(200).optional(),
	nameKana: z.string().max(200).optional(),
	organization: z.string().max(200).optional(),
	/** 書いてあるままの金額（「金壱萬円」「10,000」など） */
	amount: z.string().max(50).optional(),
	postalCode: z.string().max(20).optional(),
	address: z.string().max(400).optional(),
});
export type PhotoReading = z.output<typeof photoReadingSchema>;

/** 下書きの欄。登録の画面の入力欄にそのまま入れる文字列 */
export interface PhotoDraft {
	name: string;
	nameKana: string;
	organization: string;
	amount: string;
	postalCode: string;
	address: string;
}

/** 欄の長さの上限（登録の検証と同じ） */
const LIMITS = { name: 50, nameKana: 100, organization: 100, address: 200 } as const;

const clean = (text: string | undefined, max: number) =>
	(text ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * 読み取った内容を下書きの形にする。金額は「10,000」の形に、郵便番号は「100-0001」の形にそろえ、
 * 読めない金額・7 桁でない郵便番号は空にする（人が入れる）
 */
export function toPhotoDraft(reading: PhotoReading): PhotoDraft {
	const yen = reading.amount ? parseYenText(reading.amount) : undefined;
	const digits = (reading.postalCode ?? "").normalize("NFKC").replace(/\D/g, "");
	return {
		name: clean(reading.name, LIMITS.name),
		nameKana: clean(reading.nameKana, LIMITS.nameKana),
		organization: clean(reading.organization, LIMITS.organization),
		amount: yen !== undefined && yen > 0 ? yen.toLocaleString("ja-JP") : "",
		postalCode: digits.length === 7 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : "",
		address: clean(reading.address, LIMITS.address),
	};
}
