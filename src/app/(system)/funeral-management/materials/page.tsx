import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, AlertTriangle, Clock, Truck } from "lucide-react";
import Container from "@/components/ui/container";
import Link from "next/link";

export default function MaterialsPage() {
	return (
		<Container className="py-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">資材管理</h1>
				<Button asChild>
					<Link href="/funeral-management/materials/orders/create">
						<Plus className="h-4 w-4 mr-2" />
						新規発注
					</Link>
				</Button>
			</div>

			{/* 概要統計 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">進行中発注</p>
								<p className="text-2xl font-bold">8件</p>
							</div>
							<Clock className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">在庫不足</p>
								<p className="text-2xl font-bold">3品目</p>
							</div>
							<AlertTriangle className="h-8 w-8 text-red-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">今月発注額</p>
								<p className="text-2xl font-bold">¥450K</p>
							</div>
							<Truck className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">管理品目数</p>
								<p className="text-2xl font-bold">48品目</p>
							</div>
							<Package className="h-8 w-8 text-purple-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* タブ切り替え */}
			<Tabs defaultValue="orders" className="space-y-4">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="orders">発注管理</TabsTrigger>
					<TabsTrigger value="inventory">在庫管理</TabsTrigger>
				</TabsList>

				{/* 発注管理タブ */}
				<TabsContent value="orders" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle>発注一覧</CardTitle>
								<Button variant="outline" asChild>
									<Link href="/funeral-management/materials/orders">
										<Package className="h-4 w-4 mr-2" />
										全ての発注を見る
									</Link>
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* サンプル発注データ */}
								{[
									{
										id: "1",
										orderNumber: "ORD-2024-001",
										supplier: "○○花材店",
										items: "白菊 50本、黄菊 30本",
										totalAmount: 45000,
										orderDate: "2024-12-15",
										expectedDelivery: "2024-12-18",
										status: "配送中",
										caseId: "1",
									},
									{
										id: "2",
										orderNumber: "ORD-2024-002",
										supplier: "△△祭壇用品",
										items: "祭壇布 2枚、燭台 4個",
										totalAmount: 32000,
										orderDate: "2024-12-14",
										expectedDelivery: "2024-12-17",
										status: "準備中",
										caseId: "2",
									},
									{
										id: "3",
										orderNumber: "ORD-2024-003",
										supplier: "□□返礼品",
										items: "香典返し品 100個",
										totalAmount: 78000,
										orderDate: "2024-12-13",
										expectedDelivery: "2024-12-16",
										status: "完了",
										caseId: "3",
									},
								].map((order) => (
									<div
										key={order.id}
										className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
									>
										<div className="flex justify-between items-start">
											<div className="space-y-2 flex-1">
												<div className="flex items-center gap-3">
													<h3 className="font-semibold">{order.orderNumber}</h3>
													<Badge
														variant={
															order.status === "完了"
																? "default"
																: order.status === "配送中"
																	? "secondary"
																	: order.status === "準備中"
																		? "outline"
																		: "destructive"
														}
													>
														{order.status}
													</Badge>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
													<div>
														<span className="text-muted-foreground">仕入先:</span>
														<span className="ml-2 font-medium">{order.supplier}</span>
													</div>
													<div>
														<span className="text-muted-foreground">金額:</span>
														<span className="ml-2 font-medium">
															¥{order.totalAmount.toLocaleString()}
														</span>
													</div>
													<div>
														<span className="text-muted-foreground">発注日:</span>
														<span className="ml-2">{order.orderDate}</span>
													</div>
													<div>
														<span className="text-muted-foreground">納期:</span>
														<span className="ml-2">{order.expectedDelivery}</span>
													</div>
												</div>

												<div className="text-sm">
													<span className="text-muted-foreground">品目:</span>
													<span className="ml-2">{order.items}</span>
												</div>
											</div>

											<div className="flex gap-2 ml-4">
												<Button variant="outline" size="sm" asChild>
													<Link href={`/funeral-management/materials/orders/${order.id}`}>
														詳細
													</Link>
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 在庫管理タブ */}
				<TabsContent value="inventory" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle>在庫状況</CardTitle>
								<Button variant="outline" asChild>
									<Link href="/funeral-management/materials/inventory">
										<Package className="h-4 w-4 mr-2" />
										在庫詳細
									</Link>
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* サンプル在庫データ */}
								{[
									{
										id: "1",
										itemName: "白菊",
										category: "花材",
										currentStock: 25,
										minStock: 20,
										maxStock: 100,
										unit: "本",
										lastUpdated: "2024-12-15",
										status: "適正",
									},
									{
										id: "2",
										itemName: "祭壇布（白）",
										category: "祭壇用品",
										currentStock: 3,
										minStock: 5,
										maxStock: 15,
										unit: "枚",
										lastUpdated: "2024-12-14",
										status: "不足",
									},
									{
										id: "3",
										itemName: "燭台",
										category: "祭壇用品",
										currentStock: 12,
										minStock: 8,
										maxStock: 20,
										unit: "個",
										lastUpdated: "2024-12-13",
										status: "適正",
									},
									{
										id: "4",
										itemName: "線香",
										category: "消耗品",
										currentStock: 2,
										minStock: 10,
										maxStock: 50,
										unit: "箱",
										lastUpdated: "2024-12-12",
										status: "不足",
									},
								].map((item) => (
									<div
										key={item.id}
										className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
									>
										<div className="flex justify-between items-start">
											<div className="space-y-2 flex-1">
												<div className="flex items-center gap-3">
													<h3 className="font-semibold">{item.itemName}</h3>
													<Badge variant="outline">{item.category}</Badge>
													<Badge
														variant={
															item.status === "適正"
																? "default"
																: item.status === "不足"
																	? "destructive"
																	: "secondary"
														}
													>
														{item.status}
													</Badge>
												</div>

												<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
													<div>
														<span className="text-muted-foreground">現在庫:</span>
														<span className="ml-2 font-medium text-lg">
															{item.currentStock} {item.unit}
														</span>
													</div>
													<div>
														<span className="text-muted-foreground">最小在庫:</span>
														<span className="ml-2">
															{item.minStock} {item.unit}
														</span>
													</div>
													<div>
														<span className="text-muted-foreground">最大在庫:</span>
														<span className="ml-2">
															{item.maxStock} {item.unit}
														</span>
													</div>
													<div>
														<span className="text-muted-foreground">更新日:</span>
														<span className="ml-2">{item.lastUpdated}</span>
													</div>
												</div>

												{/* 在庫レベル表示 */}
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className={`h-2 rounded-full ${
															item.status === "不足" ? "bg-red-500" : "bg-green-500"
														}`}
														style={{ width: `${(item.currentStock / item.maxStock) * 100}%` }}
													/>
												</div>
											</div>

											<div className="flex gap-2 ml-4">
												{item.status === "不足" && (
													<Button variant="outline" size="sm">
														<Plus className="h-4 w-4 mr-2" />
														発注
													</Button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</Container>
	);
}
