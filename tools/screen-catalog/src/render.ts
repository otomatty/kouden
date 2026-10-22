import type { Screen, ScreenGroup } from "./catalog.tsx";

/** 静的ファイルのバージョン（本物は Vite が埋め込む。カタログでは CSS を相対パスに置き換えるので使わない） */
(globalThis as { __ASSET_VERSION__?: string }).__ASSET_VERSION__ = "catalog";

export interface PageLink {
	screenId: string;
	stateId: string;
}

export interface RenderedPage {
	screenId: string;
	stateId: string;
	/** dist/screens/ の中のファイル名 */
	file: string;
	html: string;
	/** 本文（main）の中のリンクの行き先。共通の枠（ヘッダー・タブ）のリンクは含めない */
	links: PageLink[];
}

export const pageFile = (screenId: string, stateId: string) => `${screenId}--${stateId}.html`;

/** 画面の中の画像（供物の写真・返礼品の画像）の代わり */
const IMAGE_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#dcdddd"/><path d="M110 140l35-45 25 30 20-22 30 37z" fill="#afafb0"/><circle cx="205" cy="75" r="12" fill="#afafb0"/></svg>',
)}`;

/** すべての画面の状態を描画し、カタログ用に加工する */
export async function renderCatalog(groups: ScreenGroup[]): Promise<RenderedPage[]> {
	const screens = groups.flatMap((g) => g.screens);
	const pages: RenderedPage[] = [];
	for (const screen of screens) {
		for (const state of screen.states) {
			const raw = (await state.render()).toString();
			const { html, links } = adapt(raw, screen, screens);
			pages.push({
				screenId: screen.id,
				stateId: state.id,
				file: pageFile(screen.id, state.id),
				html,
				links,
			});
		}
	}
	return pages;
}

/**
 * 描画した HTML を静的なカタログで見られるようにする。
 * - CSS を相対パスにし、htmx などのスクリプトを外してカタログ用の小さなスクリプトに替える
 * - アプリの中へのリンクを、対応する画面の状態のファイルに張り替える（なければ押しても何もしない）
 * - 画像はプレースホルダーにし、autofocus を外す（カタログの中で勝手にスクロールしないように）
 */
export function adapt(
	raw: string,
	screen: Screen,
	screens: Screen[],
): { html: string; links: PageLink[] } {
	const member = raw.includes('action="/logout"');
	const audience = screen.audience ?? (member ? "member" : "guest");
	let html = raw
		.replace(/<link rel="stylesheet" href="\/assets\/(app|admin)\.css\?v=[^"]*"\/?>/, (_, app) => {
			return `<link rel="stylesheet" href="../assets/${app}.css"/>`;
		})
		.replace(/<script src="\/assets\/[^"]*"[^>]*><\/script>/g, "")
		.replace(/ autofocus=""/g, "")
		.replace(/ src="\/k\/[^"]*\/files\/[^"]*"/g, ` src="${IMAGE_PLACEHOLDER}"`)
		.replace(/ src="\/k\/[^"]*\/return-items\/[^"]*"/g, ` src="${IMAGE_PLACEHOLDER}"`);

	html = html.replace(/ href="(\/(?!\/)[^"]*)"/g, (_, href: string) => {
		const target = resolveLink(decodeEntities(href), screen.app, audience, screens);
		if (!target) return ` href="${href}" data-kc-dead=""`;
		return ` href="${pageFile(target.screenId, target.stateId)}" data-kc-screen="${target.screenId}" data-kc-state="${target.stateId}"`;
	});
	html = html.replace("</body>", '<script src="../assets/bridge.js" defer></script></body>');
	return { html, links: mainLinks(html) };
}

const decodeEntities = (s: string) =>
	s.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");

/** 本文の中のリンク。共通の枠（ヘッダー・フッター・香典帳のタブ・運営者画面のメニュー）は除く */
function mainLinks(html: string): PageLink[] {
	const body = html
		.slice(html.indexOf("<body"))
		.replace(/<header[\s\S]*?<\/header>/, "")
		.replace(/<footer[\s\S]*?<\/footer>/, "")
		.replace(/<nav aria-label="(香典帳のメニュー|運営者画面のメニュー)"[\s\S]*?<\/nav>/, "");
	return [...body.matchAll(/data-kc-screen="([^"]+)" data-kc-state="([^"]+)"/g)].map((m) => ({
		screenId: m[1]!,
		stateId: m[2]!,
	}));
}

/**
 * アプリの中の URL に当たる画面と状態。パターンの区間（:name）が少ないものを優先し（/k/new と /k/:id）、
 * 同じ URL で表示が分かれる場合はリンク元のログイン状態で選ぶ。状態はクエリで選び、なければ最初の状態
 */
export function resolveLink(
	href: string,
	app: Screen["app"],
	audience: "guest" | "member",
	screens: Screen[],
): PageLink | null {
	const url = new URL(href, "https://catalog.invalid");
	const segments = url.pathname.split("/").filter(Boolean);
	let best: { screen: Screen; params: number } | null = null;
	for (const screen of screens) {
		if (screen.app !== app || !screen.path.startsWith("/")) continue;
		if (screen.audience && screen.audience !== audience) continue;
		const pattern = screen.path.split("/").filter(Boolean);
		if (pattern.length !== segments.length) continue;
		if (!pattern.every((p, i) => p.startsWith(":") || p === segments[i])) continue;
		const params = pattern.filter((p) => p.startsWith(":")).length;
		if (!best || params < best.params) best = { screen, params };
	}
	if (!best) return null;
	const state =
		best.screen.states.find(
			(s) => s.query !== undefined && matchesQuery(url.searchParams, s.query),
		) ?? best.screen.states[0];
	return state ? { screenId: best.screen.id, stateId: state.id } : null;
}

/** "tab=archived" は値まで一致、"event=" は項目があれば一致 */
function matchesQuery(params: URLSearchParams, query: string): boolean {
	return [...new URLSearchParams(query)].every(([key, value]) =>
		value === "" ? params.has(key) : params.get(key) === value,
	);
}
