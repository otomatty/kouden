import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Container from "@/components/ui/container";
import { Plus, Calendar, User, Clock, AlertTriangle, CheckCircle, Circle } from "lucide-react";
import Link from "next/link";

export default function TasksPage() {
	return (
		<Container className="py-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">タスク管理</h1>
				<Button asChild>
					<Link href="/funeral-management/tasks/create">
						<Plus className="h-4 w-4 mr-2" />
						新規タスク作成
					</Link>
				</Button>
			</div>

			{/* 統計カード */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">未着手</p>
								<p className="text-2xl font-bold">8件</p>
							</div>
							<Circle className="h-8 w-8 text-gray-400" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">進行中</p>
								<p className="text-2xl font-bold">12件</p>
							</div>
							<Clock className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">期限切れ</p>
								<p className="text-2xl font-bold">3件</p>
							</div>
							<AlertTriangle className="h-8 w-8 text-red-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">完了</p>
								<p className="text-2xl font-bold">45件</p>
							</div>
							<CheckCircle className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 検索・フィルター */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">検索・フィルター</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<div className="flex-1">
							<Input placeholder="タスク名・担当者で検索..." className="w-full" />
						</div>
						<select className="px-3 py-2 border rounded-md">
							<option value="">全ステータス</option>
							<option value="pending">未着手</option>
							<option value="in-progress">進行中</option>
							<option value="overdue">期限切れ</option>
							<option value="completed">完了</option>
						</select>
						<select className="px-3 py-2 border rounded-md">
							<option value="">全担当者</option>
							<option value="yamada">山田主任</option>
							<option value="sato">佐藤係長</option>
							<option value="tanaka">田中課長</option>
						</select>
					</div>
				</CardContent>
			</Card>

			{/* タスク一覧 */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle>タスク一覧</CardTitle>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" asChild>
								<Link href="/funeral-management/tasks/schedule">
									<Calendar className="h-4 w-4 mr-2" />
									スケジュール表示
								</Link>
							</Button>
							<Button variant="outline" size="sm" asChild>
								<Link href="/funeral-management/tasks/assignments">
									<User className="h-4 w-4 mr-2" />
									スタッフアサイン
								</Link>
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* サンプルデータ */}
						{[
							{
								id: "1",
								title: "田中敏雄様 祭壇設営",
								description: "A室にて祭壇設営、花輪配置確認",
								assignedTo: "山田主任",
								dueDate: "2024-12-20",
								status: "進行中",
								priority: "高",
								caseId: "1",
								deceasedName: "田中敏雄",
							},
							{
								id: "2",
								title: "山田一郎様 会場準備",
								description: "○○寺院での会場設営、音響確認",
								assignedTo: "佐藤係長",
								dueDate: "2024-12-18",
								status: "期限切れ",
								priority: "高",
								caseId: "2",
								deceasedName: "山田一郎",
							},
							{
								id: "3",
								title: "佐藤みどり様 書類準備",
								description: "火葬許可証等の必要書類準備",
								assignedTo: "田中課長",
								dueDate: "2024-12-16",
								status: "完了",
								priority: "中",
								caseId: "3",
								deceasedName: "佐藤みどり",
							},
							{
								id: "4",
								title: "新規顧客フォローアップ",
								description: "鈴木様への初回相談結果フォロー",
								assignedTo: "山田主任",
								dueDate: "2024-12-22",
								status: "未着手",
								priority: "中",
								caseId: null,
								deceasedName: null,
							},
						].map((task) => (
							<div
								key={task.id}
								className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-3 flex-1">
										<div className="flex items-center gap-3">
											<h3 className="font-semibold text-lg">{task.title}</h3>
											<Badge
												variant={
													task.status === "完了"
														? "default"
														: task.status === "進行中"
															? "secondary"
															: task.status === "期限切れ"
																? "destructive"
																: "outline"
												}
											>
												{task.status}
											</Badge>
											<Badge
												variant={
													task.priority === "高"
														? "destructive"
														: task.priority === "中"
															? "secondary"
															: "outline"
												}
											>
												{task.priority}
											</Badge>
										</div>

										<p className="text-sm text-muted-foreground">{task.description}</p>

										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
											<div className="flex items-center gap-2">
												<User className="h-4 w-4 text-muted-foreground" />
												<span>担当: {task.assignedTo}</span>
											</div>
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<span>期限: {task.dueDate}</span>
											</div>
											{task.deceasedName && (
												<div>
													<span className="text-muted-foreground">関連案件:</span>
													<span className="ml-2 font-medium">{task.deceasedName} 様</span>
												</div>
											)}
										</div>
									</div>

									<div className="flex gap-2 ml-4">
										{task.status !== "完了" && (
											<Button variant="outline" size="sm">
												<CheckCircle className="h-4 w-4" />
											</Button>
										)}
										<Button variant="outline" size="sm" asChild>
											<Link href={`/funeral-management/tasks/${task.id}/edit`}>
												<Calendar className="h-4 w-4" />
											</Link>
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</Container>
	);
}
