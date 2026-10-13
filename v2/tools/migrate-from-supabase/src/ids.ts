import { createHash } from "node:crypto";

/**
 * 旧 ID から新しい ID を決定的に作る（UUIDv5、RFC 9562）。移行を何度実行しても同じ ID になる（05 §2）。
 * 名前は `<種類>:<旧 ID>` にして、同じ旧 ID から作る別の行（香典 1 件 → 差出人・いただきもの）と重ならないようにする
 */
const NAMESPACE = "6f2a1d4e-8c3b-5e7a-9d1f-4b6c8e0a2d3f";

export function uuidv5(name: string, namespace = NAMESPACE): string {
	const ns = Buffer.from(namespace.replaceAll("-", ""), "hex");
	const hash = createHash("sha1").update(ns).update(name, "utf8").digest();
	const bytes = hash.subarray(0, 16);
	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
	const hex = bytes.toString("hex");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const newId = {
	user: (legacyId: string) => uuidv5(`user:${legacyId}`),
	kouden: (legacyId: string) => uuidv5(`kouden:${legacyId}`),
	purchase: (legacyId: string) => uuidv5(`purchase:${legacyId}`),
	/** 旧データには行事がないので、香典帳ごとに「葬儀」を 1 件作る */
	event: (legacyKoudenId: string) => uuidv5(`event:${legacyKoudenId}`),
	relationship: (legacyId: string) => uuidv5(`relationship:${legacyId}`),
	entryPerson: (legacyEntryId: string) => uuidv5(`person:entry:${legacyEntryId}`),
	entryGift: (legacyEntryId: string) => uuidv5(`gift:entry:${legacyEntryId}`),
	offeringGift: (legacyId: string) => uuidv5(`gift:offering:${legacyId}`),
	offeringPerson: (legacyId: string) => uuidv5(`person:offering:${legacyId}`),
	telegramGift: (legacyId: string) => uuidv5(`gift:telegram:${legacyId}`),
	telegramPerson: (legacyId: string) => uuidv5(`person:telegram:${legacyId}`),
	returnItem: (legacyId: string) => uuidv5(`return_item:${legacyId}`),
	returnItemImage: (legacyId: string) => uuidv5(`return_item_image:${legacyId}`),
	returnRule: (legacyItemId: string) => uuidv5(`return_rule:${legacyItemId}`),
	/** 香典返しは差出人（= 旧の香典 1 件）ごとに 1 件 */
	return: (legacyEntryId: string) => uuidv5(`return:${legacyEntryId}`),
	returnLine: (legacyId: string) => uuidv5(`return_line:${legacyId}`),
};
