import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ContactRequestsPagination } from "./contact-requests-pagination";
import { getContactRequests } from "@/app/_actions/admin/contact-requests";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Eye, Mail, User } from "lucide-react";

interface ContactRequestsTableProps {
	status?: string;
	category?: string;
	page: number;
}

const statusConfig = {
	new: { label: "新規", variant: "destructive" as const },
	in_progress: { label: "対応中", variant: "default" as const },
	closed: { label: "完了", variant: "secondary" as const },
};

const categoryConfig = {
	support: "サポート",
	account: "アカウント",
	bug: "バグ報告",
	feature: "機能要望",
	business: "法人相談",
	other: "その他",
};

export async function ContactRequestsTable({ status, category, page }: ContactRequestsTableProps) {
	const result = await getContactRequests({
		status,
		category,
		page,
		limit: 20,
	});

	if (result.data.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">お問い合わせが見つかりませんでした</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>カテゴリ</TableHead>
						<TableHead>お客様情報</TableHead>
						<TableHead>件名・内容</TableHead>
						<TableHead>ステータス</TableHead>
						<TableHead>作成日時</TableHead>
						<TableHead>操作</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{result.data.map((request) => (
						<TableRow key={request.id}>
							<TableCell className="font-mono text-xs">{request.id.slice(0, 8)}...</TableCell>
							<TableCell>
								<Badge variant="outline">
									{categoryConfig[request.category as keyof typeof categoryConfig] ||
										request.category}
								</Badge>
							</TableCell>
							<TableCell>
								<div className="space-y-1">
									<div className="flex items-center gap-1 text-sm">
										<User className="h-3 w-3" />
										{request.name || "未入力"}
									</div>
									<div className="flex items-center gap-1 text-sm text-gray-600">
										<Mail className="h-3 w-3" />
										{request.email}
									</div>
									{request.company_name && (
										<div className="text-xs text-gray-500">{request.company_name}</div>
									)}
								</div>
							</TableCell>
							<TableCell className="max-w-xs">
								<div className="space-y-1">
									{request.subject && (
										<div className="font-medium text-sm truncate">{request.subject}</div>
									)}
									<div className="text-sm text-gray-600 line-clamp-2">{request.message}</div>
								</div>
							</TableCell>
							<TableCell>
								<Badge
									variant={
										statusConfig[request.status as keyof typeof statusConfig]?.variant || "default"
									}
								>
									{statusConfig[request.status as keyof typeof statusConfig]?.label ||
										request.status}
								</Badge>
							</TableCell>
							<TableCell className="text-sm text-gray-600">
								{formatDistanceToNow(new Date(request.created_at), {
									addSuffix: true,
									locale: ja,
								})}
							</TableCell>
							<TableCell>
								<Button asChild variant="outline" size="sm">
									<Link href={`/admin/support/${request.id}`}>
										<Eye className="h-4 w-4 mr-1" />
										詳細
									</Link>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<ContactRequestsPagination
				currentPage={result.page}
				totalPages={result.totalPages}
				totalCount={result.count}
			/>
		</div>
	);
}
