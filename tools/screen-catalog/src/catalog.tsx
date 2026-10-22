import { FREE_GIFT_LIMIT, formatYen, PAID_PRICE_JPY, type Role } from "@kouden/domain";
import type { FormValues } from "@kouden/ui";
import type { Child } from "hono/jsx";
import { AdminLayout, Notice } from "../../../apps/admin/src/views/layout.tsx";
import {
	AuditPage,
	DashboardPage as AdminDashboardPage,
	KoudenPage as AdminKoudenPage,
	LegacyListPage,
	LinkPage,
	SearchPage,
	UserPage,
} from "../../../apps/admin/src/views/pages.tsx";
import type { SessionUser } from "../../../apps/app/src/auth/session-store.ts";
import type { KoudenContext } from "../../../apps/app/src/kouden/store.ts";
import { addressRows, returnRows } from "../../../apps/app/src/output/rows.ts";
import { GiftEditPage, giftFormValues } from "../../../apps/app/src/views/kouden/gift-edit.tsx";
import { GiftsPage } from "../../../apps/app/src/views/kouden/gifts.tsx";
import { MembersPage } from "../../../apps/app/src/views/kouden/members.tsx";
import { OutputPage } from "../../../apps/app/src/views/kouden/output.tsx";
import {
	PersonEditRow,
	PersonPage,
	PersonsPage,
	personFormValues,
} from "../../../apps/app/src/views/kouden/persons.tsx";
import {
	PrintAddressesPage,
	PrintGiftsPage,
	PrintReturnsPage,
} from "../../../apps/app/src/views/kouden/print.tsx";
import {
	ReceptionPage,
	type ReceptionProps,
} from "../../../apps/app/src/views/kouden/reception.tsx";
import {
	ReturnEditPage,
	returnFormValues,
} from "../../../apps/app/src/views/kouden/return-edit.tsx";
import { ReturnSettingsPage } from "../../../apps/app/src/views/kouden/return-settings.tsx";
import { ReturnsPage } from "../../../apps/app/src/views/kouden/returns.tsx";
import { SettingsPage } from "../../../apps/app/src/views/kouden/settings.tsx";
import { type KoudenTab, KoudenShell } from "../../../apps/app/src/views/kouden/shell.tsx";
import { KoudenTopPage } from "../../../apps/app/src/views/kouden/top.tsx";
import { Layout } from "../../../apps/app/src/views/layout.tsx";
import { AccountDeletedPage, AccountPage } from "../../../apps/app/src/views/pages/account.tsx";
import { DashboardPage, NewKoudenPage } from "../../../apps/app/src/views/pages/dashboard.tsx";
import { ErrorPage } from "../../../apps/app/src/views/pages/error.tsx";
import { FaqPage } from "../../../apps/app/src/views/pages/faq.tsx";
import { HomePage } from "../../../apps/app/src/views/pages/home.tsx";
import { InvitePage } from "../../../apps/app/src/views/pages/invite.tsx";
import { PrivacyPage, TermsPage, TokushohoPage } from "../../../apps/app/src/views/pages/legal.tsx";
import { LoginPage } from "../../../apps/app/src/views/pages/login.tsx";
import { PricingPage } from "../../../apps/app/src/views/pages/pricing.tsx";
import {
	adminDashboard,
	auditLogRows,
	koudenDetailFixture,
	koudenRows,
	legacyRows,
	legacyUserDetail,
	paidKoudenDetail,
	userDetailFixture,
	userRows,
} from "./admin-fixtures.ts";
import {
	ADMIN_EMAIL,
	archivedKoudens,
	base,
	callerFor,
	dashboardKoudens,
	events,
	giftById,
	giftHistory,
	gifts,
	giftsSorted,
	invitations,
	kouden,
	koudenAs,
	members,
	NOW,
	outputData,
	overviewOf,
	owner,
	personById,
	personDetail,
	personHistory,
	persons,
	proposalsOf,
	QR_PLACEHOLDER,
	relationships,
	returnDetail,
	returnHistory,
	returnItems,
	returnRules,
	returnsBoard,
	sessionUserFor,
	transfer,
} from "./fixtures.ts";

// ---- 型 -----------------------------------------------------------------------

/** 1 つの状態の描画結果（Hono JSX の要素か、加工済みの HTML） */
export type Rendered = { toString(): string } | Promise<{ toString(): string }>;

export interface ScreenState {
	id: string;
	label: string;
	/** どういうときにこの状態になるか */
	note?: string;
	/** 画面の中のリンクがこの状態を指すとみなすクエリ（例: "tab=archived"） */
	query?: string;
	render: () => Rendered;
}

export interface Screen {
	id: string;
	title: string;
	app: "app" | "admin";
	/** URL のパターン（:name は任意の 1 区間） */
	path: string;
	/** 同じ URL で表示が分かれる場合の区別（未ログインのトップと香典帳一覧） */
	audience?: "guest" | "member";
	/** 見られる人 */
	access: string;
	description: string;
	/** 対応するビューのファイル（リポジトリの直下から） */
	source: string;
	states: ScreenState[];
}

export interface ScreenGroup {
	id: string;
	title: string;
	description: string;
	screens: Screen[];
}

// ---- 描画の補助 ---------------------------------------------------------------

const page = (title: string | undefined, user: SessionUser | null, body: Child) => (
	<Layout title={title} user={user}>
		{body}
	</Layout>
);

const loginPage = (body: Child) => (
	<Layout title="ログイン" user={null} hideLoginLink>
		{body}
	</Layout>
);

async function withMenuOpen(pageHtml: Rendered): Promise<string> {
	const html = (await pageHtml).toString();
	if (!html.includes("<details data-user-menu")) throw new Error("user menu not found");
	return html.replace("<details data-user-menu", "<details open data-user-menu");
}

/** 香典帳の中の画面（共通の枠とタブを付ける）。routes/helpers.tsx の koudenPage と同じ組み立て */
const inKouden = (
	k: KoudenContext,
	title: string,
	tab: KoudenTab,
	body: Child,
	options: { wide?: boolean } = {},
) => (
	<Layout title={`${title} - ${k.title}`} user={sessionUserFor(k.memberRole)}>
		<KoudenShell kouden={k} caller={callerFor(k)} renderSeq={120} tab={tab} wide={options.wide}>
			{body}
		</KoudenShell>
	</Layout>
);

const admin = (title: string, current: string | undefined, body: Child) => (
	<AdminLayout title={title} adminEmail={ADMIN_EMAIL} current={current}>
		{body}
	</AdminLayout>
);

const asRole = (role: Role) => koudenAs({ memberRole: role });
const archived = koudenAs({ status: "archived" });
const CONFLICT_MESSAGE =
	"開いている間に他の人が更新しました。最新の内容を表示しています。もう一度入力してから保存してください。";

/** 一覧の 1 行（<tr id="…">…</tr>）を別の HTML に差し替える（htmx で行を差し替えた後の見た目） */
async function replaceRow(pageHtml: Rendered, rowId: string, rowHtml: Rendered): Promise<string> {
	const html = (await pageHtml).toString();
	const start = html.indexOf(`<tr id="${rowId}"`);
	if (start < 0) throw new Error(`row not found: ${rowId}`);
	const end = html.indexOf("</tr>", start) + "</tr>".length;
	return html.slice(0, start) + (await rowHtml).toString() + html.slice(end);
}

// ---- 受付 ---------------------------------------------------------------------

const receptionProps = (k: KoudenContext, rest: Partial<ReceptionProps> = {}): ReceptionProps => ({
	kouden: k,
	events,
	relationships,
	eventId: "ev-funeral",
	values: { kind: "koden" },
	...rest,
});

const limitMessage = (role: Role) =>
	role !== "owner" ? (
		`無料版で登録できる ${FREE_GIFT_LIMIT} 件に達しました。オーナーに有料版の購入を依頼してください。`
	) : (
		<>
			無料版で登録できる {FREE_GIFT_LIMIT} 件に達しました。{" "}
			<a href={`${base}/settings#billing`} class="font-medium underline underline-offset-4">
				有料版を購入する（{formatYen(PAID_PRICE_JPY)}）
			</a>
			と、件数の上限がなくなります。
		</>
	);

// ---- いただきもの・差出人 -----------------------------------------------------

const giftPage = (
	k: KoudenContext,
	giftId: string,
	options: Partial<Parameters<typeof GiftEditPage>[0]> = {},
) => {
	const gift = giftById(giftId);
	const canWrite = callerFor(k).role !== "viewer";
	return inKouden(
		k,
		"いただきもの",
		"gifts",
		<GiftEditPage
			kouden={k}
			gift={gift}
			events={events}
			canWrite={canWrite}
			values={giftFormValues(gift)}
			history={giftHistory}
			{...options}
		/>,
	);
};

const personPage = (
	k: KoudenContext,
	personId: string,
	options: Partial<Parameters<typeof PersonPage>[0]> = {},
) => {
	const person = options.person ?? personDetail(personId);
	return inKouden(
		k,
		person.name ?? person.organization ?? "",
		"persons",
		<PersonPage
			kouden={k}
			person={person}
			relationships={relationships}
			canWrite={callerFor(k).role !== "viewer"}
			values={personFormValues(person)}
			history={personHistory}
			{...options}
		/>,
	);
};

const personsPage = (k: KoudenContext, list = persons, q?: string) =>
	inKouden(
		k,
		"差出人",
		"persons",
		<PersonsPage kouden={k} persons={list} canWrite={callerFor(k).role !== "viewer"} q={q} />,
		{ wide: true },
	);

// ---- 香典返し -----------------------------------------------------------------

const returnsPage = (
	k: KoudenContext,
	options: { onDay?: number; notice?: string; error?: string; filter?: "all" | "pending" } = {},
	board = returnsBoard,
) =>
	inKouden(
		k,
		"香典返し",
		"returns",
		<ReturnsPage
			kouden={k}
			caller={callerFor(k)}
			board={board}
			proposals={proposalsOf(board, options.onDay)}
			filter={options.filter ?? "all"}
			onDay={options.onDay ?? 0}
			notice={options.notice}
			error={options.error}
		/>,
		{ wide: true },
	);

const returnPage = (
	k: KoudenContext,
	returnId: string,
	options: Partial<Parameters<typeof ReturnEditPage>[0]> = {},
) => {
	const ret = returnDetail(returnId);
	return inKouden(
		k,
		"香典返し",
		"returns",
		<ReturnEditPage
			kouden={k}
			caller={callerFor(k)}
			ret={ret}
			items={returnItems}
			history={returnHistory}
			dueDate={ret.koudenDueDate}
			values={returnFormValues(ret)}
			{...options}
		/>,
	);
};

// ---- メンバー・設定 -----------------------------------------------------------

const membersPage = (k: KoudenContext, options: Partial<Parameters<typeof MembersPage>[0]> = {}) =>
	inKouden(
		k,
		"メンバー",
		"members",
		<MembersPage
			kouden={k}
			userId={sessionUserFor(k.memberRole).id}
			members={members}
			invitations={k.memberRole === "owner" ? invitations : []}
			transfer={null}
			{...options}
		/>,
	);

const settingsValues = (k: KoudenContext): FormValues => ({
	title: k.title,
	deceasedName:
		k.needsDeceasedNameConfirmation && k.deceasedName === "（故人名未確認）" ? "" : k.deceasedName,
});

const settingsPage = (
	k: KoudenContext,
	options: Partial<Parameters<typeof SettingsPage>[0]> = {},
) =>
	inKouden(
		k,
		"設定",
		"settings",
		<SettingsPage
			kouden={k}
			caller={callerFor(k)}
			events={events}
			relationships={relationships}
			koudenValues={settingsValues(k)}
			purchase={null}
			{...options}
		/>,
	);

// ---- 運営者画面 ---------------------------------------------------------------

const NOTICE_GRANTED = "有料にしました。";

// ---- 画面の一覧 ---------------------------------------------------------------

export const catalog: ScreenGroup[] = [
	{
		id: "public",
		title: "公開ページ",
		description: "ログインしなくても見られるページ。ヘッダーはログイン状態で変わる。",
		screens: [
			{
				id: "home",
				title: "トップ（サービス紹介）",
				app: "app",
				path: "/",
				audience: "guest",
				access: "未ログイン",
				description: "サービスの紹介とログインへの入口。ログイン済みなら香典帳一覧になる。",
				source: "apps/app/src/views/pages/home.tsx",
				states: [
					{ id: "default", label: "通常", render: () => page(undefined, null, <HomePage />) },
				],
			},
			{
				id: "pricing",
				title: "料金",
				app: "app",
				path: "/pricing",
				access: "だれでも",
				description: "無料版と有料版の違い。",
				source: "apps/app/src/views/pages/pricing.tsx",
				states: [
					{ id: "guest", label: "未ログイン", render: () => page("料金", null, <PricingPage />) },
					{
						id: "member",
						label: "ログイン済み",
						note: "ヘッダーが表示名とログアウトに変わる",
						render: () => page("料金", owner, <PricingPage />),
					},
				],
			},
			{
				id: "faq",
				title: "よくある質問",
				app: "app",
				path: "/faq",
				access: "だれでも",
				description: "使い方・料金・データの扱いの質問と回答。",
				source: "apps/app/src/views/pages/faq.tsx",
				states: [
					{ id: "default", label: "通常", render: () => page("よくある質問", null, <FaqPage />) },
				],
			},
			{
				id: "terms",
				title: "利用規約",
				app: "app",
				path: "/terms",
				access: "だれでも",
				description: "利用規約。",
				source: "apps/app/src/views/pages/legal.tsx",
				states: [
					{ id: "default", label: "通常", render: () => page("利用規約", null, <TermsPage />) },
				],
			},
			{
				id: "privacy",
				title: "プライバシーポリシー",
				app: "app",
				path: "/privacy",
				access: "だれでも",
				description: "個人情報の取り扱い。",
				source: "apps/app/src/views/pages/legal.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () => page("プライバシーポリシー", null, <PrivacyPage />),
					},
				],
			},
			{
				id: "tokushoho",
				title: "特定商取引法に基づく表記",
				app: "app",
				path: "/legal/tokushoho",
				access: "だれでも",
				description: "販売事業者・価格・支払い方法などの表記。",
				source: "apps/app/src/views/pages/legal.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () => page("特定商取引法に基づく表記", null, <TokushohoPage />),
					},
				],
			},
		],
	},
	{
		id: "auth",
		title: "ログイン・招待",
		description: "Google ログインと、招待リンクからの参加。",
		screens: [
			{
				id: "login",
				title: "ログイン",
				app: "app",
				path: "/login",
				access: "未ログイン（ログイン済みなら戻り先へ転送）",
				description: "Google アカウントでのログイン。失敗したときは理由を上に出す。",
				source: "apps/app/src/views/pages/login.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () => loginPage(<LoginPage startUrl="/auth/google/start?return_to=%2F" />),
					},
					...(
						[
							["cancelled", "キャンセル", "Google の画面でキャンセルした"],
							["expired", "期限切れ", "ログインの途中で 10 分以上たった"],
							["failed", "失敗", "トークンの検証に失敗した"],
							["rate_limited", "回数制限", "同じ IP から短時間に何度も試みた"],
						] as const
					).map(([error, label, note]) => ({
						id: error,
						label,
						note,
						query: `error=${error}`,
						render: () =>
							loginPage(<LoginPage startUrl="/auth/google/start?return_to=%2F" error={error} />),
					})),
				],
			},
			{
				id: "invite",
				title: "招待の受諾",
				app: "app",
				path: "/invite/:token",
				access: "だれでも（参加はログイン後）",
				description:
					"招待リンクを開いたときの画面。ログインしていれば「参加する」、していなければログインへ進む。リンクが使えない場合は理由を出す。",
				source: "apps/app/src/views/pages/invite.tsx",
				states: [
					...(
						[
							["guest", "未ログイン", false],
							["member", "ログイン済み", true],
						] as const
					).map(([id, label, loggedIn]) => ({
						id,
						label,
						render: () =>
							page(
								"香典帳への招待",
								loggedIn ? editorUser() : null,
								<InvitePage
									invitation={{
										id: "inv-1",
										koudenId: kouden.id,
										koudenTitle: kouden.title,
										inviterName: owner.displayName,
										role: "editor",
										state: "valid",
									}}
									token="sample-token"
									loggedIn={loggedIn}
								/>,
							),
					})),
					...(
						[
							["revoked", "無効にされた", "オーナーがリンクを無効にした"],
							["expired", "期限切れ", "作成から 7 日を過ぎた"],
							["used_up", "回数の上限", "使用回数の上限に達した。同時に参加して上限を超えた場合も"],
							["unavailable", "受付停止", "香典帳がアーカイブ・削除中"],
						] as const
					).map(([state, label, note]) => ({
						id: state,
						label,
						note,
						render: () =>
							page(
								"香典帳への招待",
								null,
								<InvitePage
									invitation={{
										id: "inv-1",
										koudenId: kouden.id,
										koudenTitle: kouden.title,
										inviterName: owner.displayName,
										role: "viewer",
										state,
									}}
									token="sample-token"
									loggedIn={false}
								/>,
							),
					})),
					{
						id: "not-found",
						label: "見つからない",
						note: "トークンが存在しない（404）",
						render: () =>
							page(
								"香典帳への招待",
								null,
								<InvitePage invitation={null} token="x" loggedIn={false} />,
							),
					},
				],
			},
		],
	},
	{
		id: "account",
		title: "香典帳一覧・アカウント",
		description: "ログイン後の入口。香典帳の一覧・作成とアカウントの設定。",
		screens: [
			{
				id: "dashboard",
				title: "香典帳一覧",
				app: "app",
				path: "/",
				audience: "member",
				access: "ログイン済み",
				description:
					"参加している香典帳の一覧。アーカイブしたものは別のタブ。譲渡の依頼もここに出す。",
				source: "apps/app/src/views/pages/dashboard.tsx",
				states: [
					{
						id: "default",
						label: "参加中",
						render: () =>
							page("香典帳一覧", owner, <DashboardPage koudens={dashboardKoudens} tab="active" />),
					},
					{
						id: "menu",
						label: "ユーザーメニューを開いた",
						note: "ヘッダーのアバターと名前を押すと、設定・ログアウトを出す（全画面で共通）",
						render: () =>
							withMenuOpen(
								page(
									"香典帳一覧",
									owner,
									<DashboardPage koudens={dashboardKoudens} tab="active" />,
								),
							),
					},
					{
						id: "empty",
						label: "まだない",
						note: "初めてログインした直後",
						render: () => page("香典帳一覧", owner, <DashboardPage koudens={[]} tab="active" />),
					},
					{
						id: "archived",
						label: "アーカイブ",
						query: "tab=archived",
						render: () =>
							page("香典帳一覧", owner, <DashboardPage koudens={archivedKoudens} tab="archived" />),
					},
					{
						id: "archived-empty",
						label: "アーカイブ（なし）",
						render: () => page("香典帳一覧", owner, <DashboardPage koudens={[]} tab="archived" />),
					},
					{
						id: "transfer",
						label: "譲渡の依頼あり",
						note: "他のメンバーからオーナーの譲渡を依頼されている",
						render: () =>
							page(
								"香典帳一覧",
								editorUser(),
								<DashboardPage koudens={dashboardKoudens} tab="active" transfers={[transfer]} />,
							),
					},
					{
						id: "notice",
						label: "削除した後",
						note: "?notice=deleted（ほかに left・legacy_missing）",
						query: "notice=deleted",
						render: () =>
							page(
								"香典帳一覧",
								owner,
								<DashboardPage
									koudens={dashboardKoudens.slice(1)}
									tab="active"
									notice="香典帳を削除しました。"
								/>,
							),
					},
				],
			},
			{
				id: "new-kouden",
				title: "香典帳の作成",
				app: "app",
				path: "/k/new",
				access: "ログイン済み",
				description: "故人のお名前と香典帳の名前を入れて作成する。",
				source: "apps/app/src/views/pages/dashboard.tsx",
				states: [
					{
						id: "default",
						label: "初期表示",
						render: () => page("新しい香典帳", owner, <NewKoudenPage values={{}} />),
					},
					{
						id: "invalid",
						label: "入力エラー",
						note: "故人のお名前が空のまま送信した（422）",
						render: () =>
							page(
								"新しい香典帳",
								owner,
								<NewKoudenPage
									values={{ title: "山田家" }}
									errors={{ deceasedName: "故人のお名前を入力してください" }}
								/>,
							),
					},
				],
			},
			{
				id: "account",
				title: "アカウント",
				app: "app",
				path: "/account",
				access: "ログイン済み",
				description: "表示名の変更・すべての端末からのログアウト・アカウントの削除。",
				source: "apps/app/src/views/pages/account.tsx",
				states: [
					{
						id: "default",
						label: "通常（オーナーの香典帳あり）",
						render: () =>
							page(
								"アカウント",
								owner,
								<AccountPage
									user={owner}
									owned={[
										{
											id: kouden.id,
											title: kouden.title,
											status: "active",
											transferPending: false,
										},
										{
											id: "k-old",
											title: "故 山田 キヨ 様（七回忌）",
											status: "archived",
											transferPending: true,
										},
									]}
									values={{ displayName: owner.displayName }}
								/>,
							),
					},
					{
						id: "deletable",
						label: "削除できる",
						note: "オーナーである香典帳がない",
						render: () =>
							page(
								"アカウント",
								editorUser(),
								<AccountPage
									user={editorUser()}
									owned={[]}
									values={{ displayName: editorUser().displayName }}
								/>,
							),
					},
					{
						id: "saved",
						label: "保存した後",
						query: "notice=saved",
						render: () =>
							page(
								"アカウント",
								owner,
								<AccountPage
									user={owner}
									owned={[]}
									values={{ displayName: owner.displayName }}
									notice="表示名を保存しました。"
								/>,
							),
					},
					{
						id: "invalid",
						label: "入力エラー",
						render: () =>
							page(
								"アカウント",
								owner,
								<AccountPage
									user={owner}
									owned={[]}
									values={{ displayName: "" }}
									errors={{ displayName: "表示名を入力してください" }}
								/>,
							),
					},
					{
						id: "delete-error",
						label: "削除できなかった",
						note: "確認のチェックがない、またはオーナーの香典帳が残っている",
						render: () =>
							page(
								"アカウント",
								editorUser(),
								<AccountPage
									user={editorUser()}
									owned={[]}
									values={{ displayName: editorUser().displayName }}
									deleteError="確認の欄にチェックを入れてください"
								/>,
							),
					},
				],
			},
			{
				id: "account-deleted",
				title: "アカウントの削除完了",
				app: "app",
				path: "/account/delete",
				access: "削除した直後のみ",
				description: "アカウントを削除した後の画面（POST の応答）。",
				source: "apps/app/src/views/pages/account.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () => page("アカウントを削除しました", null, <AccountDeletedPage />),
					},
				],
			},
		],
	},
	{
		id: "kouden",
		title: "香典帳",
		description:
			"1 冊の香典帳の中の画面。共通の枠（香典帳の名前・ロール・タブ）の中に表示する。ロールで操作できる範囲が変わる（オーナー > 編集者 > 閲覧者）。",
		screens: [
			{
				id: "kouden-top",
				title: "トップ（集計）",
				app: "app",
				path: "/k/:id",
				access: "メンバー全員",
				description:
					"合計・行事別・種別・関係別の集計と最近の登録。他の人の変更で自動的に取り直す。",
				source: "apps/app/src/views/kouden/top.tsx",
				states: [
					{
						id: "default",
						label: "通常（無料版・オーナー）",
						render: () =>
							inKouden(
								kouden,
								"トップ",
								"top",
								<KoudenTopPage
									kouden={kouden}
									caller={callerFor(kouden)}
									overview={overviewOf(gifts)}
								/>,
							),
					},
					{
						id: "empty",
						label: "作成直後",
						note: "まだ何も登録していない",
						render: () =>
							inKouden(
								kouden,
								"トップ",
								"top",
								<KoudenTopPage
									kouden={kouden}
									caller={callerFor(kouden)}
									overview={overviewOf([])}
								/>,
							),
					},
					{
						id: "paid",
						label: "有料版",
						note: "残り件数の案内が消える",
						render: () => {
							const k = koudenAs({ plan: "paid" });
							return inKouden(
								k,
								"トップ",
								"top",
								<KoudenTopPage kouden={k} caller={callerFor(k)} overview={overviewOf(gifts)} />,
							);
						},
					},
					{
						id: "viewer",
						label: "閲覧者",
						note: "「受付を始める」が出ない",
						render: () => {
							const k = asRole("viewer");
							return inKouden(
								k,
								"トップ",
								"top",
								<KoudenTopPage kouden={k} caller={callerFor(k)} overview={overviewOf(gifts)} />,
							);
						},
					},
					{
						id: "archived",
						label: "アーカイブ中",
						note: "全員が閲覧のみ。オーナーには解除への案内",
						render: () =>
							inKouden(
								archived,
								"トップ",
								"top",
								<KoudenTopPage
									kouden={archived}
									caller={callerFor(archived)}
									overview={overviewOf(gifts)}
								/>,
							),
					},
					{
						id: "legacy-name",
						label: "故人名の確認待ち",
						note: "旧アプリから移行し、仮の故人名のまま（オーナーにだけ出す）",
						render: () => {
							const k = koudenAs({
								title: "山田家 葬儀",
								deceasedName: "（故人名未確認）",
								needsDeceasedNameConfirmation: true,
							});
							return inKouden(
								k,
								"トップ",
								"top",
								<KoudenTopPage kouden={k} caller={callerFor(k)} overview={overviewOf(gifts)} />,
							);
						},
					},
				],
			},
			{
				id: "reception",
				title: "受付",
				app: "app",
				path: "/k/:id/reception",
				access: "オーナー・編集者",
				description:
					"葬儀の受付でスマホから 1 件ずつ登録する。登録すると受付番号を大きく表示し、次の入力に戻る（htmx で部分更新）。",
				source: "apps/app/src/views/kouden/reception.tsx",
				states: [
					{
						id: "default",
						label: "初期表示",
						render: () =>
							inKouden(kouden, "受付", "reception", <ReceptionPage {...receptionProps(kouden)} />),
					},
					{
						id: "done",
						label: "登録した直後",
						note: "受付番号を大きく出す",
						render: () =>
							inKouden(
								kouden,
								"受付",
								"reception",
								<ReceptionPage
									{...receptionProps(kouden, {
										done: {
											giftId: "g-14",
											receiptNo: 8,
											eventName: "告別式",
											personLabel: "中村 洋子",
											kind: "koden",
											amount: 5_000,
										},
									})}
								/>,
							),
					},
					{
						id: "candidates",
						label: "同じ人の候補",
						note: "氏名を入れると、登録済みの差出人を候補に出す",
						render: () =>
							inKouden(
								kouden,
								"受付",
								"reception",
								<ReceptionPage
									{...receptionProps(kouden, {
										values: { kind: "koden", name: "山田", amount: "10000" },
										candidates: [personById("p-ichiro"), personById("p-kazuko")],
									})}
								/>,
							),
					},
					{
						id: "invalid",
						label: "入力エラー",
						note: "香典なのに金額がない（422）。詳細の中のエラーなら詳細を開く",
						render: () =>
							inKouden(
								kouden,
								"受付",
								"reception",
								<ReceptionPage
									{...receptionProps(kouden, {
										values: { kind: "koden", name: "", postalCode: "123" },
										errors: {
											name: "氏名か団体名を入力してください",
											amount: "香典は金額を入力してください",
											postalCode: "郵便番号は 7 桁の数字で入力してください",
										},
									})}
								/>,
							),
					},
					{
						id: "limit-owner",
						label: "上限（オーナー）",
						note: `無料版の ${FREE_GIFT_LIMIT} 件に達した。オーナーには購入への案内`,
						render: () =>
							inKouden(
								kouden,
								"受付",
								"reception",
								<ReceptionPage
									{...receptionProps(kouden, {
										values: { kind: "koden", name: "加藤 修", amount: "3000" },
										message: limitMessage("owner"),
									})}
								/>,
							),
					},
					{
						id: "limit-editor",
						label: "上限（編集者）",
						render: () => {
							const k = asRole("editor");
							return inKouden(
								k,
								"受付",
								"reception",
								<ReceptionPage
									{...receptionProps(k, {
										values: { kind: "koden", name: "加藤 修", amount: "3000" },
										message: limitMessage("editor"),
									})}
								/>,
							);
						},
					},
					{
						id: "viewer",
						label: "閲覧者（403）",
						note: "閲覧者は受付を開けない",
						render: () => page("この操作はできません", viewerUser(), <ErrorPage status={403} />),
					},
				],
			},
			{
				id: "gifts",
				title: "いただきもの一覧",
				app: "app",
				path: "/k/:id/gifts",
				access: "メンバー全員",
				description: "香典・供物・供花・弔電の一覧。行事・種別・関係・金額・文字で絞り込む。",
				source: "apps/app/src/views/kouden/gifts.tsx",
				states: [
					{
						id: "default",
						label: "すべて",
						render: () =>
							inKouden(
								kouden,
								"いただきもの",
								"gifts",
								<GiftsPage
									kouden={kouden}
									gifts={giftsSorted}
									events={events}
									relationships={relationships}
									filter={{}}
								/>,
								{ wide: true },
							),
					},
					{
						id: "filtered",
						label: "絞り込み",
						note: "行事・種別などで絞り込んだ（?event=…）",
						query: "event=",
						render: () =>
							inKouden(
								kouden,
								"いただきもの",
								"gifts",
								<GiftsPage
									kouden={kouden}
									gifts={giftsSorted.filter((g) => g.eventId === "ev-wake")}
									events={events}
									relationships={relationships}
									filter={{ eventId: "ev-wake" }}
								/>,
								{ wide: true },
							),
					},
					{
						id: "no-match",
						label: "該当なし",
						render: () =>
							inKouden(
								kouden,
								"いただきもの",
								"gifts",
								<GiftsPage
									kouden={kouden}
									gifts={[]}
									events={events}
									relationships={relationships}
									filter={{ q: "佐々木", minAmount: 100_000 }}
								/>,
								{ wide: true },
							),
					},
					{
						id: "empty",
						label: "まだない",
						render: () =>
							inKouden(
								kouden,
								"いただきもの",
								"gifts",
								<GiftsPage
									kouden={kouden}
									gifts={[]}
									events={events}
									relationships={relationships}
									filter={{}}
								/>,
								{ wide: true },
							),
					},
					{
						id: "deleted",
						label: "削除した後",
						query: "notice=deleted",
						render: () =>
							inKouden(
								kouden,
								"いただきもの",
								"gifts",
								<GiftsPage
									kouden={kouden}
									gifts={giftsSorted.slice(1)}
									events={events}
									relationships={relationships}
									filter={{}}
									notice="削除しました。"
								/>,
								{ wide: true },
							),
					},
				],
			},
			{
				id: "gift",
				title: "いただきものの詳細・編集",
				app: "app",
				path: "/k/:id/gifts/:giftId",
				access: "メンバー全員（編集はオーナー・編集者）",
				description:
					"1 件の内容の編集・差出人（連名）の追加と負担額・削除・変更履歴。開いている間に他の人が更新すると、保存時に違いを示す。",
				source: "apps/app/src/views/kouden/gift-edit.tsx",
				states: [
					{ id: "default", label: "編集（連名）", render: () => giftPage(kouden, "g-08") },
					{ id: "single", label: "編集（1 人）", render: () => giftPage(kouden, "g-02") },
					{
						id: "choden",
						label: "弔電",
						render: () => giftPage(kouden, "g-11"),
					},
					{
						id: "photos",
						label: "供物の写真あり",
						note: "旧アプリから移行した写真",
						render: () => {
							const gift = {
								...giftById("g-12"),
								photos: [{ id: "ph-1", caption: "祭壇の左に設置" }],
							};
							return inKouden(
								kouden,
								"いただきもの",
								"gifts",
								<GiftEditPage
									kouden={kouden}
									gift={gift}
									events={events}
									canWrite
									values={giftFormValues(gift)}
									history={giftHistory}
								/>,
							);
						},
					},
					{
						id: "saved",
						label: "保存した後",
						query: "notice=saved",
						render: () => giftPage(kouden, "g-08", { notice: "保存しました。" }),
					},
					{
						id: "invalid",
						label: "入力エラー",
						render: () =>
							giftPage(kouden, "g-02", {
								values: { ...giftFormValues(giftById("g-02")), amount: "1万" },
								errors: { amount: "金額は数字で入力してください" },
							}),
					},
					{
						id: "conflict",
						label: "保存時の競合",
						note: "開いている間に他の人が更新した（409）。自分の入力と最新の内容を並べる",
						render: () =>
							giftPage(kouden, "g-02", {
								values: {
									...giftFormValues(giftById("g-02")),
									amount: "15000",
									notes: "受付で訂正",
								},
								conflictLatest: { ...giftFormValues(giftById("g-02")), amount: "12000" },
							}),
					},
					{
						id: "add-candidates",
						label: "差出人の追加（候補）",
						note: "連名の差出人を追加するとき、登録済みの人を候補に出す",
						render: () =>
							giftPage(kouden, "g-02", {
								contributorValues: { name: "高" },
								contributorCandidates: [personById("p-takahashi")],
							}),
					},
					{
						id: "viewer",
						label: "閲覧者",
						note: "内容だけを表示する",
						render: () => giftPage(asRole("viewer"), "g-08"),
					},
				],
			},
			{
				id: "persons",
				title: "差出人一覧",
				app: "app",
				path: "/k/:id/persons",
				access: "メンバー全員（編集はオーナー・編集者）",
				description:
					"差出人（香典をくださった方）の一覧。PC では行をその場で編集し、Enter で保存すると次の人に進む。",
				source: "apps/app/src/views/kouden/persons.tsx",
				states: [
					{ id: "default", label: "一覧", render: () => personsPage(kouden) },
					{
						id: "empty",
						label: "まだない",
						note: "まだ何も登録していない",
						render: () => personsPage(kouden, []),
					},
					{
						id: "no-match",
						label: "検索に一致しない",
						render: () => personsPage(kouden, [], "佐々木"),
					},
					{
						id: "row-edit",
						label: "行の編集中",
						note: "「編集」を押した行が入力欄になる",
						render: () =>
							replaceRow(
								personsPage(kouden),
								"person-p-ito",
								<PersonEditRow
									kouden={kouden}
									person={personById("p-ito")}
									relationships={relationships}
									values={personFormValues(personById("p-ito"))}
									q={undefined}
									hasNext
								/>,
							),
					},
					{
						id: "row-invalid",
						label: "行の入力エラー",
						render: () =>
							replaceRow(
								personsPage(kouden),
								"person-p-ito",
								<PersonEditRow
									kouden={kouden}
									person={personById("p-ito")}
									relationships={relationships}
									values={{ ...personFormValues(personById("p-ito")), postalCode: "12-34" }}
									errors={{ postalCode: "郵便番号は 7 桁の数字で入力してください" }}
									q={undefined}
									hasNext
								/>,
							),
					},
					{
						id: "search",
						label: "検索",
						query: "q=",
						render: () =>
							personsPage(
								kouden,
								persons.filter((p) => p.relationshipId === "rel-work"),
								"みどり商事",
							),
					},
					{
						id: "viewer",
						label: "閲覧者",
						note: "「編集」が出ない",
						render: () => personsPage(asRole("viewer")),
					},
				],
			},
			{
				id: "person",
				title: "差出人の詳細・編集",
				app: "app",
				path: "/k/:id/persons/:personId",
				access: "メンバー全員（編集はオーナー・編集者）",
				description: "連絡先の編集・いただきもの・香典返しの状況・変更履歴。",
				source: "apps/app/src/views/kouden/persons.tsx",
				states: [
					{
						id: "default",
						label: "通常（香典返し未作成）",
						render: () =>
							personPage(kouden, "p-takahashi", { person: personDetail("p-takahashi") }),
					},
					{
						id: "with-return",
						label: "香典返し作成済み",
						render: () =>
							personPage(kouden, "p-watanabe", {
								person: personDetail("p-watanabe", { id: "r-watanabe", status: "arranged" }),
							}),
					},
					{
						id: "organization",
						label: "団体",
						note: "氏名がなく団体名だけの差出人",
						render: () => personPage(kouden, "p-midori"),
					},
					{
						id: "invalid",
						label: "入力エラー",
						render: () =>
							personPage(kouden, "p-takahashi", {
								values: { ...personFormValues(personById("p-takahashi")), phone: "abc" },
								errors: { phone: "電話番号は数字とハイフンで入力してください" },
							}),
					},
					{
						id: "conflict",
						label: "保存時の競合",
						render: () =>
							personPage(kouden, "p-takahashi", {
								values: {
									...personFormValues(personById("p-takahashi")),
									address: "東京都武蔵野市吉祥寺本町2-4-6 グリーンハイツ305",
								},
								conflictLatest: {
									...personFormValues(personById("p-takahashi")),
									phone: "090-3333-4444",
								},
							}),
					},
					{
						id: "viewer",
						label: "閲覧者",
						render: () => personPage(asRole("viewer"), "p-takahashi"),
					},
				],
			},
			{
				id: "returns",
				title: "香典返し",
				app: "app",
				path: "/k/:id/returns",
				access: "メンバー全員（作成・確定はオーナー・編集者）",
				description:
					"金額帯ルールとカタログからの一括提案と、差出人ごとの対応状況の一覧。期限は四十九日の日付。",
				source: "apps/app/src/views/kouden/returns.tsx",
				states: [
					{ id: "default", label: "提案と一覧", render: () => returnsPage(kouden) },
					{
						id: "empty",
						label: "まだない",
						note: "いただきものがまだない",
						render: () => returnsPage(kouden, {}, { ...returnsBoard, rows: [] }),
					},
					{
						id: "on-day",
						label: "当日返しを差し引く",
						note: "当日返しの額を入れると目安額を差し引いて提案し直す",
						query: "onDay=",
						render: () => returnsPage(kouden, { onDay: 2_500 }),
					},
					{
						id: "confirmed",
						label: "一括確定の後",
						query: "notice=confirmed",
						render: () =>
							returnsPage(
								kouden,
								{ notice: "5 件の香典返しを作成しました。（1 件は作成済みのため飛ばしました）" },
								{
									...returnsBoard,
									rows: returnsBoard.rows.map((r) => ({
										...r,
										ret: r.ret ?? {
											...returnDetail("r-takahashi"),
											id: `r-${r.person.id}`,
											personId: r.person.id,
										},
									})),
								},
							),
					},
					{
						id: "on-day-invalid",
						label: "当日返しの額のエラー",
						render: () =>
							returnsPage(kouden, {
								error: "当日返しの額は 0〜99,999,999 の数字で入力してください",
							}),
					},
					{
						id: "no-due",
						label: "期限が未設定",
						note: "四十九日の日付が入っていない",
						render: () =>
							returnsPage(kouden, {}, { ...returnsBoard, dueDate: null, dueEventName: null }),
					},
					{
						id: "viewer",
						label: "閲覧者",
						note: "提案が出ない",
						render: () => returnsPage(asRole("viewer")),
					},
				],
			},
			{
				id: "return-settings",
				title: "カタログ・金額帯ルール",
				app: "app",
				path: "/k/:id/returns/settings",
				access: "メンバー全員（編集はオーナー・編集者）",
				description: "返礼品のカタログ（画像つき）と、いただいた額に応じた目安率・推奨品のルール。",
				source: "apps/app/src/views/kouden/return-settings.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () =>
							inKouden(
								kouden,
								"香典返しの設定",
								"returns",
								<ReturnSettingsPage
									kouden={kouden}
									caller={callerFor(kouden)}
									items={returnItems}
									rules={returnRules}
								/>,
							),
					},
					{
						id: "empty",
						label: "まだない",
						render: () =>
							inKouden(
								kouden,
								"香典返しの設定",
								"returns",
								<ReturnSettingsPage
									kouden={kouden}
									caller={callerFor(kouden)}
									items={[]}
									rules={[]}
								/>,
							),
					},
					{
						id: "error",
						label: "エラー",
						note: "競合（409）や業務ルールの違反（422）はページの上に出す",
						render: () =>
							inKouden(
								kouden,
								"香典返しの設定",
								"returns",
								<ReturnSettingsPage
									kouden={kouden}
									caller={callerFor(kouden)}
									items={returnItems}
									rules={returnRules}
									error={CONFLICT_MESSAGE}
								/>,
							),
					},
					{
						id: "viewer",
						label: "閲覧者",
						render: () => {
							const k = asRole("viewer");
							return inKouden(
								k,
								"香典返しの設定",
								"returns",
								<ReturnSettingsPage
									kouden={k}
									caller={callerFor(k)}
									items={returnItems}
									rules={returnRules}
								/>,
							);
						},
					},
				],
			},
			{
				id: "return",
				title: "香典返しの詳細",
				app: "app",
				path: "/k/:id/returns/:returnId",
				access: "メンバー全員（編集はオーナー・編集者）",
				description: "1 人分の香典返し。品（明細）・状況・渡し方・送付先・変更履歴。",
				source: "apps/app/src/views/kouden/return-edit.tsx",
				states: [
					{
						id: "default",
						label: "手配済み（明細 2 件）",
						render: () => returnPage(kouden, "r-watanabe"),
					},
					{ id: "pending", label: "未対応", render: () => returnPage(kouden, "r-takahashi") },
					{
						id: "no-lines",
						label: "明細なし",
						note: "当日返しで済んだ",
						render: () => returnPage(kouden, "r-ito"),
					},
					{
						id: "conflict",
						label: "保存時の競合",
						render: () => {
							const latest = returnFormValues(returnDetail("r-watanabe"));
							return returnPage(kouden, "r-watanabe", {
								values: { ...latest, status: "shipped", shippedAt: "2026-10-22" },
								conflictLatest: { ...latest, notes: "到着日の指定あり（10/25）" },
							});
						},
					},
					{
						id: "invalid",
						label: "入力エラー",
						render: () =>
							returnPage(kouden, "r-watanabe", {
								values: { ...returnFormValues(returnDetail("r-watanabe")), shipPostalCode: "1000" },
								errors: { shipPostalCode: "郵便番号は 7 桁の数字で入力してください" },
							}),
					},
					{
						id: "viewer",
						label: "閲覧者",
						render: () => returnPage(asRole("viewer"), "r-watanabe"),
					},
				],
			},
			{
				id: "output",
				title: "印刷・出力",
				app: "app",
				path: "/k/:id/output",
				access: "メンバー全員",
				description: "芳名一覧・香典返しの一覧・宛名一覧の印刷と、Excel のダウンロード。",
				source: "apps/app/src/views/kouden/output.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () =>
							inKouden(
								kouden,
								"印刷・出力",
								"output",
								<OutputPage kouden={kouden} events={events} />,
							),
					},
					{
						id: "empty",
						label: "まだない",
						note: "いただきものがまだない",
						render: () =>
							inKouden(
								kouden,
								"印刷・出力",
								"output",
								<OutputPage kouden={kouden} events={events.map((e) => ({ ...e, giftCount: 0 }))} />,
							),
					},
				],
			},
			{
				id: "members",
				title: "メンバー",
				app: "app",
				path: "/k/:id/members",
				access: "メンバー全員（管理はオーナー）",
				description:
					"メンバーとロール・招待リンク（QR コード）・オーナーの譲渡・香典返しの期限のお知らせメール。",
				source: "apps/app/src/views/kouden/members.tsx",
				states: [
					{ id: "default", label: "オーナー", render: () => membersPage(kouden) },
					{
						id: "new-invite",
						label: "招待リンクを作った直後",
						note: "リンクと QR コードはこのときだけ表示できる",
						render: () =>
							membersPage(kouden, {
								newInvite: {
									url: "https://kouden.app/invite/9fJx2kQe7LmN4pRs",
									qr: QR_PLACEHOLDER,
									role: "editor",
								},
							}),
					},
					{
						id: "transfer-out",
						label: "譲渡の承諾待ち",
						note: "オーナーが譲渡を申し出た",
						render: () => membersPage(kouden, { transfer }),
					},
					{
						id: "transfer-in",
						label: "譲渡の依頼を受けた",
						note: "譲渡先のメンバーが見る",
						render: () => membersPage(asRole("editor"), { transfer }),
					},
					{ id: "editor", label: "編集者", render: () => membersPage(asRole("editor")) },
					{ id: "viewer", label: "閲覧者", render: () => membersPage(asRole("viewer")) },
					{ id: "archived", label: "アーカイブ中", render: () => membersPage(archived) },
					{
						id: "error",
						label: "エラー",
						render: () =>
							membersPage(kouden, { error: "使用回数の上限は 1〜1000 の数字で入力してください" }),
					},
				],
			},
			{
				id: "settings",
				title: "設定",
				app: "app",
				path: "/k/:id/settings",
				access: "メンバー全員（変更はオーナー・編集者）",
				description:
					"香典帳の名前と故人のお名前・有料版の購入・行事・関係・アーカイブと削除（オーナーのみ）。",
				source: "apps/app/src/views/kouden/settings.tsx",
				states: [
					{ id: "default", label: "オーナー（無料版）", render: () => settingsPage(kouden) },
					{
						id: "paid",
						label: "有料版",
						render: () =>
							settingsPage(koudenAs({ plan: "paid" }), {
								purchase: {
									id: "pur-2",
									amount: PAID_PRICE_JPY,
									source: "stripe",
									status: "paid",
									createdAt: NOW.toISOString(),
									buyerName: owner.displayName,
								},
							}),
					},
					{
						id: "legacy-name",
						label: "故人名の確認",
						note: "旧アプリから移行した香典帳",
						render: () =>
							settingsPage(
								koudenAs({
									title: "山田家 葬儀",
									deceasedName: "（故人名未確認）",
									needsDeceasedNameConfirmation: true,
								}),
							),
					},
					{
						id: "saved",
						label: "保存した後",
						query: "notice=saved",
						render: () => settingsPage(kouden, { notice: "保存しました。" }),
					},
					{
						id: "invalid",
						label: "入力エラー",
						render: () =>
							settingsPage(kouden, {
								koudenValues: { title: "", deceasedName: "山田 太郎" },
								koudenErrors: { title: "香典帳の名前を入力してください" },
							}),
					},
					{
						id: "delete-error",
						label: "削除の確認エラー",
						render: () => settingsPage(kouden, { deleteError: "香典帳の名前が一致しません" }),
					},
					{ id: "editor", label: "編集者", render: () => settingsPage(asRole("editor")) },
					{ id: "viewer", label: "閲覧者", render: () => settingsPage(asRole("viewer")) },
					{ id: "archived", label: "アーカイブ中", render: () => settingsPage(archived) },
				],
			},
		],
	},
	{
		id: "print",
		title: "印刷用ページ",
		description: "アプリの枠を付けず A4 に収める。画面で見たときだけ「戻る」と「印刷する」を出す。",
		screens: [
			{
				id: "print-gifts",
				title: "芳名一覧",
				app: "app",
				path: "/k/:id/print/gifts",
				access: "メンバー全員",
				description: "行事ごとのいただきものの一覧。",
				source: "apps/app/src/views/kouden/print.tsx",
				states: [
					{
						id: "default",
						label: "すべての行事",
						render: () => <PrintGiftsPage kouden={kouden} data={outputData} printedAt={NOW} />,
					},
					{
						id: "event",
						label: "1 つの行事",
						query: "event=",
						render: () => (
							<PrintGiftsPage kouden={kouden} data={outputData} eventId="ev-wake" printedAt={NOW} />
						),
					},
				],
			},
			{
				id: "print-returns",
				title: "香典返しの一覧",
				app: "app",
				path: "/k/:id/print/returns",
				access: "メンバー全員",
				description: "差出人ごとの香典返しの状況。状況で絞り込める。",
				source: "apps/app/src/views/kouden/print.tsx",
				states: [
					{
						id: "default",
						label: "すべて",
						render: () => (
							<PrintReturnsPage kouden={kouden} rows={returnRows(outputData)} printedAt={NOW} />
						),
					},
					{
						id: "none",
						label: "未作成のみ",
						query: "status=none",
						render: () => (
							<PrintReturnsPage
								kouden={kouden}
								rows={returnRows(outputData).filter((r) => !r.ret)}
								filterLabel="未作成"
								printedAt={NOW}
							/>
						),
					},
				],
			},
			{
				id: "print-addresses",
				title: "宛名一覧",
				app: "app",
				path: "/k/:id/print/addresses",
				access: "メンバー全員",
				description: "住所のある差出人の宛名。香典返しの送付先があればそちらを使う。",
				source: "apps/app/src/views/kouden/print.tsx",
				states: [
					{
						id: "default",
						label: "すべて",
						render: () => {
							const { rows, withoutAddress } = addressRows(outputData);
							return (
								<PrintAddressesPage
									kouden={kouden}
									rows={rows}
									withoutAddress={withoutAddress}
									shippingOnly={false}
									printedAt={NOW}
								/>
							);
						},
					},
					{
						id: "shipping",
						label: "配送する方のみ",
						query: "only=shipping",
						render: () => {
							const shipping = new Set(
								outputData.returns.filter((r) => r.method === "shipping").map((r) => r.personId),
							);
							const { rows, withoutAddress } = addressRows({
								...outputData,
								persons: outputData.persons.filter((p) => shipping.has(p.id)),
							});
							return (
								<PrintAddressesPage
									kouden={kouden}
									rows={rows}
									withoutAddress={withoutAddress}
									shippingOnly
									printedAt={NOW}
								/>
							);
						},
					},
				],
			},
		],
	},
	{
		id: "errors",
		title: "エラー",
		description: "共通のエラー画面。htmx の要求に対しては画面を返さない。",
		screens: (
			[
				[403, "権限がない", "閲覧者が編集しようとした・アーカイブ中"],
				[404, "見つからない", "存在しない URL・メンバーでない香典帳"],
				[410, "旧アプリの招待リンク", "旧アプリの招待 URL を開いた"],
				[429, "操作が多すぎる", "書き込み・招待の受諾の回数制限"],
				[500, "サーバーエラー", "予期しないエラー。問い合わせ用の番号を出す"],
			] as const
		).map(([status, title, note]): Screen => ({
			id: `error-${status}`,
			title: `${status} ${title}`,
			app: "app",
			path: `（${status}）`,
			access: "—",
			description: note,
			source: "apps/app/src/views/pages/error.tsx",
			states: [
				{
					id: "default",
					label: "通常",
					render: () =>
						page(
							title,
							status === 500 ? null : owner,
							<ErrorPage status={status} requestId="8d3f1c2b9a7e4f60-NRT" />,
						),
				},
			],
		})),
	},
	{
		id: "admin",
		title: "運営者画面",
		description:
			"運営者だけが使う別の Worker（admin.kouden.app）。Cloudflare Access の背後にあり、香典帳の中身（差出人の個人情報）は表示しない。",
		screens: [
			{
				id: "admin-dashboard",
				title: "ダッシュボード",
				app: "admin",
				path: "/",
				access: "運営者",
				description: "利用者数・香典帳・売上と、月ごとの推移。",
				source: "apps/admin/src/views/pages.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () =>
							admin("ダッシュボード", "/", <AdminDashboardPage data={adminDashboard} />),
					},
					{
						id: "menu",
						label: "ユーザーメニューを開いた",
						note: "運営者画面は設定の画面がないので、ログアウトだけ",
						render: () =>
							withMenuOpen(
								admin("ダッシュボード", "/", <AdminDashboardPage data={adminDashboard} />),
							),
					},
				],
			},
			{
				id: "admin-search",
				title: "検索",
				app: "admin",
				path: "/search",
				access: "運営者",
				description: "ユーザー（メール・表示名・ID）と香典帳（名前・ID）を検索する。",
				source: "apps/admin/src/views/pages.tsx",
				states: [
					{
						id: "default",
						label: "初期表示",
						render: () => admin("検索", "/search", <SearchPage q="" users={[]} koudens={[]} />),
					},
					{
						id: "results",
						label: "検索結果",
						query: "q=",
						render: () =>
							admin(
								"検索",
								"/search",
								<SearchPage q="山田" users={userRows} koudens={koudenRows} />,
							),
					},
					{
						id: "no-results",
						label: "該当なし",
						render: () => admin("検索", "/search", <SearchPage q="zzz" users={[]} koudens={[]} />),
					},
				],
			},
			{
				id: "admin-user",
				title: "ユーザーの詳細",
				app: "admin",
				path: "/users/:id",
				access: "運営者",
				description: "参加している香典帳・購入・旧アカウントとの紐づけ。",
				source: "apps/admin/src/views/pages.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () =>
							admin(
								userDetailFixture.displayName,
								undefined,
								<UserPage user={userDetailFixture} />,
							),
					},
					{
						id: "legacy",
						label: "旧アカウント（未ログイン）",
						render: () =>
							admin(legacyUserDetail.displayName, undefined, <UserPage user={legacyUserDetail} />),
					},
				],
			},
			{
				id: "admin-kouden",
				title: "香典帳の詳細",
				app: "admin",
				path: "/koudens/:id",
				access: "運営者",
				description:
					"メンバー・統計・購入。手動で有料にする・購入を取り消す（理由を監査ログに残す）。",
				source: "apps/admin/src/views/pages.tsx",
				states: [
					{
						id: "default",
						label: "無料版",
						render: () =>
							admin(
								koudenDetailFixture.title,
								undefined,
								<AdminKoudenPage kouden={koudenDetailFixture}>
									<Notice />
								</AdminKoudenPage>,
							),
					},
					{
						id: "paid",
						label: "有料版（購入あり）",
						render: () =>
							admin(
								paidKoudenDetail.title,
								undefined,
								<AdminKoudenPage kouden={paidKoudenDetail}>
									<Notice />
								</AdminKoudenPage>,
							),
					},
					{
						id: "granted",
						label: "有料にした後",
						query: "notice=granted",
						render: () =>
							admin(
								koudenDetailFixture.title,
								undefined,
								<AdminKoudenPage kouden={{ ...koudenDetailFixture, plan: "paid" }}>
									<Notice notice={NOTICE_GRANTED} />
								</AdminKoudenPage>,
							),
					},
					{
						id: "error",
						label: "理由が空",
						query: "error=reason",
						render: () =>
							admin(
								koudenDetailFixture.title,
								undefined,
								<AdminKoudenPage kouden={koudenDetailFixture}>
									<Notice error="理由を入力してください。" />
								</AdminKoudenPage>,
							),
					},
				],
			},
			{
				id: "admin-legacy",
				title: "旧ユーザーの紐づけ",
				app: "admin",
				path: "/legacy",
				access: "運営者",
				description:
					"旧アプリのメールアドレスでログインしていた人を、新しい Google アカウントに紐づける。",
				source: "apps/admin/src/views/pages.tsx",
				states: [
					{
						id: "default",
						label: "未紐づけのみ",
						render: () =>
							admin(
								"旧ユーザーの紐づけ",
								"/legacy",
								<LegacyListPage
									q=""
									unlinkedOnly
									rows={legacyRows.filter((r) => !r.linkedUserId)}
								/>,
							),
					},
					{
						id: "empty",
						label: "まだない",
						note: "紐づけを待っている旧ユーザーがいない",
						render: () =>
							admin(
								"旧ユーザーの紐づけ",
								"/legacy",
								<LegacyListPage q="" unlinkedOnly rows={[]} />,
							),
					},
					{
						id: "all",
						label: "すべて",
						query: "all=1",
						render: () =>
							admin(
								"旧ユーザーの紐づけ",
								"/legacy",
								<LegacyListPage q="" unlinkedOnly={false} rows={legacyRows} />,
							),
					},
				],
			},
			{
				id: "admin-link",
				title: "旧アカウントに紐づける",
				app: "admin",
				path: "/legacy/:id/link",
				access: "運営者",
				description: "紐づけ先のアカウントをメールアドレスで探して紐づける。",
				source: "apps/admin/src/views/pages.tsx",
				states: [
					{
						id: "default",
						label: "初期表示",
						render: () =>
							admin(
								"旧アカウントに紐づける",
								"/legacy",
								<LinkPage legacy={legacyRows[0]!} email="" candidates={[]} />,
							),
					},
					{
						id: "candidates",
						label: "候補あり",
						query: "email=",
						render: () =>
							admin(
								"旧アカウントに紐づける",
								"/legacy",
								<LinkPage
									legacy={legacyRows[0]!}
									email="hanako.yamada@example.com"
									candidates={[userRows[0]!]}
								/>,
							),
					},
					{
						id: "error",
						label: "紐づけできない",
						render: () =>
							admin(
								"旧アカウントに紐づける",
								"/legacy",
								<LinkPage
									legacy={legacyRows[0]!}
									email=""
									candidates={[]}
									error="この旧アカウントは、すでに Google でログインしています。"
								/>,
							),
					},
				],
			},
			{
				id: "admin-audit",
				title: "監査ログ",
				app: "admin",
				path: "/audit",
				access: "運営者",
				description: "運営者の操作の記録（新しい順に 200 件）。",
				source: "apps/admin/src/views/pages.tsx",
				states: [
					{
						id: "default",
						label: "通常",
						render: () => admin("監査ログ", "/audit", <AuditPage logs={auditLogRows} />),
					},
					{
						id: "empty",
						label: "まだない",
						render: () => admin("監査ログ", "/audit", <AuditPage logs={[]} />),
					},
				],
			},
		],
	},
];

function editorUser() {
	return sessionUserFor("editor");
}

function viewerUser() {
	return sessionUserFor("viewer");
}
