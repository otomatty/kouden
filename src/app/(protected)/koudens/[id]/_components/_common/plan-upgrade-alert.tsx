import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";

interface PlanUpgradeAlertProps {
	remainingDays: number;
	koudenId: string;
	onClose: () => void;
}

export default function PlanUpgradeAlert({
	remainingDays,
	koudenId,
	onClose,
}: PlanUpgradeAlertProps) {
	return (
		<Alert className="w-full p-3 sm:p-4">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<AlertTitle className="text-sm sm:text-base">プランの切り替え</AlertTitle>
					<AlertDescription className="mt-1 text-xs sm:text-sm leading-relaxed">
						無料プランの残り期間はあと{remainingDays}
						日です。期間内にデータを入力し、PDFをダウンロードできます。
					</AlertDescription>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0"
				>
					<X className="h-3 w-3 sm:h-4 sm:w-4" />
				</Button>
			</div>
			<div className="mt-3 sm:mt-4">
				<Button size="sm" asChild className="w-full sm:w-auto text-xs sm:text-sm">
					<Link href={`/purchase/${koudenId}`}>プランを切り替える</Link>
				</Button>
			</div>
		</Alert>
	);
}
