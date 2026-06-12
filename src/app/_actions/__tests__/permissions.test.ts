/// <reference types="vitest" />
import { ErrorCodes, KoudenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	canDeleteKouden,
	checkKoudenPermission,
	getKoudenPermission,
	hasEditPermission,
	hasKoudenAccess,
	isKoudenOwner,
	requireKoudenEditor,
	requireKoudenOwner,
} from "../permissions";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

type MemberRow = {
	role_id: string;
	user_id: string;
	kouden_roles: { name: string } | null;
};

function buildSupabase({
	userId = "user-1",
	koudenRow,
	error = null,
}: {
	userId?: string | null;
	koudenRow?: {
		owner_id: string;
		created_by: string;
		kouden_members: MemberRow[] | null;
	} | null;
	error?: { code: string; message: string } | null;
}) {
	return {
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user: userId ? { id: userId } : null },
				error: null,
			}),
		},
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: koudenRow ?? null,
						error,
					}),
				}),
			}),
		}),
	};
}

describe("permissions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	describe("getKoudenPermission", () => {
		it("owner_id が一致する場合は owner を返す", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(
				buildSupabase({
					koudenRow: {
						owner_id: "user-1",
						created_by: "other",
						kouden_members: null,
					},
				}),
			);

			await expect(getKoudenPermission("kouden-1")).resolves.toBe("owner");
		});

		it("editor メンバーは editor を返す", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(
				buildSupabase({
					koudenRow: {
						owner_id: "other",
						created_by: "other",
						kouden_members: [
							{
								role_id: "role-1",
								user_id: "user-1",
								kouden_roles: { name: "editor" },
							},
						],
					},
				}),
			);

			await expect(getKoudenPermission("kouden-1")).resolves.toBe("editor");
		});

		it("未認証の場合は null を返す", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(buildSupabase({ userId: null }));

			await expect(getKoudenPermission("kouden-1")).resolves.toBeNull();
		});

		it("非メンバーは null を返す", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(
				buildSupabase({
					koudenRow: {
						owner_id: "other",
						created_by: "other",
						kouden_members: [],
					},
				}),
			);

			await expect(getKoudenPermission("kouden-1")).resolves.toBeNull();
		});
	});

	describe("checkKoudenPermission", () => {
		it("未認証の場合は UNAUTHORIZED を投げる", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(buildSupabase({ userId: null }));

			await expect(checkKoudenPermission("kouden-1")).rejects.toMatchObject({
				code: ErrorCodes.UNAUTHORIZED,
			});
		});

		it("非メンバーは FORBIDDEN を投げる", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(
				buildSupabase({
					koudenRow: {
						owner_id: "other",
						created_by: "other",
						kouden_members: [],
					},
				}),
			);

			await expect(checkKoudenPermission("kouden-1")).rejects.toMatchObject({
				code: ErrorCodes.FORBIDDEN,
			});
		});
	});

	describe("boolean helpers", () => {
		it("hasKoudenAccess は viewer でも true", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(
				buildSupabase({
					koudenRow: {
						owner_id: "other",
						created_by: "other",
						kouden_members: [
							{
								role_id: "role-1",
								user_id: "user-1",
								kouden_roles: { name: "viewer" },
							},
						],
					},
				}),
			);

			await expect(hasKoudenAccess("kouden-1")).resolves.toBe(true);
			await expect(hasEditPermission("kouden-1")).resolves.toBe(false);
			await expect(isKoudenOwner("kouden-1")).resolves.toBe(false);
			await expect(canDeleteKouden("kouden-1")).resolves.toBe(false);
		});
	});

	describe("requireKoudenEditor", () => {
		it("viewer は FORBIDDEN を投げる", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(
				buildSupabase({
					koudenRow: {
						owner_id: "other",
						created_by: "other",
						kouden_members: [
							{
								role_id: "role-1",
								user_id: "user-1",
								kouden_roles: { name: "viewer" },
							},
						],
					},
				}),
			);

			await expect(requireKoudenEditor("kouden-1")).rejects.toBeInstanceOf(KoudenError);
		});
	});

	describe("requireKoudenOwner", () => {
		it("editor は FORBIDDEN を投げる", async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mock
			(createClient as any).mockResolvedValue(
				buildSupabase({
					koudenRow: {
						owner_id: "other",
						created_by: "other",
						kouden_members: [
							{
								role_id: "role-1",
								user_id: "user-1",
								kouden_roles: { name: "editor" },
							},
						],
					},
				}),
			);

			await expect(requireKoudenOwner("kouden-1")).rejects.toMatchObject({
				code: ErrorCodes.FORBIDDEN,
			});
		});
	});
});
