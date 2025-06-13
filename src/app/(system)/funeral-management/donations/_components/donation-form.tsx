"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { recordDonation } from "@/app/_actions/funeral/donations/recordDonation";
import { updateDonation } from "@/app/_actions/funeral/donations/updateDonation";
import type { Donation } from "@/types/funeral-management";

interface DonationFormProps {
	cases: Array<{
		id: string;
		deceased_name: string;
		venue: string | null;
		status: string | null;
	}>;
	selectedCaseId?: string;
	donation?: Donation;
	mode?: "create" | "edit";
}

export function DonationForm({
	cases,
	selectedCaseId,
	donation,
	mode = "create",
}: DonationFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		caseId: selectedCaseId || donation?.case_id || "",
		donorName: donation?.donor_name || "",
		amount: donation?.amount?.toString() || "",
		receivedAt: donation?.received_at
			? new Date(donation.received_at).toISOString().slice(0, 16)
			: new Date().toISOString().slice(0, 16),
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.caseId) {
			toast.error("葬儀案件を選択してください");
			return;
		}

		if (!formData.amount || Number(formData.amount) <= 0) {
			toast.error("正しい金額を入力してください");
			return;
		}

		setIsLoading(true);

		try {
			if (mode === "create") {
				await recordDonation({
					caseId: formData.caseId,
					donorName: formData.donorName || "匿名",
					amount: Number(formData.amount),
					receivedAt: formData.receivedAt,
				});
				toast.success("香典記録を登録しました");
			} else if (donation) {
				await updateDonation({
					id: donation.id,
					donorName: formData.donorName || "匿名",
					amount: Number(formData.amount),
					receivedAt: formData.receivedAt,
				});
				toast.success("香典記録を更新しました");
			}

			router.push("/funeral-management/donations");
			router.refresh();
		} catch (error) {
			console.error("Error saving donation:", error);
			toast.error("保存に失敗しました");
		} finally {
			setIsLoading(false);
		}
	};

	const selectedCase = cases.find((c) => c.id === formData.caseId);

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* 案件選択 */}
			<div className="space-y-2">
				<Label htmlFor="caseId">葬儀案件 *</Label>
				<Select
					value={formData.caseId}
					onValueChange={(value) => setFormData((prev) => ({ ...prev, caseId: value }))}
					disabled={!!selectedCaseId || mode === "edit"}
				>
					<SelectTrigger>
						<SelectValue placeholder="案件を選択してください" />
					</SelectTrigger>
					<SelectContent>
						{cases.map((funeralCase) => (
							<SelectItem key={funeralCase.id} value={funeralCase.id}>
								{funeralCase.deceased_name}様の葬儀
								{funeralCase.venue && ` (${funeralCase.venue})`}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{selectedCase && (
					<p className="text-sm text-muted-foreground">
						会場: {selectedCase.venue || "未設定"} | ステータス: {selectedCase.status || "未設定"}
					</p>
				)}
			</div>

			{/* 寄付者名 */}
			<div className="space-y-2">
				<Label htmlFor="donorName">寄付者名</Label>
				<Input
					id="donorName"
					type="text"
					placeholder="寄付者のお名前（空欄の場合は「匿名」として記録されます）"
					value={formData.donorName}
					onChange={(e) => setFormData((prev) => ({ ...prev, donorName: e.target.value }))}
				/>
			</div>

			{/* 金額 */}
			<div className="space-y-2">
				<Label htmlFor="amount">金額 *</Label>
				<div className="relative">
					<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
						¥
					</span>
					<Input
						id="amount"
						type="number"
						min="1"
						step="1"
						placeholder="0"
						className="pl-8"
						value={formData.amount}
						onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
						required
					/>
				</div>
			</div>

			{/* 受付日時 */}
			<div className="space-y-2">
				<Label htmlFor="receivedAt">受付日時</Label>
				<Input
					id="receivedAt"
					type="datetime-local"
					value={formData.receivedAt}
					onChange={(e) => setFormData((prev) => ({ ...prev, receivedAt: e.target.value }))}
				/>
			</div>

			{/* アクションボタン */}
			<div className="flex gap-4 pt-4">
				<Button type="submit" disabled={isLoading}>
					{isLoading ? "保存中..." : mode === "create" ? "記録を作成" : "記録を更新"}
				</Button>
				<Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
					キャンセル
				</Button>
			</div>
		</form>
	);
}
