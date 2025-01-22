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
