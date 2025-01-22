"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { OfferingForm } from "./offering-form";
import { useState } from "react";

interface OfferingDialogProps {
	koudenEntryId: string;
}

export function OfferingDialog({ koudenEntryId }: OfferingDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					お供え物を追加
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>お供え物を追加</DialogTitle>
				</DialogHeader>
				<OfferingForm
					koudenEntryId={koudenEntryId}
					onSuccess={() => setOpen(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
