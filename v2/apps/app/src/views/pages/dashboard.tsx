import { type FieldErrors, formatYen, ROLES } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { SessionUser } from "../../auth/session-store.ts";
import type { KoudenListItem } from "../../kouden/store.ts";
import { Field, FormAlert, type FormValues, Input } from "../components/form.tsx";
import { formatDateTime } from "../format.ts";
import { ui } from "../ui.ts";

/** 香典帳一覧（E2-3）。アーカイブ済みは別タブ（E2-4） */
export const DashboardPage: FC<{
	user: SessionUser;
	koudens: KoudenListItem[];
	tab: "active" | "archived";
	notice?: string | undefined;
}> = ({ user, koudens, tab, notice }) => (
	<div class={`${ui.container} space-y-8`}>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<h1 class={ui.h1}>香典帳</h1>
			<a href="/k/new" class={ui.buttonPrimary}>
				新しい香典帳を作る
			</a>
		</div>
		{notice && (
			<p role="status" class={ui.notice}>
				{notice}
			</p>
		)}
		<nav aria-label="表示する香典帳" class="flex gap-1 border-b border-line">
			{(
				[
					["active", "参加中", "/"],
					["archived", "アーカイブ", "/?tab=archived"],
				] as const
			).map(([key, label, href]) => (
				<a
					href={href}
					aria-current={tab === key ? "page" : undefined}
					class={`border-b-2 px-4 py-2 text-sm ${
						tab === key
							? "border-accent font-medium"
							: "border-transparent text-muted hover:text-ink"
					}`}
				>
					{label}
				</a>
			))}
		</nav>
		{koudens.length === 0 ? (
			<div class={`${ui.card} py-12 text-center`}>
				{tab === "active" ? (
					<>
						<p class="font-medium">まだ香典帳がありません</p>
						<p class="mt-2 text-sm text-muted">
							「新しい香典帳を作る」から作成するか、家族から届いた招待リンクを開いてください。
						</p>
					</>
				) : (
					<p class="text-muted">アーカイブした香典帳はありません</p>
				)}
			</div>
		) : (
			<ul class="grid gap-4 sm:grid-cols-2">
				{koudens.map((k) => (
					<li>
						<a
							href={`/k/${k.id}`}
							class={`${ui.card} block space-y-3 transition-colors hover:border-accent`}
						>
							<div class="flex items-start justify-between gap-2">
								<div>
									<p class="font-semibold">{k.title}</p>
									<p class="text-sm text-muted">故 {k.deceasedName} 様</p>
								</div>
								<span class={ui.badge}>{ROLES[k.role]}</span>
							</div>
							<dl class="grid grid-cols-3 gap-2 text-sm">
								<div>
									<dt class="text-xs text-muted">件数</dt>
									<dd class="tabular-nums">{k.giftCount} 件</dd>
								</div>
								<div>
									<dt class="text-xs text-muted">香典の合計</dt>
									<dd class="tabular-nums">{formatYen(k.totalAmount)}</dd>
								</div>
								<div>
									<dt class="text-xs text-muted">最終更新</dt>
									<dd>{formatDateTime(k.lastActivityAt)}</dd>
								</div>
							</dl>
						</a>
					</li>
				))}
			</ul>
		)}
		<section class={`${ui.card} space-y-4`} aria-labelledby="account">
			<h2 id="account" class={ui.h2}>
				アカウント
			</h2>
			<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
				<dt class="text-muted">表示名</dt>
				<dd>{user.displayName}</dd>
				<dt class="text-muted">メールアドレス</dt>
				<dd class="break-all">{user.email}</dd>
			</dl>
			<form method="post" action="/logout/all">
				<button type="submit" class={ui.buttonSecondary}>
					すべての端末からログアウト
				</button>
			</form>
		</section>
	</div>
);

/** 香典帳の作成（E2-1） */
export const NewKoudenPage: FC<{ values: FormValues; errors?: FieldErrors }> = ({
	values,
	errors = {},
}) => (
	<div class={`${ui.container} max-w-xl space-y-6`}>
		<a href="/" class="text-sm text-muted hover:text-ink">
			← 香典帳一覧
		</a>
		<h1 class={ui.h1}>新しい香典帳</h1>
		<form method="post" action="/k" class={`${ui.card} space-y-5`} novalidate>
			<FormAlert errors={errors} />
			<Field label="故人のお名前" name="deceasedName" error={errors.deceasedName} required>
				<Input name="deceasedName" values={values} errors={errors} autofocus required />
			</Field>
			<Field
				label="香典帳の名前"
				name="title"
				error={errors.title}
				hint="省略すると「故 〇〇 様」になります。後から変更できます"
			>
				<Input name="title" values={values} errors={errors} />
			</Field>
			<p class="text-sm text-muted">
				行事（通夜・告別式）と関係（親族・友人・会社関係・近所・その他）を用意します。どちらも後から変更できます。
			</p>
			<button type="submit" class={`${ui.buttonPrimary} w-full`}>
				作成する
			</button>
		</form>
	</div>
);
