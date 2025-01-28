"use client";

import type { Offering } from "@/types/offering";
import { createColumns } from "./columns";
import { DataTable } from "./data-table";
import { deleteOffering, updateOffering } from "@/app/_actions/offerings";
import { toast } from "@/hooks/use-toast";
import type { KoudenEntry } from "@/types/kouden";

interface OfferingTableProps {
	offerings: Offering[];
	koudenId: string;
	koudenEntries: KoudenEntry[];
}

export function OfferingTable({
	offerings,
	koudenId,
	koudenEntries,
}: OfferingTableProps) {
	const handleUpdate = async (id: string, data: Partial<Offering>) => {
		try {
			const sanitizedData = Object.fromEntries(
				Object.entries(data).map(([key, value]) => [
					key,
					value === null ? undefined : value,
				]),
			);
			await updateOffering(id, sanitizedData);
			toast({
				title: "更新完了",
				description: "お供え物の情報を更新しました",
			});
		} catch (error) {
			toast({
				title: "エラーが発生しました",
				description: "お供え物の更新に失敗しました",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (ids: string[]) => {
		try {
			await Promise.all(ids.map((id) => deleteOffering(id)));
			toast({
				title: "削除完了",
				description: `${ids.length}件のお供え物を削除しました`,
			});
		} catch (error) {
			toast({
				title: "エラーが発生しました",
				description: "お供え物の削除に失敗しました",
				variant: "destructive",
			});
		}
	};

	const columns = createColumns({
		onEditRow: () => {},
		onCellUpdate: () => {},
		onCellEdit: async () => Promise.resolve(),
		onDeleteRows: handleDelete,
		selectedRows: [],
	});

	return (
		<DataTable
			columns={columns}
			data={offerings}
			koudenId={koudenId}
			koudenEntries={koudenEntries}
			onUpdate={handleUpdate}
			onDelete={handleDelete}
		/>
	);
}
