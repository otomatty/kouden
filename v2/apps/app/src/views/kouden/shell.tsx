import { ROLES } from "@kouden/domain";
import type { Child, FC } from "hono/jsx";
import type { KoudenContext } from "../../kouden/store.ts";
import { ui } from "../ui.ts";

export type KoudenTab = "top" | "reception" | "gifts" | "persons" | "settings";

const TABS: readonly { tab: KoudenTab; label: string; path: string }[] = [
	{ tab: "top", label: "トップ", path: "" },
	{ tab: "reception", label: "受付", path: "/reception" },
	{ tab: "gifts", label: "いただきもの", path: "/gifts" },
	{ tab: "persons", label: "差出人", path: "/persons" },
	{ tab: "settings", label: "設定", path: "/settings" },
];

/** 香典帳の中の画面の共通枠（見出し・タブ・アーカイブ中の表示） */
export const KoudenShell: FC<{
	kouden: KoudenContext;
	tab: KoudenTab;
	wide?: boolean;
	children?: Child;
}> = ({ kouden, tab, wide, children }) => (
	<div class={`${wide ? ui.containerWide : ui.container} space-y-6`}>
		<div class="space-y-3">
			<a href="/" class="text-sm text-muted hover:text-ink">
				← 香典帳一覧
			</a>
			<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<h1 class={ui.h1}>{kouden.title}</h1>
				<span class={ui.badge}>{ROLES[kouden.memberRole]}</span>
			</div>
		</div>
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
		{children}
	</div>
);
