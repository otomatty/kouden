import { Suspense } from "react";
import { ReturnItemCardList } from "./_components/return-item-card-list";
import { ReturnItemDialog } from "./_components/return-item-dialog";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ReturnItemsPage({ params }: Props) {
	const { id } = await params;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">返礼品</h2>
				<ReturnItemDialog koudenId={id} />
			</div>
			<ReturnItemCardList koudenId={id} />
		</div>
	);
}
