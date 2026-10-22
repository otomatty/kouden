import { ROLES } from "@kouden/domain";
import type { Child, FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import type { Caller } from "../../ledger/types.ts";
import { ui } from "@kouden/ui";

export type KoudenTab = "top" | "gifts" | "persons" | "returns" | "output" | "members" | "settings";

const TABS: readonly { tab: KoudenTab; label: string; path: string }[] = [
	{ tab: "top", label: "トップ", path: "" },
	{ tab: "gifts", label: "いただきもの", path: "/gifts" },
	{ tab: "persons", label: "差出人", path: "/persons" },
	{ tab: "returns", label: "香典返し", path: "/returns" },
	{ tab: "output", label: "印刷・出力", path: "/output" },
	{ tab: "members", label: "メンバー", path: "/members" },
	{ tab: "settings", label: "設定", path: "/settings" },
];

/**
 * 香典帳の中の画面の共通枠（見出し・タブ・アーカイブ中の表示・閲覧中のメンバー・接続状態）。
 * ledger-live.js が WebSocket で変更を受け取り、[data-live] の部分を取り直す（04 §5）。
 */
export const KoudenShell: FC<{
	kouden: KoudenContext;
	caller: Caller;
	renderSeq?: number | undefined;
	tab: KoudenTab;
	wide?: boolean | undefined;
	children?: Child;
}> = ({ kouden, caller, renderSeq, tab, wide, children }) => (
	<div class={`${wide ? ui.containerWide : ui.container} space-y-6`}>
		<div
			data-connection
			hidden
			role="status"
			class="sticky top-0 z-10 rounded-lg border border-danger/40 bg-surface px-4 py-2 text-sm text-danger shadow-sm"
		>
			通信が切れています。再接続するまで保存できません。
		</div>
		<div class="space-y-3">
			<a href="/" class="text-sm text-muted hover:text-ink">
				← 香典帳一覧
			</a>
			<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<h1 class={ui.h1}>{kouden.title}</h1>
				<span class={ui.badge}>{ROLES[kouden.memberRole]}</span>
			</div>
			<p data-presence aria-live="polite" class="min-h-5 text-xs text-muted"></p>
		</div>
		<SrStatus />
		<nav aria-label="香典帳のメニュー" class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
			<ul class="flex min-w-max gap-1 border-b border-line">
				{TABS.map((t) => (
					<li>
						<a
							href={`/k/${kouden.id}${t.path}`}
							aria-current={t.tab === tab ? "page" : undefined}
							class={`block border-b-2 px-4 py-2 text-sm ${
								t.tab === tab
									? "border-accent font-medium text-ink"
									: "border-transparent text-muted hover:text-ink"
							}`}
						>
							{t.label}
						</a>
					</li>
				))}
			</ul>
		</nav>
		{kouden.status === "archived" && (
			<p class={ui.notice}>
				この香典帳はアーカイブされているため、閲覧のみできます。
				{kouden.memberRole === "owner" && (
					<>
						{" "}
						<a href={`/k/${kouden.id}/settings#archive`} class={ui.link}>
							アーカイブを解除
						</a>
					</>
				)}
			</p>
		)}
		{kouden.memberRole === "owner" && kouden.needsDeceasedNameConfirmation && (
			<aside aria-label="故人のお名前の確認" class={`${ui.notice} space-y-2`}>
				<p class="font-medium">故人のお名前をご確認ください</p>
				<p class="text-sm">
					旧アプリの香典帳の名前をもとに、故人のお名前を仮設定しています。
					{kouden.status === "archived" && "確認するには、アーカイブを解除してください。"}
				</p>
				<a
					href={`/k/${kouden.id}/settings#${kouden.status === "archived" ? "archive" : "info"}`}
					class={ui.link}
				>
					{kouden.status === "archived" ? "設定でアーカイブを解除する" : "故人のお名前を確認する"}
				</a>
			</aside>
		)}
		{children}
		<script
			src={`/assets/ledger-live.js?v=${__ASSET_VERSION__}`}
			defer
			data-kouden-id={kouden.id}
			data-user-id={caller.userId}
			data-seq={renderSeq?.toString()}
		></script>
	</div>
);

/**
 * スクリーンリーダー向けの読み上げ領域。画面を開いたときから置いておき（後から足した領域は読み上げられないことがある）、
 * htmx の応答に `<SrStatus oob>…</SrStatus>` を含めると中身だけが差し替わって読み上げられる。
 * 差出人の候補の件数・行の中で保存した結果など、フォーカスの外で変わる内容を知らせる。
 */
export const SrStatus: FC<{ oob?: boolean; children?: Child }> = ({ oob, children }) => (
	<p id="sr-status" role="status" class="sr-only" hx-swap-oob={oob ? "innerHTML" : undefined}>
		{children}
	</p>
);

/**
 * 他の人の変更で取り直す部分（04 §5）。entities の変更通知を受けると url を取り直して差し替える。
 * 中で入力中（編集フォームが開いている）の場合は取り直さず、「他の人の変更があります」を出す。
 */
export const LiveRegion: FC<{
	id: string;
	entities: readonly string[];
	url?: string | undefined;
	class?: string;
	/** htmx の応答の中で、同じ id の部分を out-of-band で差し替える（自分の操作の結果を反映する） */
	oob?: boolean;
	children?: Child;
}> = ({ id, entities, url, class: className, oob, children }) => (
	<div
		id={id}
		data-live={entities.join(",")}
		data-live-url={url}
		class={className}
		hx-swap-oob={oob ? "outerHTML" : undefined}
	>
		<p data-stale-notice hidden role="status" class={`${ui.notice} mb-3`}>
			他の人の変更があります。{" "}
			<a href="" class={ui.link}>
				再読み込み
			</a>
		</p>
		{children}
	</div>
);
