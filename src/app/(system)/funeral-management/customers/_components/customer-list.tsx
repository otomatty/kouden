import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerCard } from "./customer-card";
import type { Customer } from "@/types/funeral-management";

interface CustomerListProps {
	customers: Customer[];
	totalCount: number;
}

/**
 * 顧客一覧表示コンポーネント
 * フィルタリングされた顧客リストを表示
 */
export function CustomerList({ customers, totalCount }: CustomerListProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-center">
					<CardTitle>顧客一覧</CardTitle>
					<Badge variant="secondary">{totalCount}名</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{customers.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<p>条件に該当する顧客が見つかりませんでした。</p>
					</div>
				) : (
					<div className="space-y-4">
						{customers.map((customer) => (
							<CustomerCard key={customer.id} customer={customer} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
