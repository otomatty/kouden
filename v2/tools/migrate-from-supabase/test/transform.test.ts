import { importKoudenPayloadSchema, importUsersPayloadSchema } from "@kouden/domain";
import { describe, expect, it } from "vitest";
import { newId, uuidv5 } from "../src/ids.ts";
import type { LegacyEntry, LegacyKoudenSource } from "../src/source.ts";
import {
	guessDeceasedName,
	legacyCounts,
	MISSING_NAME,
	transformKouden,
	transformUsers,
} from "../src/transform.ts";

const T = "2024-03-01T10:00:00.123456+00:00";
const OWNER = "u-owner";
const EDITOR = "u-editor";
const VIEWER = "u-viewer";
const KNOWN = new Set([OWNER, EDITOR, VIEWER]);

function entry(id: string, fields: Partial<LegacyEntry> = {}): LegacyEntry {
	return {
		id,
		name: null,
		organization: null,
		position: null,
		amount: 10000,
		postal_code: null,
		address: null,
		phone_number: null,
		relationship_id: null,
		attendance_type: "FUNERAL",
		notes: null,
		last_modified_by: null,
		created_by: OWNER,
		created_at: T,
		updated_at: T,
		...fields,
	};
}

function source(overrides: Partial<LegacyKoudenSource> = {}): LegacyKoudenSource {
	return {
		kouden: {
			id: "k1",
			title: "故 山田 一郎 様",
			owner_id: OWNER,
			status: "active",
			created_at: T,
			updated_at: T,
		},
		roles: [
			{ id: "r-edit", permissions: ["view", "edit"] },
			{ id: "r-view", permissions: ["view"] },
		],
		members: [
			{ user_id: OWNER, role_id: "r-edit", added_by: OWNER, created_at: T },
			{ user_id: EDITOR, role_id: "r-edit", added_by: OWNER, created_at: T },
			{ user_id: VIEWER, role_id: "r-view", added_by: "u-gone", created_at: T },
			{ user_id: "u-gone", role_id: "r-view", added_by: OWNER, created_at: T },
		],
		purchases: [
			{
				id: "pur1",
				user_id: OWNER,
				amount_paid: 2980,
				stripe_session_id: "cs_test_1",
				purchased_at: T,
			},
		],
		relationships: [
			{ id: "rel-b", name: "友人", is_enabled: false, created_at: "2024-01-02T00:00:00Z" },
			{ id: "rel-a", name: "親族", is_enabled: true, created_at: "2024-01-01T00:00:00Z" },
		],
		entries: [
			entry("e1", {
				name: " 佐藤 一郎 ",
				relationship_id: "rel-a",
				postal_code: "100-0001",
				address: "東京都千代田区1-1",
				phone_number: "03-0000-0000",
				notes: "受付で確認",
				last_modified_by: EDITOR,
			}),
			entry("e2", {
				organization: "株式会社サンプル",
				attendance_type: "CONDOLENCE_VISIT",
				amount: 5000,
			}),
			entry("e3", { amount: 3000, attendance_type: "ABSENT", relationship_id: "rel-missing" }),
		],
		offerings: [
			{
				id: "o1",
				type: "FLOWER",
				description: "供花一対",
				quantity: 2,
				price: 15000,
				provider_name: "使わない名前",
				notes: null,
				created_by: OWNER,
				created_at: T,
				updated_at: T,
			},
			{
				id: "o2",
				type: "FOOD",
				description: null,
				quantity: 1,
				price: 5000,
				provider_name: "鈴木 花子",
				notes: "果物",
				created_by: OWNER,
				created_at: T,
				updated_at: T,
			},
		],
		offeringAllocations: [
			{
				offering_id: "o1",
				kouden_entry_id: "e1",
				allocated_amount: 7500,
				is_primary_contributor: false,
				created_at: T,
			},
			{
				offering_id: "o1",
				kouden_entry_id: "e2",
				allocated_amount: 7500,
				is_primary_contributor: true,
				created_at: T,
			},
		],
		offeringEntries: [],
		telegrams: [
			{
				id: "t1",
				kouden_entry_id: "e1",
				sender_name: "佐藤 一郎",
				sender_organization: null,
				sender_position: null,
				message: "ご冥福をお祈りします",
				notes: null,
				created_by: OWNER,
				created_at: T,
				updated_at: T,
			},
			{
				id: "t2",
				kouden_entry_id: null,
				sender_name: "高橋 次郎",
				sender_organization: "高橋商店",
				sender_position: "代表",
				message: null,
				notes: null,
				created_by: OWNER,
				created_at: T,
				updated_at: T,
			},
		],
		returnItems: [
			{
				id: "i1",
				name: "タオルセット",
				category: "日用品",
				price: 3000,
				description: null,
				image_url: "https://example.supabase.co/storage/v1/object/public/return-items/k1/towel.png",
				is_active: true,
				sort_order: 2,
				recommended_amount_min: 5000,
				recommended_amount_max: 10000,
				created_at: T,
				updated_at: T,
			},
			{
				id: "i2",
				name: "お茶",
				category: null,
				price: 2000,
				description: null,
				image_url: null,
				is_active: null,
				sort_order: 1,
				recommended_amount_min: null,
				recommended_amount_max: null,
				created_at: T,
				updated_at: T,
			},
		],
		returnRecords: [
			{
				id: "rr1",
				kouden_entry_id: "e1",
				return_status: "PENDING",
				return_method: "shipping",
				funeral_gift_amount: 1000,
				arrangement_date: null,
				shipping_postal_code: null,
				shipping_address: null,
				shipping_phone_number: null,
				remarks: "最初のメモ",
				return_items: null,
				created_by: OWNER,
				created_at: "2024-03-02T00:00:00Z",
				updated_at: "2024-03-02T00:00:00Z",
			},
			{
				id: "rr2",
				kouden_entry_id: "e1",
				return_status: "COMPLETED",
				return_method: "shipping",
				funeral_gift_amount: 2000,
				arrangement_date: "2024-03-05",
				shipping_postal_code: "100-0001",
				shipping_address: "東京都千代田区1-1",
				shipping_phone_number: null,
				remarks: "発送済み",
				// 表の行（l1）と同じ品は 1 つにし、列にだけある品は明細に加える
				return_items: [
					{
						id: "i1",
						name: "タオルセット",
						price: 3000,
						quantity: 1,
						masterId: "i1",
						isFromMaster: true,
					},
					{ name: "線香", price: 1000, quantity: 2, notes: "手渡し" },
				],
				created_by: EDITOR,
				created_at: "2024-03-03T00:00:00Z",
				updated_at: "2024-03-10T20:00:00Z",
			},
			{
				id: "rr3",
				kouden_entry_id: "e2",
				return_status: "PARTIAL_RETURNED",
				return_method: "hand_delivery",
				funeral_gift_amount: 0,
				arrangement_date: "2024-03-06T15:30:00Z",
				shipping_postal_code: null,
				shipping_address: null,
				shipping_phone_number: null,
				remarks: null,
				// 旧画面の一括更新は、表に行を作らず列にだけ書く
				return_items: [
					{ id: "i2", name: "お茶", price: 2000, quantity: 1, masterId: "i2", isFromMaster: true },
					{ name: "形が違う" },
				],
				created_by: OWNER,
				created_at: T,
				updated_at: T,
			},
		],
		returnRecordItems: [
			{ id: "l1", return_record_id: "rr2", return_item_master_id: "i1", price: 3000, quantity: 1 },
			{
				id: "l2",
				return_record_id: "rr1",
				return_item_master_id: "i-gone",
				price: 1500,
				quantity: 0,
			},
		],
		...overrides,
	};
}

const codes = (warnings: { code: string }[]) => warnings.map((w) => w.code);

describe("ID", () => {
	it("UUIDv5 は RFC 9562 の例と一致し、同じ名前なら同じ ID になる", () => {
		// RFC 9562 Appendix A.4（DNS 名前空間、"www.example.com"）
		expect(uuidv5("www.example.com", "6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(
			"2ed6657d-e927-568b-95e1-2665a8aea6a2",
		);
		expect(newId.user("a")).toBe(newId.user("a"));
		expect(newId.entryPerson("a")).not.toBe(newId.entryGift("a"));
	});
});

describe("ユーザー（05 §3）", () => {
	it("Google の人は sub を、メールの人は null にし、表示名はプロフィール → メールの前半の順で決める", () => {
		const { users, warnings } = transformUsers(
			[
				{
					id: OWNER,
					email: "owner@example.com",
					created_at: T,
					identities: [
						{ provider: "email", provider_id: OWNER },
						{ provider: "google", provider_id: "google-sub-1" },
					],
				},
				{
					id: EDITOR,
					email: "hanako@gmail.com",
					created_at: T,
					identities: [{ provider: "email", provider_id: EDITOR }],
				},
				{ id: VIEWER, email: null, created_at: T, identities: [] },
			],
			[
				{ id: OWNER, display_name: " 山田 太郎 " },
				{ id: EDITOR, display_name: "" },
			],
		);
		expect(users).toEqual([
			{
				id: newId.user(OWNER),
				legacyUserId: OWNER,
				email: "owner@example.com",
				displayName: "山田 太郎",
				googleSub: "google-sub-1",
				createdAt: "2024-03-01T10:00:00.123Z",
			},
			expect.objectContaining({ displayName: "hanako", googleSub: null }),
			expect.objectContaining({ email: "", displayName: "利用者", googleSub: null }),
		]);
		expect(codes(warnings)).toEqual(["user_without_email"]);
		expect(importUsersPayloadSchema.safeParse({ users }).success).toBe(true);
	});
});

describe("香典帳（05 §3）", () => {
	const result = transformKouden(source(), KNOWN);
	const { payload } = result;
	const ledger = payload.ledger;
	const personOf = (legacyEntryId: string) =>
		ledger.persons.find((p) => p.id === newId.entryPerson(legacyEntryId));

	it("取り込み口の形に合う", () => {
		const parsed = importKoudenPayloadSchema.safeParse(payload);
		expect(parsed.error?.issues ?? []).toEqual([]);
	});

	it("香典帳は有料版のまま移し、故人のお名前は香典帳の名前から仮に決める", () => {
		expect(result.koudenId).toBe(newId.kouden("k1"));
		expect(payload.kouden).toMatchObject({
			legacyKoudenId: "k1",
			title: "故 山田 一郎 様",
			deceasedName: "山田 一郎",
			ownerUserId: newId.user(OWNER),
			status: "active",
		});
		expect(guessDeceasedName("山田家")).toBe("山田家");
		expect(guessDeceasedName("故 田中花子殿")).toBe("田中花子");
	});

	it("メンバー: オーナー・編集（edit を含む）・閲覧。いないユーザーは移さない", () => {
		expect(payload.members).toEqual([
			{
				userId: newId.user(OWNER),
				role: "owner",
				joinedAt: "2024-03-01T10:00:00.123Z",
				invitedBy: null,
			},
			{
				userId: newId.user(EDITOR),
				role: "editor",
				joinedAt: expect.any(String),
				invitedBy: newId.user(OWNER),
			},
			// 招待した人がいなければ空にする
			{ userId: newId.user(VIEWER), role: "viewer", joinedAt: expect.any(String), invitedBy: null },
		]);
		expect(codes(result.warnings)).toContain("member_without_user");
		expect(payload.purchases).toEqual([
			{
				id: newId.purchase("pur1"),
				userId: newId.user(OWNER),
				amount: 2980,
				stripeCheckoutSessionId: "cs_test_1",
				createdAt: "2024-03-01T10:00:00.123Z",
			},
		]);
	});

	it("行事は「葬儀」1 件にまとめ、関係は作成順・使わない関係は隠す", () => {
		expect(ledger.events).toEqual([
			{ id: newId.event("k1"), kind: "funeral", name: "葬儀", date: null, sortOrder: 1 },
		]);
		expect(ledger.relationships).toEqual([
			{ id: newId.relationship("rel-a"), name: "親族", sortOrder: 1, isHidden: false },
			{ id: newId.relationship("rel-b"), name: "友人", sortOrder: 2, isHidden: true },
		]);
	});

	it("香典 1 件 = 差出人 1 人。氏名も団体名もなければ補い、参列は写像する", () => {
		expect(personOf("e1")).toMatchObject({
			name: "佐藤 一郎",
			relationshipId: newId.relationship("rel-a"),
			postalCode: "100-0001",
			phone: "03-0000-0000",
			notes: null,
			createdBy: newId.user(OWNER),
			updatedBy: newId.user(EDITOR),
		});
		expect(personOf("e2")).toMatchObject({ name: null, organization: "株式会社サンプル" });
		expect(personOf("e3")).toMatchObject({
			name: MISSING_NAME,
			notes: expect.stringContaining("移行時に補完"),
		});
		// 存在しない関係は外す
		expect(personOf("e3")?.relationshipId).toBeNull();

		const koden = ledger.gifts.filter((g) => g.kind === "koden");
		expect(koden.map((g) => [g.amount, g.attendance, g.notes])).toEqual([
			[10000, "attended", "受付で確認"],
			[5000, "condolence_visit", null],
			[3000, "absent", null],
		]);
		expect(codes(result.warnings)).toEqual(
			expect.arrayContaining(["person_without_name", "unknown_relationship"]),
		);
	});

	it("供物: 種類を写像し、按分した香典の差出人を負担額つきで連名にする。紐づきがなければ提供者から差出人を作る", () => {
		const o1 = newId.offeringGift("o1");
		expect(ledger.gifts.find((g) => g.id === o1)).toMatchObject({
			kind: "kyoka",
			amount: 15000,
			itemName: "供花一対",
			quantity: 2,
		});
		expect(ledger.contributors.filter((c) => c.giftId === o1)).toEqual([
			{ giftId: o1, personId: newId.entryPerson("e1"), isPrimary: false, shareAmount: 7500 },
			{ giftId: o1, personId: newId.entryPerson("e2"), isPrimary: true, shareAmount: 7500 },
		]);

		const o2 = newId.offeringGift("o2");
		expect(ledger.gifts.find((g) => g.id === o2)).toMatchObject({
			kind: "kumotsu",
			itemName: "供物",
			notes: "果物",
		});
		expect(ledger.contributors.filter((c) => c.giftId === o2)).toEqual([
			{ giftId: o2, personId: newId.offeringPerson("o2"), isPrimary: true, shareAmount: null },
		]);
		expect(ledger.persons.find((p) => p.id === newId.offeringPerson("o2"))?.name).toBe("鈴木 花子");
	});

	it("代表者のいない連名は先頭を代表者にし、代表者は 1 人だけにする", () => {
		const { payload: p } = transformKouden(
			source({
				offeringAllocations: [
					{
						offering_id: "o1",
						kouden_entry_id: "e1",
						allocated_amount: 0,
						is_primary_contributor: null,
						created_at: T,
					},
					{
						offering_id: "o1",
						kouden_entry_id: "e2",
						allocated_amount: 0,
						is_primary_contributor: null,
						created_at: T,
					},
				],
				offeringEntries: [{ offering_id: "o1", kouden_entry_id: "e3", created_at: T }],
			}),
			KNOWN,
		);
		const list = p.ledger.contributors.filter((c) => c.giftId === newId.offeringGift("o1"));
		expect(list.map((c) => c.isPrimary)).toEqual([true, false, false]);
		expect(list.map((c) => c.personId)).toEqual(
			["e1", "e2", "e3"].map((e) => newId.entryPerson(e)),
		);
	});

	it("弔電: 香典に紐づけばその差出人、なければ差出人を新しく作る", () => {
		const t1 = newId.telegramGift("t1");
		const t2 = newId.telegramGift("t2");
		expect(ledger.gifts.find((g) => g.id === t1)).toMatchObject({
			kind: "choden",
			message: "ご冥福をお祈りします",
		});
		expect(ledger.contributors.find((c) => c.giftId === t1)?.personId).toBe(
			newId.entryPerson("e1"),
		);
		expect(ledger.contributors.find((c) => c.giftId === t2)?.personId).toBe(
			newId.telegramPerson("t2"),
		);
		expect(ledger.persons.find((p) => p.id === newId.telegramPerson("t2"))).toMatchObject({
			name: "高橋 次郎",
			organization: "高橋商店",
			position: "代表",
		});
	});

	it("返礼品: 並び順を保ち、画像は R2 へのコピーに回す。推奨金額は金額帯ルール（半返し）にする", () => {
		expect(ledger.returnItems.map((i) => [i.name, i.sortOrder, i.isActive])).toEqual([
			["お茶", 1, true],
			["タオルセット", 2, true],
		]);
		const towel = ledger.returnItems.find((i) => i.name === "タオルセット");
		expect(towel?.imageR2Key).toMatch(new RegExp(`^koudens/${result.koudenId}/return-items/`));
		expect(result.files).toEqual([
			{
				source: "https://example.supabase.co/storage/v1/object/public/return-items/k1/towel.png",
				key: towel?.imageR2Key,
			},
		]);
		expect(ledger.returnRules).toEqual([
			{
				id: newId.returnRule("i1"),
				minAmount: 5000,
				maxAmount: 10000,
				ratioNumerator: 1,
				ratioDenominator: 2,
				suggestedItemId: newId.returnItem("i1"),
				sortOrder: 1,
			},
		]);
	});

	it("香典返し: 差出人単位にまとめ、状況・方法・当日返し・日付・明細を移す", () => {
		const e1 = ledger.returns.find((r) => r.personId === newId.entryPerson("e1"));
		expect(e1).toMatchObject({
			id: newId.return("e1"),
			status: "shipped",
			method: "shipping",
			onDayAmount: 2000,
			arrangedAt: "2024-03-05",
			// 発送日は最後に更新した日（日本時間）
			shippedAt: "2024-03-11",
			shipAddress: "東京都千代田区1-1",
			notes: "最初のメモ\n発送済み",
			createdBy: newId.user(OWNER),
			updatedBy: newId.user(EDITOR),
		});
		const e2 = ledger.returns.find((r) => r.personId === newId.entryPerson("e2"));
		expect(e2).toMatchObject({
			status: "arranged",
			method: "hand_delivery",
			arrangedAt: "2024-03-07",
		});
		expect(ledger.returnLines).toEqual([
			// 記録の更新順（rr1 → rr2）、記録の中では表の行 → 列の品
			{
				id: newId.returnLine("l2"),
				returnId: newId.return("e1"),
				returnItemId: null,
				name: "（品名不明）",
				unitPrice: 1500,
				quantity: 1,
			},
			{
				id: newId.returnLine("l1"),
				returnId: newId.return("e1"),
				returnItemId: newId.returnItem("i1"),
				name: "タオルセット",
				unitPrice: 3000,
				quantity: 1,
			},
			{
				id: newId.embeddedReturnLine("rr2", 1),
				returnId: newId.return("e1"),
				returnItemId: null,
				name: "線香",
				unitPrice: 1000,
				quantity: 2,
			},
			{
				id: newId.embeddedReturnLine("rr3", 0),
				returnId: newId.return("e2"),
				returnItemId: newId.returnItem("i2"),
				name: "お茶",
				unitPrice: 2000,
				quantity: 1,
			},
		]);
		expect(codes(result.warnings)).toEqual(
			expect.arrayContaining(["returns_merged", "line_without_item", "invalid_embedded_item"]),
		);
	});

	it("何度変換しても同じ結果になる", () => {
		expect(transformKouden(source(), KNOWN)).toEqual(result);
	});

	it("検証用の件数は、取り込んだ後の件数と比べられる形にする", () => {
		expect(legacyCounts(source())).toEqual({
			gifts: { koden: 3, kumotsu: 1, kyoka: 1, choden: 2, other: 0 },
			kodenTotal: 18000,
			returnItems: 2,
			// 取り込んだ後の LedgerImportSummary.returns と同じ形（差出人単位・最後の記録の状況）
			returns: { pending: 0, arranged: 1, shipped: 1, handed_on_day: 0, not_required: 0 },
			members: 4,
		});
	});

	it("オーナーのユーザーがいなければ変換しない（取り込むと参照が壊れる）", () => {
		expect(() => transformKouden(source(), new Set([EDITOR]))).toThrow(/owner/);
	});
});
