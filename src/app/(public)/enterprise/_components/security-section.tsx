import React from "react";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";

/**
 * 安心・安全への取り組みセクション
 */
export function SecuritySection() {
	return (
		<Section id="security">
			<SectionTitle
				title="安心・安全への取り組み"
				subtitle="お客様のデータとプライバシーを守る"
				className="mb-8"
			/>
			<div className="grid gap-8 md:grid-cols-2">
				<div className="p-6 bg-white rounded-lg shadow">
					<h3 className="text-xl font-medium mb-2">個人情報保護・セキュリティ</h3>
					<ul className="list-disc list-inside text-gray-600">
						<li>通信暗号化（HTTPS/TLS）によるデータ保護</li>
						<li>厳格なアクセス制御と監査ログ</li>
						<li>定期的なセキュリティ監査と脆弱性検査</li>
					</ul>
				</div>
				<div className="p-6 bg-white rounded-lg shadow">
					<h3 className="text-xl font-medium mb-2">開発チームの紹介</h3>
					<div className="space-y-4">
						{/* Example team member card */}
						<div className="flex items-center gap-4">
							<img
								src="/images/team-member.jpg"
								alt="開発メンバー"
								className="h-16 w-16 rounded-full object-cover"
							/>
							<div>
								<p className="font-medium">開発チーム</p>
								<p className="text-sm text-gray-600">
									テクノロジーへの情熱と、故人とご遺族への敬意を込めて 開発。
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Section>
	);
}
