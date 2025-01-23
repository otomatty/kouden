"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OfferingForm } from "./offering-form";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import type { KoudenEntry } from "@/types/kouden";
import { useAtom } from "jotai";
import { offeringFormAtom } from "./atoms";

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
	const [savedFormState] = useAtom(offeringFormAtom);

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button className="flex items-center gap-2">
					<Plus className="h-4 w-4" />
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
