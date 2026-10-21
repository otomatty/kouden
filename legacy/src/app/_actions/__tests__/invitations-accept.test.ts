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

interface MockUserClient {
	auth: {
		getUser: ReturnType<typeof vi.fn>;
	};
}

interface MockAdminClient {
	rpc: ReturnType<typeof vi.fn>;
}

describe("acceptInvitation", () => {
	let userClientMock: MockUserClient;
	let adminClientMock: MockAdminClient;

	beforeEach(() => {
		vi.clearAllMocks();
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

		vi.mocked(createClient).mockResolvedValue(userClientMock as never);
		vi.mocked(createAdminClient).mockReturnValue(adminClientMock as never);
	});

	it("未認証時に ok:false / UNAUTHORIZED を返す", async () => {
		userClientMock.auth.getUser.mockResolvedValue({ data: { user: null } });

		const result = await acceptInvitation(VALID_TOKEN);

		expect(result).toMatchObject({
			ok: false,
			error: { code: ErrorCodes.UNAUTHORIZED },
		});
		expect(adminClientMock.rpc).not.toHaveBeenCalled();
	});

	it("不正なトークン形式は ok:false / NOT_FOUND を返す", async () => {
		const result = await acceptInvitation("not-a-uuid");

		expect(result).toMatchObject({
			ok: false,
			error: { code: ErrorCodes.NOT_FOUND },
		});
		expect(createClient).not.toHaveBeenCalled();
		expect(adminClientMock.rpc).not.toHaveBeenCalled();
	});

	it("RPC 成功時に ok:true を返す", async () => {
		const result = await acceptInvitation(VALID_TOKEN);

		expect(result).toMatchObject({
			ok: true,
			data: null,
		});
		expect(adminClientMock.rpc).toHaveBeenCalledWith("accept_invitation_atomic", {
			p_token: VALID_TOKEN,
			p_user_id: "user-1",
		});
	});

	it.each([
		["invitation_not_found", "P0002", ErrorCodes.NOT_FOUND],
		["invitation_not_pending", "P0001", ErrorCodes.INVALID_OPERATION],
		["invitation_expired", "P0001", ErrorCodes.INVALID_OPERATION],
		["invitation_max_uses_reached", "P0001", ErrorCodes.INVALID_OPERATION],
		["already_member", "23505", ErrorCodes.ALREADY_EXISTS],
	])("RPC エラー %s (%s) を KoudenError にマップする", async (message, pgCode, code) => {
		adminClientMock.rpc.mockResolvedValue({
			error: { message, code: pgCode },
		});

		const result = await acceptInvitation(VALID_TOKEN);

		expect(result).toMatchObject({
			ok: false,
			error: { code },
		});
	});

	it("想定外の RPC エラーは ok:false を返す", async () => {
		adminClientMock.rpc.mockResolvedValue({
			error: { message: "unexpected_db_error", code: "XX000" },
		});

		const result = await acceptInvitation(VALID_TOKEN);

		expect(result).toMatchObject({
			ok: false,
			error: { code: ErrorCodes.DB_FETCH_ERROR },
		});
	});
});
