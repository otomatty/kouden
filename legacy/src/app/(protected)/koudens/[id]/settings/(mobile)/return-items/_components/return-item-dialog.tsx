"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ReturnItemForm } from "./return-item-form";
import type { ReturnItem } from "@/types/return-records/return-items";

type Props = {
	koudenId: string;
	returnItem?: ReturnItem;
};

export function ReturnItemDialog({ koudenId, returnItem }: Props) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant={returnItem ? "ghost" : "default"} size={returnItem ? "sm" : "default"}>
					<Plus className="mr-2 h-4 w-4" />
					{returnItem ? "編集" : "返礼品を追加"}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{returnItem ? "返礼品を編集" : "返礼品を追加"}</DialogTitle>
					<DialogDescription>
						{returnItem ? "返礼品情報を編集します" : "新しい返礼品を追加します"}
					</DialogDescription>
				</DialogHeader>
				<ReturnItemForm
					koudenId={koudenId}
					returnItem={returnItem}
					onSuccess={() => setOpen(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
