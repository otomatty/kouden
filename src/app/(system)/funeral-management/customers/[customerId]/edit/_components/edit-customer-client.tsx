"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/funeral/customer-form";
import { updateCustomer } from "@/app/_actions/funeral/customers/updateCustomer";
import type {
	Customer,
	CreateCustomerInput,
	UpdateCustomerInput,
} from "@/types/funeral-management";

interface EditCustomerClientProps {
	customer: Customer;
}

/**
 * 顧客編集のクライアントサイドコンポーネント
 * Server Actionの呼び出しとナビゲーションを管理
 */
export function EditCustomerClient({ customer }: EditCustomerClientProps) {
	const router = useRouter();

	const handleSubmit = async (data: CreateCustomerInput | UpdateCustomerInput) => {
		// 編集モードなのでUpdateCustomerInputとして扱う
		const updateData = data as UpdateCustomerInput;
		const result = await updateCustomer(updateData);
		if (result.success) {
			router.push(`/funeral-management/customers/${customer.id}`);
		}
		return result;
	};

	const handleCancel = () => {
		router.push(`/funeral-management/customers/${customer.id}`);
	};

	return (
		<CustomerForm
			customer={customer}
			organizationId={customer.organization_id}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			mode="edit"
		/>
	);
}
