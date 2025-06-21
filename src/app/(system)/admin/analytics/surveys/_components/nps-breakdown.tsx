import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart3, ThumbsUp, CheckCircle2, AlertCircle } from "lucide-react";

interface NPSBreakdown {
	promoters: number;
	passives: number;
	detractors: number;
}

interface NPSBreakdownProps {
	npsBreakdown: NPSBreakdown;
	npsValue: number;
	totalResponses: number;
}

export function NPSBreakdownCard({ npsBreakdown, npsValue, totalResponses }: NPSBreakdownProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5" />
					NPS 分類
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-2">
						<ThumbsUp className="h-4 w-4 text-green-500" />
						<span>推奨者 (9-10)</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-bold">{npsBreakdown.promoters}</span>
						<Badge variant="default" className="bg-green-500 hover:bg-green-600">
							{Math.round((npsBreakdown.promoters / totalResponses) * 100)}%
						</Badge>
					</div>
				</div>

				<div className="flex justify-between items-center">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="h-4 w-4 text-gray-500" />
						<span>中立者 (7-8)</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-bold">{npsBreakdown.passives}</span>
						<Badge variant="secondary">
							{Math.round((npsBreakdown.passives / totalResponses) * 100)}%
						</Badge>
					</div>
				</div>

				<div className="flex justify-between items-center">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-4 w-4 text-red-500" />
						<span>批判者 (0-6)</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-bold">{npsBreakdown.detractors}</span>
						<Badge variant="destructive">
							{Math.round((npsBreakdown.detractors / totalResponses) * 100)}%
						</Badge>
					</div>
				</div>

				<Separator />
				<div className="text-center">
					<p className="text-sm text-muted-foreground">NPS スコア</p>
					<p className="text-3xl font-bold">{npsValue}</p>
				</div>
			</CardContent>
		</Card>
	);
}
