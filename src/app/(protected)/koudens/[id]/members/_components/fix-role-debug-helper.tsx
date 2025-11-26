"use client";

import { updateMemberRole } from "@/app/_actions/roles";
import { Button } from "@/components/ui/button";
import type { KoudenMember } from "@/types/member";
import type { KoudenRole } from "@/types/role";
import { useState } from "react";
import { toast } from "sonner";

interface FixRoleDebugHelperProps {
	members: KoudenMember[];
	roles: KoudenRole[];
	koudenId: string;
}

export function FixRoleDebugHelper({ members, roles, koudenId }: FixRoleDebugHelperProps) {
	const [isFixing, setIsFixing] = useState(false);

	// "unknown"ロールを持つメンバーを特定
	const problematicMembers = members.filter(
		(member) =>
			member.role?.name === "unknown" ||
			!["owner", "editor", "viewer"].includes(member.role?.name || ""),
	);

	// "viewer"ロールIDを取得
	const viewerRole = roles.find((role) => role.name === "viewer");

	const handleFixRoles = async () => {
		if (!viewerRole) {
			toast.error("viewerロールが見つかりません");
			return;
		}

		setIsFixing(true);
		try {
			for (const member of problematicMembers) {
				await updateMemberRole(koudenId, member.user_id, viewerRole.id);
			}

			toast.success("不正なロールを修正しました", {
				description: `${problematicMembers.length}名のロールをviewerに変更しました`,
			});

			// ページをリロードして変更を反映
			window.location.reload();
		} catch (error) {
			console.error("Role fix error:", error);
			toast.error("ロール修正に失敗しました", {
				description: error instanceof Error ? error.message : "未知のエラー",
			});
		} finally {
			setIsFixing(false);
		}
	};

	if (problematicMembers.length === 0) {
		return (
			<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
				<p className="text-green-800">✅ すべてのメンバーのロールは正常です</p>
			</div>
		);
	}

	return (
		<div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
			<h3 className="font-semibold text-red-800">🚨 ロールエラーが検出されました</h3>
			<p className="text-red-700">
				以下のメンバーに不正なロール（"{problematicMembers[0]?.role?.name}"）が設定されています：
			</p>
			<ul className="list-disc list-inside text-red-700">
				{problematicMembers.map((member) => (
					<li key={member.id}>
						{member.profile?.display_name} (現在: {member.role?.name})
					</li>
				))}
			</ul>
			<Button onClick={handleFixRoles} disabled={isFixing} variant="destructive" className="w-full">
				{isFixing
					? "修正中..."
					: `不正なロールを修正する (${problematicMembers.length}名 → viewer)`}
			</Button>
			<p className="text-xs text-red-600">
				⚠️ この操作により、問題のあるメンバーのロールが一時的に"viewer"に変更されます。
				<br />
				その後、必要に応じて適切なロールに再設定してください。
			</p>
		</div>
	);
}
