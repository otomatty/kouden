import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCustomer } from "@/app/_actions/funeral/customers/getCustomer";
import { EditCustomerClient } from "./_components/edit-customer-client";

interface EditCustomerPageProps {
	params: Promise<{
		customerId: string;
	}>;
}

export async function generateMetadata({ params }: EditCustomerPageProps): Promise<Metadata> {
	const { customerId } = await params;
	const result = await getCustomer(customerId);

	if (!result.success) {
		return {
			title: "顧客が見つかりません | 葬儀会社管理システム",
		};
	}

	if (!result.data) {
		return {
			title: "顧客が見つかりません | 葬儀会社管理システム",
		};
	}

	return {
		title: `${result.data.name} | 顧客編集 | 葬儀会社管理システム`,
		description: `${result.data.name}さんの顧客情報を編集`,
	};
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
	const { customerId } = await params;
	const result = await getCustomer(customerId);

	if (!result.success) {
		notFound();
	}

	if (!result.data) {
		notFound();
	}

	const customer = result.data;

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* ヘッダー */}
			<div className="flex items-center gap-4">
				<Link href={`/funeral-management/customers/${customer.id}`}>
					<Button variant="outline" size="icon">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">{customer.name}の編集</h1>
					<p className="text-muted-foreground mt-2">顧客情報を編集します</p>
				</div>
			</div>

			{/* 顧客編集フォーム */}
			<EditCustomerClient customer={customer} />
		</div>
	);
}
