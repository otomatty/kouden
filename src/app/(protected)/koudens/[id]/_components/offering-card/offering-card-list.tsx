"use client";

import type { Offering } from "@/types/offering";
import { OfferingCard } from "./offering-card";

interface OfferingCardListProps {
	offerings: Offering[];
	onDelete?: () => void;
}

export function OfferingCardList({
	offerings,
	onDelete,
}: OfferingCardListProps) {
	if (offerings.length === 0) {
		return (
			<div className="text-center p-4 text-muted-foreground border rounded-lg">
				お供え物が登録されていません
			</div>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{offerings.map((offering) => (
				<OfferingCard
					key={offering.id}
					offering={offering}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
