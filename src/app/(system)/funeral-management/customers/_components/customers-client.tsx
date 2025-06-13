"use client";

import { useState, useMemo } from "react";
import { CustomerSearchFilter } from "./customer-search-filter";
import { CustomerList } from "./customer-list";
import type { Customer } from "@/types/funeral-management";

interface CustomersClientProps {
	initialCustomers: Customer[];
}

/**
 * 顧客管理のクライアントサイドロジック
 * 検索・フィルタリング状態管理を担当
 */
export function CustomersClient({ initialCustomers }: CustomersClientProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// 検索とフィルタリングロジック
	const filteredCustomers = useMemo(() => {
		return initialCustomers.filter((customer) => {
			const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase());
			const customerStatus = customer.details?.status || "アクティブ";
			const matchesStatus = statusFilter === "all" || getStatusKey(customerStatus) === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [initialCustomers, searchTerm, statusFilter]);

	// ステータスのキーを取得するヘルパー関数
	function getStatusKey(status: string): string {
		switch (status) {
			case "アクティブ":
				return "active";
			case "案件進行中":
				return "in-progress";
			case "フォロー中":
				return "follow-up";
			case "完了":
				return "completed";
			default:
				return "active";
		}
	}

	return (
		<div className="space-y-6">
			<CustomerSearchFilter
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				statusFilter={statusFilter}
				onStatusFilterChange={setStatusFilter}
			/>

			<CustomerList customers={filteredCustomers} totalCount={initialCustomers.length} />
		</div>
	);
}
