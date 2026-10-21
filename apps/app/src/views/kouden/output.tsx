import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { LedgerEvent } from "../../ledger/types.ts";
import { formatDate } from "../format.ts";
import { ui } from "@kouden/ui";
import { RETURN_FILTERS } from "./returns.tsx";

/** 印刷・出力（E7-2, E7-3）: 印刷用ページと Excel の入口 */
export const OutputPage: FC<{ kouden: KoudenContext; events: LedgerEvent[] }> = ({
	kouden,
	events,
}) => {
	const base = `/k/${kouden.id}`;
	const withGifts = events.filter((e) => e.giftCount > 0);
	return (
		<div class="space-y-6">
			<p class="text-sm text-muted">
				出力した紙やファイルには差出人の住所・金額などの個人情報が含まれます。取り扱いにご注意ください。
			</p>

			<section aria-labelledby="print" class={`${ui.card} space-y-5`}>
				<div class="space-y-1">
					<h2 id="print" class={ui.h2}>
						印刷
					</h2>
					<p class="text-sm text-muted">
						A4 の印刷用ページを開きます。ブラウザの印刷から、紙に印刷するか PDF に保存してください。
					</p>
				</div>

				<div class="space-y-2">
					<h3 class={ui.h3}>芳名一覧</h3>
					{withGifts.length === 0 ? (
						<p class="text-sm text-muted">いただきものはまだありません。</p>
					) : (
						<ul class="flex flex-wrap gap-2">
							<li>
								<a href={`${base}/print/gifts`} class={ui.buttonSecondary}>
									すべての行事
								</a>
							</li>
							{withGifts.map((e) => (
								<li>
									<a href={`${base}/print/gifts?event=${e.id}`} class={ui.buttonSecondary}>
										{e.name}
										{e.date && <span class="text-muted">（{formatDate(e.date)}）</span>}
									</a>
								</li>
							))}
						</ul>
					)}
				</div>

				<div class="space-y-2">
					<h3 class={ui.h3}>香典返し一覧</h3>
					<form
						method="get"
						action={`${base}/print/returns`}
						class="flex flex-wrap items-end gap-2"
					>
						<div class="space-y-1">
							<label for="print-status" class={ui.label}>
								対象
							</label>
							<select id="print-status" name="status" class={`${ui.input} w-48`}>
								{RETURN_FILTERS.map((f) => (
									<option value={f.value}>{f.label}</option>
								))}
							</select>
						</div>
						<button type="submit" class={ui.buttonSecondary}>
							開く
						</button>
					</form>
				</div>

				<div class="space-y-2">
					<h3 class={ui.h3}>宛名一覧</h3>
					<p class="text-sm text-muted">
						香典返しに送付先を入れた方はその住所を、それ以外は差出人の住所を使います。
					</p>
					<ul class="flex flex-wrap gap-2">
						<li>
							<a href={`${base}/print/addresses`} class={ui.buttonSecondary}>
								すべての差出人
							</a>
						</li>
						<li>
							<a href={`${base}/print/addresses?only=shipping`} class={ui.buttonSecondary}>
								香典返しを配送する方
							</a>
						</li>
					</ul>
				</div>
			</section>

			<section aria-labelledby="excel" class={`${ui.card} space-y-4`}>
				<div class="space-y-1">
					<h2 id="excel" class={ui.h2}>
						Excel
					</h2>
					<p class="text-sm text-muted">
						いただきもの・差出人・香典返しを、それぞれ別のシートにした .xlsx
						ファイルをダウンロードします。
					</p>
				</div>
				<a href={`${base}/export.xlsx`} download class={ui.buttonPrimary}>
					Excel をダウンロード
				</a>
			</section>
		</div>
	);
};
