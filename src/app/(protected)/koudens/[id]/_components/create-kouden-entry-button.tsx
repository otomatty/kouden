"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { useRouter } from "next/navigation";
import type {
	CreateKoudenEntryInput,
	KoudenEntryResponse,
} from "@/types/actions";

interface CreateKoudenEntryButtonProps {
	koudenId: string;
	createKoudenEntry: (
		input: CreateKoudenEntryInput,
	) => Promise<KoudenEntryResponse>;
}

export function CreateKoudenEntryButton({
	koudenId,
	createKoudenEntry,
}: CreateKoudenEntryButtonProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState("");
	const [organization, setOrganization] = useState("");
	const [amount, setAmount] = useState("");
	const [attendanceType, setAttendanceType] = useState<
		"FUNERAL" | "CONDOLENCE_VISIT" | null
	>("FUNERAL");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await createKoudenEntry({
				kouden_id: koudenId,
				name,
				organization,
				amount: Number(amount),
				attendance_type: attendanceType as
					| "FUNERAL"
					| "CONDOLENCE_VISIT"
					| null,
				has_offering: false,
				is_return_completed: false,
				address,
				phone_number: phone,
				notes,
			});
			router.refresh();
			setOpen(false);
		} catch (error) {
			console.error("Failed to create entry:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>香典情報を登録</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>香典情報の登録</DialogTitle>
					<DialogDescription>新しい香典情報を登録します。</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								ご芳名
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
							<Label htmlFor="organization" className="text-right">
								所属
							</Label>
							<Input
								id="organization"
								value={organization}
								onChange={(e) => setOrganization(e.target.value)}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="amount" className="text-right">
								金額
							</Label>
							<Input
								id="amount"
								type="number"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="attendance-type" className="text-right">
								参列
							</Label>
							<Select
								value={attendanceType || ""}
								onValueChange={(value: "FUNERAL" | "CONDOLENCE_VISIT") =>
									setAttendanceType(value)
								}
							>
								<SelectTrigger id="attendance-type" className="col-span-3">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="FUNERAL">葬儀</SelectItem>
									<SelectItem value="CONDOLENCE_VISIT">弔問</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="address" className="text-right">
								住所
							</Label>
							<Input
								id="address"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="phone" className="text-right">
								電話番号
							</Label>
							<Input
								id="phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
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
