"use client";

import { useEffect, useState } from "react";
import { getKoudenMembers } from "@/app/_actions/members";
import { getKoudenRoles } from "@/app/_actions/roles";
import { ShareLinkForm } from "./share-link-form";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import type { KoudenMember } from "@/types/member";
import type { KoudenRole } from "@/types/role";

interface MemberTableProps {
	koudenId: string;
}

export function MemberTable({ koudenId }: MemberTableProps) {
	const [members, setMembers] = useState<KoudenMember[]>([]);
	const [roles, setRoles] = useState<KoudenRole[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);
				const [membersData, rolesData] = await Promise.all([
					getKoudenMembers(koudenId),
					getKoudenRoles(koudenId),
				]);
				setMembers(membersData);
				setRoles(rolesData);
			} catch (error) {
				console.error("[ERROR] Failed to load data:", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, [koudenId]);

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<ShareLinkForm koudenId={koudenId} roles={roles} />
			</div>
			<DataTable columns={columns} data={members} isLoading={isLoading} />
		</div>
	);
}
