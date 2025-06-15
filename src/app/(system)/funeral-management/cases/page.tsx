import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CasesClient } from "./_components/cases-client";
import type { FuneralCaseWithDetails } from "@/types/funeral-management";

export const metadata: Metadata = {
	title: "葬儀案件管理 | 葬儀会社管理システム",
	description: "葬儀案件の管理と進捗確認ができます。",
};

// サンプルデータ（実際はサーバーアクションやAPIから取得）
const sampleCases: FuneralCaseWithDetails[] = [
	{
		id: "1",
		customer_id: "1",
		deceased_name: "田中 一郎",
		venue: "○○会館 A室",
		start_datetime: "2024-01-25T10:00:00Z",
		status: "準備中",
		organization_id: "sample-org-1",
		created_at: "2024-01-15T09:00:00Z",
		updated_at: "2024-01-20T14:30:00Z",
		assigned_staff: "山田主任",
		budget: 800000,
	},
	{
		id: "2",
		customer_id: "2",
		deceased_name: "佐藤 花子",
		venue: "△△寺院",
		start_datetime: "2024-02-10T14:00:00Z",
		status: "施行中",
		organization_id: "sample-org-1",
		created_at: "2024-01-20T10:00:00Z",
		updated_at: "2024-02-05T16:00:00Z",
		assigned_staff: "佐藤係長",
		budget: 1200000,
	},
	{
		id: "3",
		customer_id: "3",
		deceased_name: "鈴木 三郎",
		venue: "□□斎場",
		start_datetime: "2024-01-30T09:00:00Z",
		status: "要注意",
		organization_id: "sample-org-1",
		created_at: "2024-01-18T11:00:00Z",
		updated_at: "2024-01-28T13:15:00Z",
		assigned_staff: "田中課長",
		budget: 950000,
	},
	{
		id: "4",
		customer_id: "4",
		deceased_name: "高橋 美智子",
		venue: "○○ホール",
		start_datetime: "2023-12-20T10:00:00Z",
		status: "完了",
		organization_id: "sample-org-1",
		created_at: "2023-12-10T08:30:00Z",
		updated_at: "2023-12-22T17:00:00Z",
		assigned_staff: "高田部長",
		budget: 1100000,
	},
];

export default function CasesPage() {
	return (
		<Container className="py-6 space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">葬儀案件管理</h1>
					<p className="text-muted-foreground mt-2">葬儀案件の管理と進捗確認ができます</p>
				</div>
				<Link href="/funeral-management/cases/new">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						新規案件登録
					</Button>
				</Link>
			</div>

			{/* クライアントサイドコンポーネント */}
			<CasesClient initialCases={sampleCases} />
		</Container>
	);
}
