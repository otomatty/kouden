"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/types/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
	CreateOfferingInput,
	UpdateOfferingInput,
	OfferingResponse,
} from "@/types/actions";

type KoudenEntry = Database["public"]["Tables"]["kouden_entries"]["Row"] & {
	offerings: Database["public"]["Tables"]["offerings"]["Row"][];
};

interface OfferingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	entry: KoudenEntry;
	createOffering: (input: CreateOfferingInput) => Promise<OfferingResponse>;
	updateOffering: (
		id: string,
		input: UpdateOfferingInput,
	) => Promise<OfferingResponse>;
	deleteOffering: (id: string, koudenEntryId: string) => Promise<void>;
}

export function OfferingDialog({
	open,
	onOpenChange,
	entry,
	createOffering,
	updateOffering,
	deleteOffering,
}: OfferingDialogProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [type, setType] = useState<"FLOWER" | "FOOD" | "OTHER">("FLOWER");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await createOffering({
				kouden_entry_id: entry.id,
				type,
				description,
				price: Number(price),
				notes,
			});
			router.refresh();
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to create offering:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>お供え物の登録</DialogTitle>
					<DialogDescription>
						{entry.name}様からのお供え物を登録します。
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="type" className="text-right">
								種類
							</Label>
							<Select
								value={type}
								onValueChange={(value: "FLOWER" | "FOOD" | "OTHER") =>
									setType(value)
								}
							>
								<SelectTrigger id="type" className="col-span-3">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="FLOWER">供花</SelectItem>
									<SelectItem value="FOOD">供物</SelectItem>
									<SelectItem value="OTHER">その他</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="description" className="text-right">
								内容
							</Label>
							<Input
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="price" className="text-right">
								金額
							</Label>
							<Input
								id="price"
								type="number"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="notes" className="text-right">
								備考
							</Label>
							<Textarea
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="col-span-3"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={loading}>
							{loading ? "登録中..." : "登録"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
