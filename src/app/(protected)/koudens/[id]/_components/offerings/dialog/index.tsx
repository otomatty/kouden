"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OfferingForm } from "./offering-form";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import type { KoudenEntry } from "@/types/kouden";
import { useMediaQuery } from "@/hooks/use-media-query";

interface OfferingDialogProps {
	koudenId: string;
	koudenEntries: KoudenEntry[];
	onSuccess?: () => void;
}

export function OfferingDialog({
	koudenId,
	koudenEntries,
	onSuccess,
}: OfferingDialogProps) {
	const [open, setOpen] = useState(false);
	const isMobile = useMediaQuery("(max-width: 768px)");

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button
					size={isMobile ? "lg" : "default"}
					className={
						isMobile
							? "w-full mx-4 flex items-center gap-2"
							: "flex items-center gap-2"
					}
				>
					<Plus className={isMobile ? "h-6 w-6" : "h-4 w-4"} />
					<span>お供え物を追加</span>
				</Button>
			}
			title="お供え物を追加"
			contentClassName="max-w-2xl"
		>
			<OfferingForm
				koudenId={koudenId}
				koudenEntries={koudenEntries}
				onSuccess={() => {
					setOpen(false);
					onSuccess?.();
				}}
			/>
		</ResponsiveDialog>
	);
}
