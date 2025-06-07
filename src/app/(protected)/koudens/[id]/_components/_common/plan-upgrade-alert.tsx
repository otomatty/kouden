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
		<Alert className="w-full flex flex-col space-y-4">
			<div className="flex w-full items-start justify-between">
				<div className="flex-1">
					<AlertTitle>プランのアップグレード</AlertTitle>
					<AlertDescription>
						無料プランの残り期間はあと{remainingDays}
						日です。期間内にデータを入力し、PDFをダウンロードできます。
					</AlertDescription>
				</div>
				<Button variant="ghost" size="icon" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
				<Button size="sm" asChild>
					<Link href={`/koudens/${koudenId}/purchase`}>アップグレード</Link>
				</Button>
			</div>
		</Alert>
	);
}
