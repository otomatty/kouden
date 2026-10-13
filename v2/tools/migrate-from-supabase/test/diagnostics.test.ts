import { describe, expect, it } from "vitest";
import { cliFailureMessage, publicErrorCode } from "../src/diagnostics.ts";

describe("公開できるエラーの診断", () => {
	it.each([
		"snapshot_count:public.kouden_entries",
		"unassigned_source:public.offering_allocations",
		"duplicate:giftPhotos",
		"source_mismatch:kodenTotal",
		"source_mismatch:gifts.koden,returns.pending,kodenTotal,members",
		"dev_token_requires_loopback",
		"missing_access_credentials",
		"missing:returnItems",
		"duplicate:returnLines",
		"import_http_403",
	])("既知のコード %s を表示する", (code) => {
		const error = new Error(code);
		expect(publicErrorCode(error)).toBe(code);
		expect(cliFailureMessage(error)).toContain(`（${code}）`);
	});
	it.each([
		new Error("private@example.test secret"),
		new Error("kouden private-id: owner private-owner is not in auth.users"),
		new Error("secret_token"),
		new Error("snapshot_count:public.private_name"),
		new Error("source_mismatch:kodenTotal,private_name"),
		new Error("missing:private_id"),
		new Error("missing_access_credentials\nprivate@example.test"),
		new Error("import_http_403:secret"),
		"missing_access_credentials",
		{ message: "missing_access_credentials" },
		null,
	])("未知の値や個人情報は固定文言にする (%#)", (error) => {
		expect(publicErrorCode(error)).toBeNull();
		expect(cliFailureMessage(error)).toBe(
			"移行CLIに失敗しました。引数・入力形式・保存先・認証設定を確認してください。\n",
		);
	});
});
