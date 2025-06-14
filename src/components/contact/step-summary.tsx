import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, FileText, User, Mail, Building } from "lucide-react";

interface StepSummaryProps {
	currentStep: number;
	formData: {
		category?: string;
		message?: string;
		name?: string;
		email?: string;
		company_name?: string;
		attachment?: FileList;
	};
}

// カテゴリ表示名のマッピング
const categoryLabels = {
	support: "サポート",
	account: "アカウント関連",
	bug: "バグ報告",
	feature: "機能要望",
	business: "法人問い合わせ",
	other: "その他",
} as const;

export default function StepSummary({ currentStep, formData }: StepSummaryProps) {
	// ステップ1では何も表示しない
	if (currentStep <= 1) return null;

	return (
		<Card className="mb-6 bg-muted/30">
			<CardContent className="p-4">
				<div className="flex items-center gap-2 mb-3">
					<Check className="w-4 h-4 text-primary" />
					<span className="text-sm font-medium text-foreground">入力済みの内容</span>
				</div>

				<div className="space-y-3">
					{/* ステップ1の内容（カテゴリ） */}
					{currentStep > 1 && formData.category && (
						<div className="flex items-center gap-2">
							<Badge variant="secondary" className="text-xs">
								お問い合わせの種類
							</Badge>
							<span className="text-sm text-foreground">
								{categoryLabels[formData.category as keyof typeof categoryLabels] ||
									formData.category}
							</span>
						</div>
					)}

					{/* ステップ2の内容（詳細内容とファイル） */}
					{currentStep > 2 && (
						<>
							{formData.message && (
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<FileText className="w-3 h-3 text-muted-foreground" />
										<Badge variant="secondary" className="text-xs">
											お問い合わせの内容
										</Badge>
									</div>
									<div className="text-sm text-muted-foreground bg-background/50 p-2 rounded text-left">
										{formData.message.length > 100
											? `${formData.message.substring(0, 100)}...`
											: formData.message}
									</div>
								</div>
							)}

							{formData.attachment && formData.attachment.length > 0 && (
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="text-xs">
										添付ファイル
									</Badge>
									<span className="text-sm text-muted-foreground">
										{formData.attachment[0]?.name || "ファイルが添付されていません"}
									</span>
								</div>
							)}
						</>
					)}

					{/* ステップ3では表示しない（最終ステップのため） */}
				</div>
			</CardContent>
		</Card>
	);
}
