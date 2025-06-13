import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CustomersClient } from "./_components/customers-client";
import type { Customer } from "@/types/funeral-management";

export const metadata: Metadata = {
	title: "顧客管理 | 葬儀会社管理システム",
	description: "顧客情報の管理と検索ができます。",
};

// サンプルデータ（実際はサーバーアクションやAPIから取得）
const sampleCustomers: Customer[] = [
	{
		id: "1",
		name: "田中 太郎",
		email: "tanaka@example.com",
		phone: "03-1234-5678",
		organization_id: "sample-org-1",
		created_at: "2024-01-15T09:00:00Z",
		updated_at: "2024-01-20T14:30:00Z",
		details: {
			id: "detail-1",
			customer_id: "1",
			address: "東京都港区赤坂1-1-1",
			religion: null,
			allergy: null,
			registration_date: "2024-01-15",
			last_contact_date: null,
			notes: null,
			status: "アクティブ",
			details_created_at: "2024-01-15T09:00:00Z",
			details_updated_at: "2024-01-20T14:30:00Z",
		},
	},
	{
		id: "2",
		name: "佐藤 花子",
		email: "sato@example.com",
		phone: "03-2345-6789",
		organization_id: "sample-org-1",
		created_at: "2024-02-01T10:00:00Z",
		updated_at: "2024-02-15T16:00:00Z",
		details: {
			id: "detail-2",
			customer_id: "2",
			address: "東京都新宿区新宿2-2-2",
			religion: null,
			allergy: null,
			registration_date: "2024-02-01",
			last_contact_date: "2024-02-15",
			notes: "来月の法要について相談中",
			status: "案件進行中",
			details_created_at: "2024-02-01T10:00:00Z",
			details_updated_at: "2024-02-15T16:00:00Z",
		},
	},
	{
		id: "3",
		name: "鈴木 一郎",
		email: "suzuki@example.com",
		phone: "03-3456-7890",
		organization_id: "sample-org-1",
		created_at: "2023-12-01T08:30:00Z",
		updated_at: "2024-01-10T13:15:00Z",
		details: {
			id: "detail-3",
			customer_id: "3",
			address: "東京都渋谷区渋谷3-3-3",
			religion: "仏教",
			allergy: null,
			registration_date: "2023-12-01",
			last_contact_date: "2024-01-10",
			notes: "年始のご挨拶をお送りした",
			status: "フォロー中",
			details_created_at: "2023-12-01T08:30:00Z",
			details_updated_at: "2024-01-10T13:15:00Z",
		},
	},
	{
		id: "4",
		name: "高橋 美智子",
		email: "takahashi@example.com",
		phone: "03-4567-8901",
		organization_id: "sample-org-1",
		created_at: "2023-11-15T11:00:00Z",
		updated_at: "2023-12-20T17:00:00Z",
		details: {
			id: "detail-4",
			customer_id: "4",
			address: "東京都世田谷区世田谷4-4-4",
			religion: null,
			allergy: "食物アレルギー（卵）",
			registration_date: "2023-11-15",
			last_contact_date: "2023-12-20",
			notes: "昨年末の案件完了、満足いただけた",
			status: "完了",
			details_created_at: "2023-11-15T11:00:00Z",
			details_updated_at: "2023-12-20T17:00:00Z",
		},
	},
];

export default function CustomersPage() {
	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">顧客管理</h1>
					<p className="text-muted-foreground mt-2">顧客情報の管理と検索ができます</p>
				</div>
				<Link href="/funeral-management/customers/new">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						新規顧客登録
					</Button>
				</Link>
			</div>

			{/* クライアントサイドコンポーネント */}
			<CustomersClient initialCustomers={sampleCustomers} />
		</div>
	);
}
