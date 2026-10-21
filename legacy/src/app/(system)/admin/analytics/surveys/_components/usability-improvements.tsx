import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Survey {
	usability_easier_input: boolean | null;
	usability_better_ui: boolean | null;
	usability_faster_performance: boolean | null;
}

interface UsabilityImprovementsProps {
	surveys: Survey[];
	totalResponses: number;
}

/**
 * 操作性改善要望の進捗バー
 */
function UsabilityRequestBar({
	label,
	count,
	total,
}: { label: string; count: number; total: number }) {
	const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm">
				<span>{label}</span>
				<span className="text-muted-foreground">
					{count}件 ({percentage}%)
				</span>
			</div>
			<Progress value={percentage} className="h-2" />
		</div>
	);
}

export function UsabilityImprovements({ surveys, totalResponses }: UsabilityImprovementsProps) {
	const usabilityRequests = {
		easierInput: surveys.filter((s) => s.usability_easier_input).length,
		betterUi: surveys.filter((s) => s.usability_better_ui).length,
		fasterPerformance: surveys.filter((s) => s.usability_faster_performance).length,
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>操作性改善要望</CardTitle>
				<p className="text-sm text-muted-foreground">UX向上のポイント</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<UsabilityRequestBar
					label="入力がもっと簡単に"
					count={usabilityRequests.easierInput}
					total={totalResponses}
				/>
				<UsabilityRequestBar
					label="画面がもっと見やすく"
					count={usabilityRequests.betterUi}
					total={totalResponses}
				/>
				<UsabilityRequestBar
					label="動作がもっと速く"
					count={usabilityRequests.fasterPerformance}
					total={totalResponses}
				/>
			</CardContent>
		</Card>
	);
}
