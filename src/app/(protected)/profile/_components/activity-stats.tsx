"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ActivityStatsProps {
	ownedKoudensCount: number;
	participatingKoudensCount: number;
	totalEntriesCount: number;
	lastActivityAt: string | null;
}

export function ActivityStats({
	ownedKoudensCount,
	participatingKoudensCount,
	totalEntriesCount,
	lastActivityAt,
}: ActivityStatsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>活動統計</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">作成した香典帳</TableCell>
							<TableCell>{ownedKoudensCount}件</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">参加中の香典帳</TableCell>
							<TableCell>{participatingKoudensCount}件</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">登録した香典記録</TableCell>
							<TableCell>{totalEntriesCount}件</TableCell>
						</TableRow>
						{lastActivityAt && (
							<TableRow>
								<TableCell className="font-medium">最後の活動</TableCell>
								<TableCell>
									{format(new Date(lastActivityAt), "yyyy年MM月dd日 HH:mm", {
										locale: ja,
									})}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
