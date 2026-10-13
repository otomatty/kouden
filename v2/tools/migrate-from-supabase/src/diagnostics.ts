import { GIFT_KIND_VALUES, RETURN_STATUS_VALUES } from "@kouden/domain";

// 入力値を含まない、ツール自身が定義したコードだけを表示する。
const codes = new Set([
	"invalid_command",
	"prepare_arguments",
	"run_arguments",
	"invalid_import_origin",
	"dev_token_requires_loopback",
	"missing_access_credentials",
	"invalid_import_path",
	"import_network_error",
	"empty_import_response",
	"import_response_too_large",
	"invalid_import_response",
	"import_retry_exhausted",
	"payload_too_large",
	"file_manifest_mismatch",
	"invalid_file_key",
	"image_path_outside_map_directory",
	"image_size",
	"image_kouden_missing",
	"verification_mismatch",
	"local_file_checksum",
	"repeated_file_cursor",
	"unsupported:offering_photos",
	"source_reference:offering_entry",
	"source_reference:telegram",
	"invalid:owner",
	"invalid:primary_contributor",
	...[
		"plan_id",
		"file_source",
		"user",
		"legacy_user",
		"google_sub",
		"member",
		"purchase",
		"contributor",
		"return_person",
		"events",
		"relationships",
		"persons",
		"gifts",
		"returnItems",
		"returnRules",
		"returns",
		"returnLines",
	].map((label) => `duplicate:${label}`),
	...[
		"image_file_map",
		"owner",
		"member_user",
		"purchase_user",
		"relationships",
		"events",
		"gifts",
		"persons",
		"returnItems",
		"returns",
	].map((label) => `missing:${label}`),
]);

const sourceTables = new Set([
	"auth.users",
	"public.profiles",
	"public.koudens",
	"public.kouden_roles",
	"public.kouden_members",
	"public.kouden_purchases",
	"public.relationships",
	"public.kouden_entries",
	"public.offerings",
	"public.offering_allocations",
	"public.offering_entries",
	"public.offering_photos",
	"public.telegrams",
	"public.return_items",
	"public.return_entry_records",
	"public.return_record_items",
]);
const sourceMetrics = new Set([
	"members",
	"kodenTotal",
	"returnItems",
	...GIFT_KIND_VALUES.map((kind) => `gifts.${kind}`),
	...RETURN_STATUS_VALUES.map((status) => `returns.${status}`),
]);

/** CLI とレポートで共有する。未知の例外は文字種にかかわらず公開しない。 */
export function publicErrorCode(error: unknown): string | null {
	if (!(error instanceof Error)) return null;
	const message = error.message;
	if (codes.has(message) || /^import_http_[1-5]\d{2}$/.test(message)) return message;
	const [prefix, detail, extra] = message.split(":");
	if (!detail || extra !== undefined) return null;
	if ((prefix === "snapshot_count" || prefix === "unassigned_source") && sourceTables.has(detail))
		return message;
	if (prefix === "source_mismatch" && detail.split(",").every((key) => sourceMetrics.has(key)))
		return message;
	return null;
}

/** 値やスタックを含めず、事前検証の失敗理由を標準エラー出力向けに整える。 */
export function cliFailureMessage(error: unknown): string {
	const code = publicErrorCode(error);
	return `移行CLIに失敗しました${code ? `（${code}）` : ""}。引数・入力形式・保存先・認証設定を確認してください。\n`;
}
