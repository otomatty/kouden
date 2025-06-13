import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewCustomerClient } from "./_components/new-customer-client";
import { getCurrentUserOrganizationId } from "@/utils/auth";

export const metadata: Metadata = {
	title: "新規顧客登録 | 葬儀会社管理システム",
	description: "新しい顧客を登録します。",
};

export default async function NewCustomerPage() {
	const organizationId = await getCurrentUserOrganizationId();

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center gap-4">
				<Link href="/funeral-management/customers">
					<Button variant="outline" size="icon">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">新規顧客登録</h1>
					<p className="text-muted-foreground mt-2">新しい顧客の情報を登録します</p>
				</div>
			</div>

			{/* 顧客登録フォーム */}
			<NewCustomerClient organizationId={organizationId} />
		</div>
	);
}
