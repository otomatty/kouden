import type { FieldErrors } from "@kouden/domain";
import type { FC } from "hono/jsx";
import type { OwnedKouden } from "../../auth/account.ts";
import type { SessionUser } from "../../auth/session-store.ts";
import { Field, FormAlert, type FormValues, Input } from "../components/form.tsx";
import { ui } from "../ui.ts";

/** アカウント（E1-4, E1-5）: 表示名・ログアウト・アカウントの削除 */
export const AccountPage: FC<{
	user: SessionUser;
	owned: OwnedKouden[];
	values: FormValues;
	errors?: FieldErrors;
	notice?: string | undefined;
	deleteError?: string | undefined;
}> = ({ user, owned, values, errors = {}, notice, deleteError }) => (
	<div class={`${ui.container} max-w-3xl space-y-8`}>
		<div class="space-y-3">
			<a href="/" class="text-sm text-muted hover:text-ink">
				← 香典帳一覧
			</a>
			<h1 class={ui.h1}>アカウント</h1>
		</div>
		{notice && (
			<p role="status" class={ui.notice}>
				{notice}
			</p>
		)}

		<section aria-labelledby="profile" class={`${ui.card} space-y-4`}>
			<h2 id="profile" class={ui.h2}>
				表示名
			</h2>
			<form method="post" action="/account/profile" class="space-y-4" novalidate>
				<FormAlert errors={errors} />
				<Field
					label="表示名"
					name="displayName"
					error={errors.displayName}
					hint="変更履歴や「編集中」の表示で、他のメンバーに見える名前です。"
					required
				>
					<Input name="displayName" values={values} errors={errors} maxlength={50} />
				</Field>
				<button type="submit" class={ui.buttonSecondary}>
					保存する
				</button>
			</form>
			<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
				<dt class="text-muted">メールアドレス</dt>
				<dd class="break-all">{user.email}（Google アカウント）</dd>
			</dl>
		</section>

		<section aria-labelledby="sessions" class={`${ui.card} space-y-4`}>
			<h2 id="sessions" class={ui.h2}>
				ログイン中の端末
			</h2>
			<p class="text-sm text-muted">
				スマホを紛失したときなどに、すべての端末からログアウトできます。
			</p>
			<form method="post" action="/logout/all">
				<button type="submit" class={ui.buttonSecondary}>
					すべての端末からログアウト
				</button>
			</form>
		</section>

		<section
			id="delete"
			aria-labelledby="delete-heading"
			class={`${ui.card} space-y-4 border-danger/40`}
		>
			<h2 id="delete-heading" class={`${ui.h2} text-danger`}>
				アカウントの削除
			</h2>
			{deleteError && (
				<p role="alert" class={ui.alert}>
					{deleteError}
				</p>
			)}
			{owned.length > 0 ? (
				<div class="space-y-3 text-sm">
					<p>
						オーナーである香典帳が {owned.length}{" "}
						冊あります。それぞれ、他のメンバーに譲渡するか削除すると、アカウントを削除できます。
					</p>
					<ul class="divide-y divide-line rounded-lg border border-line">
						{owned.map((k) => (
							<li class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
								<span>
									{k.title}
									{k.status === "archived" && <span class={`${ui.badge} ml-2`}>アーカイブ中</span>}
									{k.transferPending && <span class={`${ui.badge} ml-2`}>譲渡の承諾待ち</span>}
								</span>
								<span class="flex gap-2">
									<a href={`/k/${k.id}/members#member-list`} class={ui.buttonSmall}>
										譲渡する
									</a>
									<a href={`/k/${k.id}/settings#delete`} class={ui.buttonSmall}>
										削除する
									</a>
								</span>
							</li>
						))}
					</ul>
				</div>
			) : (
				<form method="post" action="/account/delete" class="space-y-4">
					<ul class="list-disc space-y-1 pl-5 text-sm">
						<li>参加している香典帳から抜け、すべての端末からログアウトします。</li>
						<li>メールアドレスと表示名は削除され、元に戻せません。</li>
						<li>香典帳の変更履歴に残っている、これまでの操作者としての名前は消えません。</li>
						<li>同じ Google アカウントでログインすると、新しい空のアカウントになります。</li>
					</ul>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" name="confirm" value="1" required class="size-4 accent-danger" />
						上記を確認しました
					</label>
					<button type="submit" class={ui.buttonDanger}>
						アカウントを削除する
					</button>
				</form>
			)}
		</section>
	</div>
);

/** 削除の完了（ログアウト済みの状態で表示する） */
export const AccountDeletedPage: FC = () => (
	<div class={`${ui.container} max-w-md space-y-4 text-center`}>
		<h1 class={ui.h1}>アカウントを削除しました</h1>
		<p class="text-muted">ご利用ありがとうございました。</p>
		<a href="/" class={`${ui.link} inline-block`}>
			トップへ戻る
		</a>
	</div>
);
