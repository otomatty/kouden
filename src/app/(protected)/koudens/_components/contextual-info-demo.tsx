"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContextualInfoSection } from "./contextual-info-section";
import type { Database } from "@/types/supabase";

type Plan = Database["public"]["Tables"]["plans"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type KoudenWithPlan = Database["public"]["Tables"]["koudens"]["Row"] & {
	owner?: Profile;
	plan: Plan;
	expired: boolean;
	remainingDays?: number;
};

// デモ用のシナリオ定義
interface DemoScenario {
	id: string;
	title: string;
	description: string;
	koudens: KoudenWithPlan[];
}

/**
 * コンテキスト型インフォメーションセクションのデモコンポーネント
 * 開発・テスト用途
 */
export function ContextualInfoDemo() {
	// モックプラン
	const mockFreePlan: Plan = {
		id: "free-plan-id",
		code: "free",
		name: "無料",
		price: 0,
		features: ["max_entries:50"],
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		description: null,
	};

	const mockPremiumPlan: Plan = {
		id: "premium-plan-id",
		code: "premium",
		name: "プレミアム",
		price: 1000,
		features: ["max_entries:1000"],
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		description: null,
	};

	// デモシナリオ
	const demoScenarios: DemoScenario[] = [
		{
			id: "empty",
			title: "初回ユーザー（香典帳なし）",
			description: "はじめて利用するユーザー向けのガイダンス",
			koudens: [],
		},
		{
			id: "expired",
			title: "期限切れプランあり",
			description: "プラン更新が必要な状況",
			koudens: [
				{
					id: "kouden-1",
					title: "田中家 告別式",
					description: "2024年1月の告別式",
					status: "active" as const,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-15T00:00:00Z",
					created_by: "user-1",
					owner_id: "user-1",
					plan_id: "free-plan-id",
					plan: mockFreePlan,
					expired: true,
					remainingDays: 0,
				},
			],
		},
		{
			id: "active",
			title: "アクティブな香典帳あり",
			description: "返礼品管理のコツを提案",
			koudens: [
				{
					id: "kouden-2",
					title: "佐藤家 告別式",
					description: "2024年1月の告別式",
					status: "active" as const,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-15T00:00:00Z",
					created_by: "user-1",
					owner_id: "user-1",
					plan_id: "premium-plan-id",
					plan: mockPremiumPlan,
					expired: false,
					remainingDays: 300,
				},
			],
		},
		{
			id: "seasonal-spring",
			title: "春の法要シーズン（3月）",
			description: "季節的な情報を提供（現在の月を3月として処理）",
			koudens: [
				{
					id: "kouden-3",
					title: "山田家 法要",
					description: "アーカイブされた香典帳",
					status: "archived" as const,
					created_at: "2024-01-01T00:00:00Z",
					updated_at: "2024-01-15T00:00:00Z",
					created_by: "user-1",
					owner_id: "user-1",
					plan_id: "premium-plan-id",
					plan: mockPremiumPlan,
					expired: false,
					remainingDays: 300,
				},
			],
		},
	];

	const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(
		demoScenarios[0] ??
			demoScenarios.find(() => true) ?? {
				id: "empty",
				title: "デフォルト",
				description: "デフォルトシナリオ",
				koudens: [],
			},
	);

	// 春の法要シーズンシナリオの場合は現在月を3月として処理
	const getAdjustedKoudens = (scenario: DemoScenario) => {
		if (scenario.id === "seasonal-spring") {
			// Date.prototype.getMonth をモックして3月（2）を返すように
			const originalGetMonth = Date.prototype.getMonth;
			Date.prototype.getMonth = () => 2; // 3月は2
			const result = scenario.koudens;
			Date.prototype.getMonth = originalGetMonth; // 復元
			return result;
		}
		return scenario.koudens;
	};

	return (
		<div className="space-y-6 p-6 max-w-4xl mx-auto">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						🧪 コンテキスト型インフォメーション デモ
						<Badge variant="outline">開発用</Badge>
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						異なるユーザー状況でのコンテンツ表示を確認できます
					</p>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
						{demoScenarios.map((scenario) => (
							<Button
								key={scenario.id}
								variant={selectedScenario.id === scenario.id ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedScenario(scenario)}
								className="h-auto p-3 text-left justify-start"
							>
								<div>
									<div className="font-medium text-sm">{scenario.title}</div>
									<div className="text-xs text-muted-foreground mt-1">{scenario.description}</div>
								</div>
							</Button>
						))}
					</div>

					<div className="mt-4 p-3 rounded-lg bg-muted">
						<div className="text-sm">
							<strong>現在のシナリオ:</strong> {selectedScenario.title}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							香典帳数: {selectedScenario.koudens.length}件
							{selectedScenario.koudens.length > 0 && (
								<>
									{" | "}
									期限切れ: {selectedScenario.koudens.filter((k) => k.expired).length}件{" | "}
									アクティブ:{" "}
									{selectedScenario.koudens.filter((k) => k.status !== "archived").length}件
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 実際のコンポーネント表示 */}
			<ContextualInfoSection
				koudens={
					selectedScenario.id === "seasonal-spring"
						? getAdjustedKoudens(selectedScenario)
						: selectedScenario.koudens
				}
			/>
		</div>
	);
}
