"use client";

import React from "react";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { approveOrganization, rejectOrganization } from "@/app/_actions/organizationRequests";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type OrgRequest = {
	id: string;
	name: string;
	requested_by: string;
	status: string;
};

interface AdminOrganizationsTableProps {
	data: OrgRequest[];
}

export function AdminOrganizationsTable({ data }: AdminOrganizationsTableProps) {
	const router = useRouter();
	const [isPending, startTransition] = React.useTransition();
	const handleApprove = (id: string) => {
		startTransition(async () => {
			await approveOrganization(id);
			toast.success("承認しました");
			router.refresh();
		});
	};
	const handleReject = (id: string) => {
		startTransition(async () => {
			await rejectOrganization(id);
			toast.error("却下しました");
			router.refresh();
		});
	};
	const columns: ColumnDef<OrgRequest, unknown>[] = [
		{ accessorKey: "id", header: "ID" },
		{ accessorKey: "name", header: "組織名" },
		{ accessorKey: "requested_by", header: "申請者ID" },
		{ accessorKey: "status", header: "ステータス" },
		{
			id: "actions",
			header: "操作",
			cell: ({ row }) => {
				const org = row.original;
				return (
					<div className="flex space-x-2">
						<Button size="sm" onClick={() => handleApprove(org.id)} disabled={isPending}>
							承認
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => handleReject(org.id)}
							disabled={isPending}
						>
							却下
						</Button>
					</div>
				);
			},
		},
	];

	return <DataTable columns={columns} data={data} />;
}
