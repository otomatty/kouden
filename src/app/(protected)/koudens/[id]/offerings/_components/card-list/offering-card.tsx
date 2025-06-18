// library
import { useState } from "react";
import { useAtomValue } from "jotai";
// ui
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";

// types
import type { OfferingWithKoudenEntries, OfferingType } from "@/types/offerings";
import type { Entry } from "@/types/entries";
// utils
import { formatCurrency } from "@/utils/currency";
// components
import { OfferingDrawerContent } from "./offering-drawer-content";
// stores
import { mergedOfferingsAtom } from "@/store/offerings";

const typeLabels: Record<OfferingType, string> = {
	FLOWER: "供花",
	FOOD: "供物",
	OTHER: "その他",
	INCENSE: "線香",
	MONEY: "御供物量",
};

interface OfferingCardProps {
	offering: OfferingWithKoudenEntries;
	koudenId: string;
	entries: Entry[];
}

export function OfferingCard({ offering: initialOffering, koudenId }: OfferingCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const mergedOfferings = useAtomValue(mergedOfferingsAtom);

	// 最新の提供物情報を取得（楽観的更新を含む）
	const offering = mergedOfferings.find((o) => o.id === initialOffering.id) || initialOffering;

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				<Card className="w-full hover:bg-accent/50 transition-colors cursor-pointer">
					<CardContent className="p-4">
						<div className="flex justify-between items-center">
							<div className="space-y-1.5 flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="font-medium text-lg truncate">
										{offering.providerName || "提供者名未設定"}
									</h3>
									<Badge variant="outline" className="font-normal">
										{typeLabels[offering.type as OfferingType]}
									</Badge>
								</div>
								{offering.description && (
									<p className="text-sm text-muted-foreground truncate">{offering.description}</p>
								)}
								{offering.price && (
									<p className="text-2xl font-bold">{formatCurrency(offering.price)}</p>
								)}
							</div>
							<div className="flex flex-col items-end gap-2 ml-4">
								<Badge variant="secondary" className="whitespace-nowrap">
									{offering.quantity}点
								</Badge>
								<ChevronRight className="h-5 w-5 text-muted-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>
			</DrawerTrigger>

			{/* Drawer Content */}
			<OfferingDrawerContent
				offering={offering}
				koudenId={koudenId}
				onClose={() => setIsOpen(false)}
			/>
		</Drawer>
	);
}
