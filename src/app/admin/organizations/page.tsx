import React from "react";
import Container from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { AdminOrganizationsTable } from "./_components/AdminOrganizationsTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface OrgRequest {
	id: string;
	name: string;
	requested_by: string;
	status: string;
	type?: string;
}

export default async function AdminOrganizationsPage() {
	const supabase = await createClient();
	const { data: requests } = await supabase
		.from("organizations")
		.select("id, name, requested_by, status")
		.eq("status", "pending");

	const pendingRows: OrgRequest[] = requests ?? [];

	const { data: activeData } = await supabase
		.from("organizations")
		.select("id, name, requested_by, status, organization_types(name)")
		.eq("status", "active");
	const activeRows: OrgRequest[] = (activeData ?? []).map((row) => ({
		id: row.id,
		name: row.name,
		requested_by: row.requested_by,
		status: row.status,
		type: row.organization_types.name,
	}));

	const allColumns: ColumnDef<OrgRequest, unknown>[] = [
		{ accessorKey: "id", header: "ID" },
		{ accessorKey: "name", header: "組織名" },
		{ accessorKey: "type", header: "タイプ" },
		{ accessorKey: "status", header: "ステータス" },
	];

	return (
		<Container className="py-8">
			<h1 className="text-xl font-bold mb-4">組織管理</h1>
			<Tabs defaultValue="pending">
				<TabsList>
					<TabsTrigger value="pending">申請中</TabsTrigger>
					<TabsTrigger value="active">組織一覧</TabsTrigger>
				</TabsList>
				<TabsContent value="pending">
					<AdminOrganizationsTable data={pendingRows} />
				</TabsContent>
				<TabsContent value="active">
					<DataTable columns={allColumns} data={activeRows} />
				</TabsContent>
			</Tabs>
		</Container>
	);
}
