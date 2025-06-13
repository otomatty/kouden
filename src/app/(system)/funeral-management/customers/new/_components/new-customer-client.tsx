"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/funeral/customer-form";
import { createCustomer } from "@/app/_actions/funeral/customers/createCustomer";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/types/funeral-management";

interface NewCustomerClientProps {
	organizationId: string;
}

/**
 * 新規顧客登録のクライアントサイドコンポーネント
 * Server Actionの呼び出しとナビゲーションを管理
 */
export function NewCustomerClient({ organizationId }: NewCustomerClientProps) {
	const router = useRouter();

	const handleSubmit = async (data: CreateCustomerInput | UpdateCustomerInput) => {
		// 新規作成モードなのでCreateCustomerInputとして扱う
		const createData = data as CreateCustomerInput;
		const result = await createCustomer(createData);
		if (result.success) {
			router.push("/funeral-management/customers");
		}
		return result;
	};

	const handleCancel = () => {
		router.push("/funeral-management/customers");
	};

	return (
		<CustomerForm
			organizationId={organizationId}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			mode="create"
		/>
	);
}
