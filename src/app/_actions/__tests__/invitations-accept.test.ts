/// <reference types="vitest" />
import { acceptInvitation } from "@/app/_actions/invitations";
import { ErrorCodes } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));

const VALID_TOKEN = "11111111-1111-4111-8111-111111111111";

describe("acceptInvitation", () => {
	// biome-ignore lint/suspicious/noExplicitAny: supabase mock
	let userClientMock: any;
	// biome-ignore lint/suspicious/noExplicitAny: supabase mock
	let adminClientMock: any;

	beforeEach(() => {
		userClientMock = {
			auth: {
				getUser: vi.fn().mockResolvedValue({
					data: { user: { id: "user-1" } },
				}),
			},
		};
		adminClientMock = {
			rpc: vi.fn().mockResolvedValue({ error: null }),
		};

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(createClient as any).mockResolvedValue(userClientMock);
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(createAdminClient as any).mockReturnValue(adminClientMock);
	});

	it("未認証時に ok:false / UNAUTHORIZED を返す", async () => {
		userClientMock.auth.getUser.mockResolvedValue({ data: { user: null } });

		const result = await acceptInvitation(VALID_TOKEN);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.UNAUTHORIZED);
		}
		expect(adminClientMock.rpc).not.toHaveBeenCalled();
	});

	it("不正なトークン形式は ok:false / NOT_FOUND を返す", async () => {
		const result = await acceptInvitation("not-a-uuid");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.NOT_FOUND);
		}
		expect(adminClientMock.rpc).not.toHaveBeenCalled();
	});

	it("RPC 成功時に ok:true を返す", async () => {
		const result = await acceptInvitation(VALID_TOKEN);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data).toBeNull();
		}
		expect(adminClientMock.rpc).toHaveBeenCalledWith("accept_invitation_atomic", {
			p_token: VALID_TOKEN,
			p_user_id: "user-1",
		});
	});

	it.each([
		["invitation_not_found", ErrorCodes.NOT_FOUND],
		["invitation_not_pending", ErrorCodes.INVALID_OPERATION],
		["invitation_expired", ErrorCodes.INVALID_OPERATION],
		["invitation_max_uses_reached", ErrorCodes.INVALID_OPERATION],
		["already_member", ErrorCodes.ALREADY_EXISTS],
	])("RPC エラー %s を KoudenError にマップする", async (message, code) => {
		adminClientMock.rpc.mockResolvedValue({
			error: { message, code: "P0001" },
		});

		const result = await acceptInvitation(VALID_TOKEN);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(code);
		}
	});

	it("想定外の RPC エラーは ok:false を返す", async () => {
		adminClientMock.rpc.mockResolvedValue({
			error: { message: "unexpected_db_error", code: "XX000" },
		});

		const result = await acceptInvitation(VALID_TOKEN);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.DB_FETCH_ERROR);
		}
	});
});
