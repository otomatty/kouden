"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface SearchSuggestion {
	category: string;
	keywords: string[];
	examples: string[];
	description: string;
}

const searchSuggestions: SearchSuggestion[] = [
	{
		category: "基本操作",
		keywords: ["作成", "追加", "記録", "登録"],
		examples: ["香典帳 作成", "記録 追加", "新規 登録"],
		description: "香典帳や記録の作成・追加について",
	},
	{
		category: "管理機能",
		keywords: ["編集", "削除", "変更", "修正"],
		examples: ["記録 編集", "情報 変更", "データ 削除"],
		description: "既存データの編集や管理について",
	},
	{
		category: "集計・出力",
		keywords: ["集計", "合計", "エクスポート", "印刷"],
		examples: ["合計 金額", "データ エクスポート", "印刷 方法"],
		description: "記録の集計や出力機能について",
	},
	{
		category: "トラブル",
		keywords: ["エラー", "問題", "できない", "表示されない"],
		examples: ["ログイン できない", "データ 表示されない", "エラー 解決"],
		description: "問題が発生したときの解決方法",
	},
];

interface SearchHelperProps {
	onSearch?: (query: string) => void;
	className?: string;
}

export function SearchHelper({ onSearch, className }: SearchHelperProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleSuggestionClick = (example: string) => {
		onSearch?.(example);
	};

	return (
		<Card className={`border-orange-200 dark:border-orange-800 ${className}`}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Lightbulb className="w-4 h-4 text-orange-500" />
						<CardTitle className="text-sm font-medium">検索のヒント</CardTitle>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="h-6 w-6 p-0"
					>
						{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
					</Button>
				</div>
			</CardHeader>

			{isExpanded && (
				<CardContent className="pt-0 space-y-4">
					<div className="text-xs text-muted-foreground mb-4">
						💡 知りたいことに関連するキーワードで検索してみてください
					</div>

					{searchSuggestions.map((suggestion) => (
						<div key={suggestion.category} className="space-y-2">
							<h4 className="font-medium text-sm text-primary">{suggestion.category}</h4>
							<p className="text-xs text-muted-foreground">{suggestion.description}</p>

							<div className="flex flex-wrap gap-1">
								{suggestion.examples.map((example) => (
									<Button
										key={example}
										variant="outline"
										size="sm"
										className="h-6 px-2 text-xs"
										onClick={() => handleSuggestionClick(example)}
									>
										<Search className="w-3 h-3 mr-1" />
										{example}
									</Button>
								))}
							</div>
						</div>
					))}

					<div className="pt-3 border-t border-border">
						<div className="flex items-start gap-2">
							<HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
							<div className="text-xs text-muted-foreground">
								<p className="font-medium mb-1">検索のコツ</p>
								<ul className="space-y-1">
									<li>• 具体的なキーワードを使う</li>
									<li>• 複数のキーワードをスペースで区切る</li>
									<li>• ひらがな・カタカナ・漢字どれでもOK</li>
								</ul>
							</div>
						</div>
					</div>
				</CardContent>
			)}
		</Card>
	);
}
