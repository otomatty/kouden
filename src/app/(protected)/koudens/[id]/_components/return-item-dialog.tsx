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
	CreateReturnItemInput,
	UpdateReturnItemInput,
	ReturnItemResponse,
} from "@/types/actions";

type KoudenEntry = Database["public"]["Tables"]["kouden_entries"]["Row"] & {
	return_items: Database["public"]["Tables"]["return_items"]["Row"][];
};

interface ReturnItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	entry: KoudenEntry;
	createReturnItem: (
		input: CreateReturnItemInput,
	) => Promise<ReturnItemResponse>;
	updateReturnItem: (
		id: string,
		input: UpdateReturnItemInput,
	) => Promise<ReturnItemResponse>;
	deleteReturnItem: (id: string, koudenEntryId: string) => Promise<void>;
}

export function ReturnItemDialog({
	open,
	onOpenChange,
	entry,
	createReturnItem,
	updateReturnItem,
	deleteReturnItem,
}: ReturnItemDialogProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState("");
	const [price, setPrice] = useState("");
	const [deliveryMethod, setDeliveryMethod] = useState<
		"shipping" | "hand_delivery"
	>("shipping");
	const [sentDate, setSentDate] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await createReturnItem({
				kouden_entry_id: entry.id,
				name,
				price: Number(price),
				delivery_method: deliveryMethod === "shipping" ? "DELIVERY" : "HAND",
				sent_date: sentDate || undefined,
				notes,
			});
			router.refresh();
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to create return item:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>香典返しの登録</DialogTitle>
					<DialogDescription>
						{entry.name}様への香典返しを登録します。
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								品名
							</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
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
							<Label htmlFor="delivery-method" className="text-right">
								配送方法
							</Label>
							<Select
								value={deliveryMethod}
								onValueChange={(value: "shipping" | "hand_delivery") =>
									setDeliveryMethod(value)
								}
							>
								<SelectTrigger id="delivery-method" className="col-span-3">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="shipping">郵送</SelectItem>
									<SelectItem value="hand_delivery">手渡し</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="sent-date" className="text-right">
								送付日
							</Label>
							<Input
								id="sent-date"
								type="date"
								value={sentDate}
								onChange={(e) => setSentDate(e.target.value)}
								className="col-span-3"
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
