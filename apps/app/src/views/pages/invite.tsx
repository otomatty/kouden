import { ROLES } from "@kouden/domain";
import type { Child, FC } from "hono/jsx";
import type { InvitationState, InvitationView } from "../../kouden/members.ts";
import { ui } from "@kouden/ui";
import { GoogleButton } from "../components/google-button.tsx";

const STATE_MESSAGES: Record<Exclude<InvitationState, "valid">, string> = {
	revoked: "この招待リンクは無効になっています。",
	expired: "この招待リンクは有効期限が切れています。",
	used_up: "この招待リンクは使用回数の上限に達しています。",
	unavailable: "この香典帳は現在、招待を受け付けていません。",
};

/**
 * 招待の受諾（E3-2）。ログインしていなければ Google ログインへ進み、戻ってきたら参加を確認する。
 * 意図しない参加を防ぐため、参加はボタンを押したときだけ行う（GET では参加しない）。
 */
export const InvitePage: FC<{
	invitation: InvitationView | null;
	token: string;
	loggedIn: boolean;
	error?: string | undefined;
}> = ({ invitation, token, loggedIn, error }) => {
	const path = `/invite/${encodeURIComponent(token)}`;
	if (!invitation) {
		return (
			<Box>
				<h1 class={ui.h1}>招待リンクが見つかりません</h1>
				<p class="text-muted">URL が正しいか、招待した方にご確認ください。</p>
			</Box>
		);
	}
	if (invitation.state !== "valid") {
		return (
			<Box>
				<h1 class={ui.h1}>参加できません</h1>
				<p>{STATE_MESSAGES[invitation.state]}</p>
				<p class="text-sm text-muted">
					{invitation.inviterName} さんに新しい招待リンクを依頼してください。
				</p>
			</Box>
		);
	}
	return (
		<Box>
			<p class="text-sm text-muted">{invitation.inviterName} さんからの招待</p>
			<h1 class={ui.h1}>{invitation.koudenTitle}</h1>
			<p>
				<span class={ui.badge}>{ROLES[invitation.role]}</span>
				<span class="ml-2 text-sm text-muted">
					{invitation.role === "editor" ? "受付・記録の入力や編集ができます" : "閲覧のみできます"}
				</span>
			</p>
			{error && (
				<p role="alert" class={ui.alert}>
					{error}
				</p>
			)}
			{loggedIn ? (
				<form method="post" action={path}>
					<button type="submit" class={`${ui.buttonPrimary} w-full`}>
						参加する
					</button>
				</form>
			) : (
				<>
					<GoogleButton
						href={`/auth/google/start?return_to=${encodeURIComponent(path)}`}
						class="w-full"
					>
						Google でログインして参加
					</GoogleButton>
					<p class="text-xs text-muted">
						初めての方は、Google アカウントでログインすると自動で登録されます。
					</p>
				</>
			)}
		</Box>
	);
};

const Box: FC<{ children?: Child }> = ({ children }) => (
	<div class={`${ui.container} max-w-md`}>
		<div class={`${ui.card} space-y-4 text-center`}>{children}</div>
	</div>
);
