"use client";

import type React from "react";
import { ScenarioVideoSection, type Scenario } from "../../_components/ScenarioVideoSection";
import { UserPlus, Key, Shield, UserCheck, LogOut } from "lucide-react";

const scenarios: Scenario[] = [
	{
		id: "family-invite",
		title: "家族招待",
		description: "家族を招待してデータ共有を開始。",
		icon: UserPlus,
		videoUrl: "/videos/invite-security/family-invite.mp4",
	},
	{
		id: "permission-settings",
		title: "権限設定",
		description: "メンバーごとに閲覧・編集権限を設定。",
		icon: Key,
		videoUrl: "/videos/invite-security/permission-settings.mp4",
	},
	{
		id: "two-factor-auth",
		title: "二要素認証",
		description: "二要素認証でアカウントをさらに保護。",
		icon: Shield,
		videoUrl: "/videos/invite-security/two-factor-auth.mp4",
	},
	{
		id: "access-logs",
		title: "アクセスログ確認",
		description: "誰がいつアクセスしたかを記録・確認。",
		icon: UserCheck,
		videoUrl: "/videos/invite-security/access-logs.mp4",
	},
	{
		id: "revoke-access",
		title: "アクセス取り消し",
		description: "不要になったメンバーのアクセス権を取り消し。",
		icon: LogOut,
		videoUrl: "/videos/invite-security/revoke-access.mp4",
	},
];

export default function ScenarioVideoWrapper() {
	return <ScenarioVideoSection scenarios={scenarios} />;
}
