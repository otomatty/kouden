import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import type { ReturnRateInfoProps } from "./types";

/**
 * 返礼対象情報と返礼率計算を表示するコンポーネント
 */
export function ReturnRateInfo({ selectedEntry, totalAmount }: ReturnRateInfoProps) {
	if (!selectedEntry) return null;

	return (
		<>
			{/* 返礼対象の金額情報 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<Package className="h-4 w-4" />
						返礼対象情報
					</CardTitle>
					<CardDescription>返礼品の参考にしてください</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">香典金額:</span>
							<p className="font-medium text-lg">¥{selectedEntry.amount.toLocaleString()}</p>
						</div>
						<div>
							<span className="text-muted-foreground">推奨返礼割合 (30-50%):</span>
							<p className="text-muted-foreground">
								¥{Math.floor(selectedEntry.amount * 0.3).toLocaleString()} - ¥
								{Math.floor(selectedEntry.amount * 0.5).toLocaleString()}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 返礼率計算 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">返礼率</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span>香典金額:</span>
							<span>¥{selectedEntry.amount.toLocaleString()}</span>
						</div>
						<div className="flex justify-between">
							<span>返礼品合計:</span>
							<span>¥{totalAmount.toLocaleString()}</span>
						</div>
						<div className="flex justify-between font-medium border-t pt-2">
							<span>返礼率:</span>
							<span
								className={
									totalAmount / selectedEntry.amount > 0.5
										? "text-orange-600"
										: totalAmount / selectedEntry.amount < 0.3
											? "text-blue-600"
											: "text-green-600"
								}
							>
								{((totalAmount / selectedEntry.amount) * 100).toFixed(1)}%
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
