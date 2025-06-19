"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { QuickHelpArea } from "./quick-help-area";

interface DemoConfig {
	showSearch: boolean;
	maxItems: number;
	categories: string[];
}

/**
 * クイックヘルプエリアのデモコンポーネント
 * 開発・テスト用途
 */
export function QuickHelpDemo() {
	const [config, setConfig] = useState<DemoConfig>({
		showSearch: true,
		maxItems: 6,
		categories: ["basic", "advanced", "troubleshooting", "manners"],
	});

	const availableCategories = [
		{ value: "basic", label: "基本操作" },
		{ value: "advanced", label: "応用機能" },
		{ value: "troubleshooting", label: "トラブル" },
		{ value: "manners", label: "マナー" },
	];

	const maxItemsOptions = [3, 6, 8, 12];

	const toggleCategory = (category: string) => {
		setConfig((prev) => ({
			...prev,
			categories: prev.categories.includes(category)
				? prev.categories.filter((c) => c !== category)
				: [...prev.categories, category],
		}));
	};

	return (
		<div className="space-y-6 p-6 max-w-6xl mx-auto">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						⚡ クイックヘルプエリア デモ
						<Badge variant="outline">開発用</Badge>
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						異なる設定でのクイックヘルプエリアの表示を確認できます
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* 設定コントロール */}
					<div className="grid gap-4 md:grid-cols-3">
						{/* 検索表示設定 */}
						<div className="space-y-2">
							<Label htmlFor="showSearch">検索機能</Label>
							<div className="flex items-center space-x-2">
								<Switch
									id="showSearch"
									checked={config.showSearch}
									onCheckedChange={(checked) =>
										setConfig((prev) => ({ ...prev, showSearch: checked }))
									}
								/>
								<span className="text-sm text-muted-foreground">
									{config.showSearch ? "表示" : "非表示"}
								</span>
							</div>
						</div>

						{/* 最大表示件数設定 */}
						<div className="space-y-2">
							<Label>最大表示件数</Label>
							<div className="flex flex-wrap gap-2">
								{maxItemsOptions.map((num) => (
									<Button
										key={num}
										variant={config.maxItems === num ? "default" : "outline"}
										size="sm"
										onClick={() => setConfig((prev) => ({ ...prev, maxItems: num }))}
									>
										{num}件
									</Button>
								))}
							</div>
						</div>

						{/* カテゴリ設定 */}
						<div className="space-y-2">
							<Label>表示カテゴリ</Label>
							<div className="space-y-2">
								{availableCategories.map((category) => (
									<div key={category.value} className="flex items-center space-x-2">
										<Switch
											id={category.value}
											checked={config.categories.includes(category.value)}
											onCheckedChange={() => toggleCategory(category.value)}
										/>
										<Label htmlFor={category.value} className="text-sm">
											{category.label}
										</Label>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* 現在の設定表示 */}
					<div className="p-3 rounded-lg bg-muted">
						<div className="text-sm">
							<strong>現在の設定:</strong>
						</div>
						<div className="text-xs text-muted-foreground mt-1 space-y-1">
							<div>検索機能: {config.showSearch ? "有効" : "無効"}</div>
							<div>最大表示: {config.maxItems}件</div>
							<div>
								カテゴリ: {config.categories.length}個 (
								{config.categories
									.map((c) => availableCategories.find((cat) => cat.value === c)?.label)
									.join(", ")}
								)
							</div>
						</div>
					</div>

					{/* リセットボタン */}
					<div className="flex justify-center">
						<Button
							variant="outline"
							onClick={() =>
								setConfig({
									showSearch: true,
									maxItems: 6,
									categories: ["basic", "advanced", "troubleshooting", "manners"],
								})
							}
						>
							設定をリセット
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* 実際のコンポーネント表示 */}
			<QuickHelpArea
				showSearch={config.showSearch}
				maxItems={config.maxItems}
				categories={config.categories}
			/>
		</div>
	);
}
