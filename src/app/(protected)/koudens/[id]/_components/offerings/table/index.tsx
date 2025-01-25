"use client";

import type { Offering } from "@/types/offering";
import { columns } from "./columns";
import { DataTable } from "./data-table";

interface OfferingTableProps {
	offerings: Offering[];
}

export function OfferingTable({ offerings }: OfferingTableProps) {
	return (
		<div className="container mx-auto py-10">
			<DataTable columns={columns} data={offerings} />
		</div>
	);
}
