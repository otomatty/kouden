"use client";

import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { AttendanceType } from "@/types/kouden";
import { formatCurrency, formatInputCurrency } from "@/utils/currency";
import { formatPostalCode, searchAddress } from "./entry-form";
import {
	entryFormAtom,
	updateEntryFormAtom,
	addressSearchStateAtom,
} from "@/store/entries";

const attendanceTypeMap: Record<AttendanceType, string> = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "香典のみ",
} as const;

export function EntryFormBasic() {
	const [formData, setFormData] = useAtom(entryFormAtom);
	const updateForm = useSetAtom(updateEntryFormAtom);
	const [addressSearchState, setAddressSearchState] = useAtom(
		addressSearchStateAtom,
	);

	// 郵便番号が変更されたら住所を自動入力
	useEffect(() => {
		const fetchAddress = async () => {
			// 住所が既に入力されている場合は検索しない
			if (formData.address) return;

			// 7桁の数字のみの場合に検索
			if (formData.postal_code?.replace(/[^\d]/g, "").length === 7) {
				setAddressSearchState({ isSearching: true, error: null });
				try {
					const address = await searchAddress(formData.postal_code);
					if (address) {
						updateForm({ field: "address", value: address });
						toast({
							title: "住所を自動入力しました",
							description: address,
						});
					} else {
						toast({
							title: "住所が見つかりませんでした",
							description: "郵便番号を確認してください",
						});
					}
				} catch (error) {
					setAddressSearchState({
						isSearching: false,
						error: "住所の検索に失敗しました",
					});
				} finally {
					setAddressSearchState({ isSearching: false, error: null });
				}
			}
		};
		fetchAddress();
	}, [
		formData.postal_code,
		formData.address,
		updateForm,
		setAddressSearchState,
	]);

	return (
		<div className="grid gap-4">
			<div className="grid gap-2">
				<Label htmlFor="name">ご芳名</Label>
				<Input
					id="name"
					value={formData.name || ""}
					onChange={(e) => updateForm({ field: "name", value: e.target.value })}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="grid gap-2">
					<Label htmlFor="organization">団体名</Label>
					<Input
						id="organization"
						value={formData.organization || ""}
						onChange={(e) =>
							updateForm({ field: "organization", value: e.target.value })
						}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="position">役職</Label>
					<Input
						id="position"
						value={formData.position || ""}
						onChange={(e) =>
							updateForm({ field: "position", value: e.target.value })
						}
					/>
				</div>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="postal_code">郵便番号</Label>
				<Input
					id="postal_code"
					value={formData.postal_code || ""}
					onChange={(e) =>
						updateForm({
							field: "postal_code",
							value: formatPostalCode(e.target.value),
						})
					}
					placeholder="000-0000"
					maxLength={8}
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="address">住所</Label>
				<Input
					id="address"
					value={formData.address || ""}
					onChange={(e) =>
						updateForm({ field: "address", value: e.target.value })
					}
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="amount">金額</Label>
				<Input
					id="amount"
					type="text"
					inputMode="numeric"
					value={formatInputCurrency(formData.amount)}
					onChange={(e) => {
						const value = Number(e.target.value.replace(/[^\d]/g, ""));
						updateForm({ field: "amount", value });
					}}
					className="text-right"
				/>
				{typeof formData.amount === "number" && formData.amount > 0 && (
					<div className="text-sm text-muted-foreground text-right">
						{formatCurrency(formData.amount)}
					</div>
				)}
			</div>
			<div className="grid gap-2">
				<Label htmlFor="attendance_type">参列</Label>
				<Select
					value={formData.attendance_type || "FUNERAL"}
					onValueChange={(value: AttendanceType) =>
						updateForm({ field: "attendance_type", value })
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(attendanceTypeMap).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
