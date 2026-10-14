import { prepareSnapshot } from "../src/prepare.ts";
import { ROLLBACK_TABLES } from "../src/rollback-plan.ts";
import { rollbackExportSchema, type Row } from "../src/rollback-export.ts";

export const at = "2024-01-01T00:00:00.000Z";
export const ids = {
	user: "10000000-0000-4000-8000-000000000001",
	book: "20000000-0000-4000-8000-000000000001",
	entry: "30000000-0000-4000-8000-000000000001",
	plan: "40000000-0000-4000-8000-000000000001",
	role: "50000000-0000-4000-8000-000000000001",
	member: "60000000-0000-4000-8000-000000000001",
};
export function sourceFixture() {
	const data: Record<string, Row[]> = Object.fromEntries(
		ROLLBACK_TABLES.map((t) => [`public.${t}`, []]),
	);
	data["auth.users"] = [
		{ id: ids.user, email: "owner@example.test", created_at: at, identities: [] },
	];
	data["public.profiles"] = [
		{
			id: ids.user,
			display_name: "試験利用者",
			avatar_url: "legacy://unchanged",
			created_at: at,
			updated_at: at,
		},
	];
	data["public.koudens"] = [
		{
			id: ids.book,
			title: "試験帳",
			description: "旧画面だけの説明",
			owner_id: ids.user,
			created_by: ids.user,
			status: "active",
			plan_id: ids.plan,
			created_at: at,
			updated_at: at,
		},
	];
	data["public.kouden_roles"] = [
		{
			id: ids.role,
			kouden_id: ids.book,
			name: "editor",
			description: null,
			permissions: ["view", "edit"],
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	data["public.kouden_members"] = [
		{
			id: ids.member,
			kouden_id: ids.book,
			user_id: ids.user,
			role_id: ids.role,
			added_by: ids.user,
			invitation_id: null,
			created_at: at,
			updated_at: at,
		},
	];
	data["public.kouden_entries"] = [
		{
			id: ids.entry,
			kouden_id: ids.book,
			name: "  差出人  ",
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
			last_modified_at: at,
			has_offering: false,
			is_duplicate: true,
			version: 1,
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	return sourceWithCounts(data);
}
export function relationshipFixture() {
	const source = sourceFixture();
	source.data["public.relationships"] = ["親族", "友人"].map((name, i) => ({
		id: `80000000-0000-4000-8000-00000000000${i + 1}`,
		kouden_id: ids.book,
		name,
		description: null,
		is_default: false,
		is_enabled: true,
		created_by: ids.user,
		created_at: `2024-01-0${i + 1}T00:00:00.000Z`,
		updated_at: at,
	}));
	const counted = sourceWithCounts(source.data);
	return { source: counted, current: exportedFixture(counted) };
}

export function sourceWithCounts(data: Record<string, Row[]>) {
	return {
		format_version: 1,
		project_ref: "abcdefghijklmnopqrst",
		extracted_at: at,
		data,
		row_counts: Object.fromEntries(
			Object.entries(data).map(([table, rows]) => [table, rows.length]),
		),
	};
}

export function memberRoleFixture(
	role: "editor" | "viewer",
	existing: boolean,
	candidates: { name: string; permissions: string[] }[],
) {
	const source = sourceFixture();
	const user = "10000000-0000-4000-8000-000000000002";
	source.data["auth.users"]!.push({
		...source.data["auth.users"]![0],
		id: user,
		email: "member@example.test",
	});
	source.data["public.profiles"]!.push({ ...source.data["public.profiles"]![0], id: user });
	const originalRole = source.data["public.kouden_roles"]![0]!;
	originalRole.name = "original-role";
	originalRole.permissions = role === "editor" ? ["view"] : ["view", "edit"];
	for (const [i, candidate] of candidates.entries())
		source.data["public.kouden_roles"]!.push({
			...originalRole,
			...candidate,
			id: `50000000-0000-4000-8000-00000000000${i + 2}`,
		});
	if (existing)
		source.data["public.kouden_members"]!.push({
			...source.data["public.kouden_members"]![0],
			id: "60000000-0000-4000-8000-000000000002",
			user_id: user,
		});
	const counted = sourceWithCounts(source.data);
	const current = exportedFixture(counted);
	const uid = current.manifest.users.find((u) => u.legacy_user_id === user)!.id;
	if (existing) current.manifest.members.find((m) => m.user_id === uid)!.role = role;
	else
		current.manifest.members.push({
			kouden_id: current.ledgers[0]!.koudenId,
			user_id: uid,
			role,
			joined_at: at,
			invited_by: current.manifest.users.find((u) => u.legacy_user_id === ids.user)!.id,
		});
	return { source: counted, current, user };
}

/** 旧作成者が v2 で降格・退会した後に、既存メンバーへ所有権が移った状態。 */
export function ownershipTransferFixture(formerOwner: "editor" | "removed") {
	const source = sourceFixture();
	const memberId = "10000000-0000-4000-8000-000000000002";
	source.data["auth.users"]!.push({
		...source.data["auth.users"]![0],
		id: memberId,
		email: "next-owner@example.test",
	});
	source.data["public.profiles"]!.push({ ...source.data["public.profiles"]![0], id: memberId });
	source.data["public.kouden_members"]!.push({
		...source.data["public.kouden_members"]![0],
		id: "60000000-0000-4000-8000-000000000002",
		user_id: memberId,
	});
	const counted = sourceWithCounts(source.data);
	const current = exportedFixture(counted);
	const owner = current.manifest.members.find((m) => m.role === "owner")!;
	const member = current.manifest.members.find((m) => m.user_id !== owner.user_id)!;
	current.manifest.koudens[0]!.owner_user_id = member.user_id;
	member.role = "owner";
	if (formerOwner === "removed")
		current.manifest.members = current.manifest.members.filter((m) => m !== owner);
	else owner.role = "editor";
	return { source: counted, current };
}
const snake = (r: Row): Row =>
	Object.fromEntries(
		Object.entries(r).map(([key, value]) => [
			key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
			typeof value === "boolean" ? Number(value) : value,
		]),
	);

/** 初期投入直後のエクスポート相当。実際の DO API は Worker のテストでも確認する。 */
export function exportedFixture(source: unknown) {
	const { plan } = prepareSnapshot(source);
	return rollbackExportSchema.parse({
		version: 1,
		origin: "https://staging.example.test",
		capturedAt: at,
		writesStopped: true,
		manifest: {
			users: plan.users.map((u) => ({
				id: u.id,
				legacy_user_id: u.legacyUserId,
				display_name: u.displayName,
				created_at: u.createdAt,
				deleted_at: null,
			})),
			koudens: plan.koudens.map(({ payload: k }) => ({
				id: k.koudenId,
				...snake(k.kouden),
				legacy_kouden_id: k.kouden.legacyKoudenId,
				plan: "paid",
				deceased_name_confirmed_at: null,
			})),
			members: plan.koudens.flatMap(({ payload: k }) =>
				k.members.map((m) => ({ kouden_id: k.koudenId, ...snake(m) })),
			),
			purchases: plan.koudens.flatMap(({ payload: k }) =>
				k.purchases.map((p) => ({
					kouden_id: k.koudenId,
					...snake(p),
					source: "legacy",
					status: "paid",
				})),
			),
		},
		ledgers: plan.koudens.map(({ payload: k }) => ({
			schemaVersion: 3,
			koudenId: k.koudenId,
			seq: 1,
			tables: Object.fromEntries([
				...Object.entries(k.ledger).map(([key, rows]) => [
					key === "contributors"
						? "gift_contributors"
						: key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
					rows.map((r) => snake(r)),
				]),
				["reminders", []],
				["change_log", [{ seq: 1, op: "import", entity: "kouden", entity_id: k.koudenId, at }]],
			]),
		})),
	});
}
