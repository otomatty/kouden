import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Survey {
	feature_voice_input: boolean | null;
	feature_photo_attachment: boolean | null;
	feature_excel_integration: boolean | null;
	feature_print_layout: boolean | null;
}

interface FeatureRequestsProps {
	surveys: Survey[];
	totalResponses: number;
}

/**
 * 機能要望の進捗バー
 */
function FeatureRequestBar({
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

export function FeatureRequests({ surveys, totalResponses }: FeatureRequestsProps) {
	const featureRequests = {
		voiceInput: surveys.filter((s) => s.feature_voice_input).length,
		photoAttachment: surveys.filter((s) => s.feature_photo_attachment).length,
		excelIntegration: surveys.filter((s) => s.feature_excel_integration).length,
		printLayout: surveys.filter((s) => s.feature_print_layout).length,
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>機能追加要望</CardTitle>
				<p className="text-sm text-muted-foreground">ユーザーが求める新機能</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<FeatureRequestBar
					label="Excel連携機能"
					count={featureRequests.excelIntegration}
					total={totalResponses}
				/>
				<FeatureRequestBar
					label="印刷レイアウト選択"
					count={featureRequests.printLayout}
					total={totalResponses}
				/>
				<FeatureRequestBar
					label="写真添付機能"
					count={featureRequests.photoAttachment}
					total={totalResponses}
				/>
				<FeatureRequestBar
					label="音声入力機能"
					count={featureRequests.voiceInput}
					total={totalResponses}
				/>
			</CardContent>
		</Card>
	);
}
