import type { FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { LedgerEvent } from "../../ledger/types.ts";
import { ui } from "@kouden/ui";
import { EntrySummary, type EntrySummaryData } from "./gift-new.tsx";

/** 下書きの欄（表で入力と同じ API で登録する。gift-scan.js の FIELDS と同じ順） */
const DRAFT_FIELDS = [
	{ name: "name", label: "氏名", span: false },
	{ name: "nameKana", label: "ふりがな", span: false },
	{ name: "organization", label: "団体名", span: true },
	{ name: "amount", label: "金額", span: false, inputmode: "numeric" },
	{ name: "postalCode", label: "郵便番号", span: false, inputmode: "numeric" },
	{ name: "address", label: "住所", span: true },
] as const;

/**
 * 写真で登録（08 案 D）。カメラで香典袋を 1 枚ずつ映すと自動で撮り、裏で読み取って下書きにする。
 * 下書きは写真と見比べて直してから登録する。写真はこの画面のメモリにだけ置く（gift-scan.js）
 */
export const GiftScanPage: FC<{
	kouden: KoudenContext;
	events: LedgerEvent[];
	eventId: string;
	summary: EntrySummaryData;
}> = ({ kouden, events, eventId, summary }) => {
	const base = `/k/${kouden.id}`;
	return (
		<div class="mx-auto max-w-3xl space-y-4">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 class={ui.h2}>写真で登録</h2>
				<p class="flex gap-4 text-sm">
					<a href={`${base}/gifts/new?event=${eventId}`} class={ui.link}>
						1 件ずつ登録する
					</a>
					<a href={`${base}/gifts`} class={ui.link}>
						一覧に戻る
					</a>
				</p>
			</div>

			{events.length > 1 && (
				<nav aria-label="行事" class="flex flex-wrap gap-2">
					{events.map((e) => (
						<a
							href={`${base}/gifts/scan?event=${e.id}`}
							aria-current={e.id === eventId ? "page" : undefined}
							class={`rounded-full border px-4 py-1.5 text-sm ${
								e.id === eventId
									? "border-accent bg-accent text-surface"
									: "border-line bg-surface text-ink hover:bg-paper"
							}`}
						>
							{e.name}
						</a>
					))}
				</nav>
			)}

			<EntrySummary kouden={kouden} summary={summary} />

			<p class="text-sm text-muted">
				香典袋の中袋や芳名カードを枠に合わせて映すと、自動で撮って読み取ります。読み取りを待たずに次の袋を映せます。読み取った内容は下書きに入るので、写真と見比べて直してから登録してください。写真は読み取りに使うだけで、保存しません。
			</p>
			<noscript>
				<p class={ui.alert}>
					写真で登録するには JavaScript が必要です。
					<a href={`${base}/gifts/new?event=${eventId}`} class={ui.link}>
						1 件ずつ登録する
					</a>
				</p>
			</noscript>

			<section
				aria-label="カメラ"
				class={`${ui.cardTight} space-y-3`}
				data-gift-scan
				data-read-url={`${base}/gifts/read`}
				data-save-url={`${base}/gifts/sheet`}
				data-gift-url={`${base}/gifts/`}
				data-summary-url={`${base}/gifts/new?partial=summary&eventId=${eventId}`}
				data-event-id={eventId}
			>
				<div class="relative overflow-hidden rounded-lg bg-ink" data-scan-viewer hidden>
					<video
						class="block aspect-[3/4] w-full object-cover sm:aspect-video"
						playsinline
						muted
						aria-label="カメラの映像"
					></video>
					{/* 袋を合わせる枠 */}
					<div
						class="pointer-events-none absolute inset-[8%] rounded-lg border-2 border-dashed border-surface/80"
						aria-hidden="true"
					></div>
					<div
						class="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-150"
						data-scan-flash
						aria-hidden="true"
					></div>
				</div>
				<p class="text-sm" data-scan-message aria-live="polite"></p>
				<div class="flex flex-wrap items-center gap-3">
					<button type="button" class={ui.buttonPrimary} data-scan-start>
						カメラを始める
					</button>
					<button type="button" class={ui.buttonPrimary} data-scan-shoot hidden>
						撮る
					</button>
					<label class="inline-flex items-center gap-2 text-sm" data-scan-auto-label hidden>
						<input type="checkbox" data-scan-auto checked />
						自動で撮る
					</label>
					<button type="button" class={ui.buttonSecondary} data-scan-stop hidden>
						カメラを止める
					</button>
					<label class={`${ui.buttonSecondary} cursor-pointer`}>
						写真を選ぶ
						<input type="file" accept="image/*" multiple class="sr-only" data-scan-files />
					</label>
				</div>
			</section>

			<section aria-labelledby="drafts-heading" class="space-y-3">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 id="drafts-heading" class={ui.h3}>
						下書き <span data-draft-count>0</span> 件
						<span class="ml-2 text-sm font-normal text-muted" data-reading-count></span>
					</h3>
					<button type="button" class={ui.buttonPrimary} data-drafts-save-all hidden>
						まとめて登録する
					</button>
				</div>
				<p class="text-sm text-muted" data-drafts-empty>
					撮った写真の読み取りが終わると、ここに並びます。
				</p>
				<ol class="space-y-3" data-drafts></ol>
			</section>

			{/* gift-scan.js が下書きを足すときの見本（__KEY__ を下書きごとの値に置き換える） */}
			<template data-draft-template>
				<li class={`${ui.cardTight} space-y-3`} data-draft aria-labelledby="draft-__KEY__-title">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h4 id="draft-__KEY__-title" class="font-medium" data-draft-title></h4>
						<p class="text-sm" data-draft-status id="draft-__KEY__-status"></p>
					</div>
					<div class="grid gap-3 sm:grid-cols-[10rem_1fr]">
						<img
							alt=""
							class="max-h-60 w-full rounded-lg bg-paper object-contain sm:max-h-48"
							data-draft-photo
						/>
						<div class="grid gap-3 sm:grid-cols-2" data-postal-scope>
							{DRAFT_FIELDS.map((f) => (
								<div class={f.span ? "sm:col-span-2" : ""}>
									<label for={`draft-__KEY__-${f.name}`} class={ui.label}>
										{f.label}
									</label>
									<input
										id={`draft-__KEY__-${f.name}`}
										data-field={f.name}
										class={`${ui.input} mt-1`}
										autocomplete="off"
										inputmode={"inputmode" in f ? f.inputmode : undefined}
										{...(f.name === "postalCode" ? { "data-postal-code": "" } : {})}
										{...(f.name === "address" ? { "data-address": "" } : {})}
									/>
								</div>
							))}
						</div>
					</div>
					<div class="flex flex-wrap gap-3" data-draft-actions>
						<button type="button" class={ui.buttonPrimary} data-draft-save disabled>
							登録する
						</button>
						<button type="button" class={ui.buttonSecondary} data-draft-retry hidden>
							もう一度読み取る
						</button>
						<button type="button" class={ui.buttonSecondary} data-draft-discard>
							捨てる
						</button>
					</div>
				</li>
			</template>
			<script src={`/assets/gift-scan.js?v=${__ASSET_VERSION__}`} defer></script>
		</div>
	);
};
