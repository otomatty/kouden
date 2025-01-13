"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import type { EditKoudenEntryFormData, KoudenEntryTableData } from "./types";
import type { CreateKoudenEntryInput } from "@/types/actions";
import { formatCurrency, formatInputCurrency } from "./utils";
import { toast } from "@/hooks/use-toast";
import { getRelationships } from "@/app/_actions/relationships";
import { useQuery } from "@tanstack/react-query";

const attendanceTypeMap = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "欠席",
} as const;

interface Relationship {
	id: string;
	name: string;
	description?: string;
}

interface EntryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	entry?: KoudenEntryTableData;
	onSave: (data: EditKoudenEntryFormData) => Promise<void>;
	trigger?: React.ReactNode;
	koudenId: string;
}

// 郵便番号のフォーマット関数
function formatPostalCode(value: string): string {
	const numbers = value.replace(/[^\d]/g, "");
	if (numbers.length <= 3) return numbers;
	return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
}

// 郵便番号から数字のみを抽出
function normalizePostalCode(value?: string | null): string {
	return value ? value.replace(/[^\d]/g, "") : "";
}

async function searchAddress(postalCode: string): Promise<string | null> {
	try {
		const response = await fetch(
			`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalizePostalCode(postalCode)}`,
		);
		const data = await response.json();
		if (data.results?.[0]) {
			const { address1, address2, address3 } = data.results[0];
			return `${address1}${address2}${address3}`;
		}
		return null;
	} catch (error) {
		console.error("Failed to fetch address:", error);
		return null;
	}
}

export function EntryDialog({
	open,
	onOpenChange,
	entry,
	onSave,
	trigger,
	koudenId,
}: EntryDialogProps) {
	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<EditKoudenEntryFormData>({
		defaultValues: {
			name: undefined,
			organization: undefined,
			position: undefined,
			amount: 0,
			postal_code: undefined,
			address: null,
			phone_number: undefined,
			relationship_id: undefined,
			attendance_type: "FUNERAL",
			has_offering: false,
			is_return_completed: false,
			notes: undefined,
		},
	});

	// 関係性データの取得
	const { data: relationships = [] } = useQuery<Relationship[]>({
		queryKey: ["relationships", koudenId],
		queryFn: async () => {
			const data = await getRelationships(koudenId);
			return data.map((rel) => ({
				id: rel.id,
				name: rel.name,
				description: rel.description || undefined,
			}));
		},
		staleTime: 1000 * 60 * 5, // 5分間キャッシュ
	});

	// 郵便番号が変更されたら住所を自動入力
	const postal_code = watch("postal_code");
	const address = watch("address");
	useEffect(() => {
		const fetchAddress = async () => {
			// 住所が既に入力されている場合は検索しない
			if (address) return;

			// 7桁の数字のみの場合に検索
			const normalizedPostalCode = normalizePostalCode(postal_code);
			if (normalizedPostalCode.length === 7) {
				const address = await searchAddress(normalizedPostalCode);
				if (address) {
					setValue("address", address);
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
			}
		};
		fetchAddress();
	}, [postal_code, setValue, address]);

	// エントリーが変更されたら、フォームの値を更新
	useEffect(() => {
		if (entry) {
			reset({
				name: entry.name || undefined,
				organization: entry.organization || undefined,
				position: entry.position || undefined,
				amount: entry.amount,
				postal_code: entry.postal_code
					? formatPostalCode(entry.postal_code)
					: "",
				address: entry.address,
				phone_number: entry.phone_number || undefined,
				relationship_id: entry.relationship_id || undefined,
				attendance_type: entry.attendance_type,
				has_offering: entry.has_offering,
				is_return_completed: entry.is_return_completed,
				notes: entry.notes || undefined,
			});
		} else {
			reset({
				name: "",
				organization: "",
				position: "",
				amount: 0,
				postal_code: "",
				address: "",
				phone_number: "",
				relationship_id: undefined,
				attendance_type: "FUNERAL",
				has_offering: false,
				is_return_completed: false,
				notes: "",
			});
		}
	}, [entry, reset]);

	const amount = watch("amount");

	const onSubmit = handleSubmit(async (data) => {
		try {
			const input: CreateKoudenEntryInput = {
				name: data.name || null,
				organization: data.organization || null,
				position: data.position || null,
				amount: Number(data.amount),
				postal_code: data.postal_code
					? normalizePostalCode(data.postal_code)
					: null,
				address: data.address || null,
				phone_number: data.phone_number || null,
				relationship_id: data.relationship_id || null,
				attendance_type: data.attendance_type || "FUNERAL",
				has_offering: data.has_offering || false,
				is_return_completed: data.is_return_completed || false,
				notes: data.notes || null,
				kouden_id: koudenId,
			};
			await onSave(input);
			onOpenChange(false);
			reset({
				name: "",
				organization: "",
				position: "",
				amount: 0,
				postal_code: "",
				address: "",
				phone_number: "",
				relationship_id: undefined,
				attendance_type: "FUNERAL",
				has_offering: false,
				is_return_completed: false,
				notes: "",
			});
		} catch (error) {
			console.error("Failed to save entry:", error);
			toast({
				title: "エラー",
				description: "保存に失敗しました",
				variant: "destructive",
			});
		}
	});

	const dialogContent = (
		<DialogContent className="max-w-2xl">
			<DialogHeader>
				<DialogTitle>{entry ? "香典記録の編集" : "新規香典記録"}</DialogTitle>
			</DialogHeader>
			<form onSubmit={onSubmit} className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="name">ご芳名</Label>
					<Input id="name" {...register("name")} />
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor="organization">団体名</Label>
						<Input id="organization" {...register("organization")} />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="position">役職</Label>
						<Input id="position" {...register("position")} />
					</div>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="postal_code">郵便番号</Label>
					<Input
						id="postal_code"
						value={postal_code || ""}
						onChange={(e) =>
							setValue(
								"postal_code",
								formatPostalCode(e.target.value) || undefined,
							)
						}
						placeholder="000-0000"
						maxLength={8}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="address">住所</Label>
					<Input id="address" {...register("address")} />
				</div>
				<div className="grid gap-2">
					<Label htmlFor="amount">金額</Label>
					<Input
						id="amount"
						type="text"
						inputMode="numeric"
						value={formatInputCurrency(amount)}
						onChange={(e) => {
							const value = Number(e.target.value.replace(/[^\d]/g, ""));
							setValue("amount", value);
						}}
						className="text-right"
					/>
					{amount > 0 && (
						<div className="text-sm text-muted-foreground text-right">
							{formatCurrency(amount)}
						</div>
					)}
				</div>
				<div className="grid gap-2">
					<Label htmlFor="phone_number">電話番号</Label>
					<Input
						id="phone_number"
						{...register("phone_number")}
						placeholder="000-0000-0000"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="relationship_id">ご関係</Label>
					<Select
						value={watch("relationship_id") || ""}
						onValueChange={(value) =>
							setValue("relationship_id", value || undefined)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="関係性を選択" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">未選択</SelectItem>
							{relationships?.map((relationship) => (
								<SelectItem key={relationship.id} value={relationship.id}>
									{relationship.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="attendance_type">参列</Label>
					<Select
						value={watch("attendance_type") || "FUNERAL"}
						onValueChange={(value: "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT") =>
							setValue("attendance_type", value)
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
				<div className="grid gap-2">
					<Label htmlFor="has_offering">供物</Label>
					<Select
						value={String(watch("has_offering"))}
						onValueChange={(value) =>
							setValue("has_offering", value === "true")
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="true">あり</SelectItem>
							<SelectItem value="false">なし</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="is_return_completed">返礼</Label>
					<Select
						value={String(watch("is_return_completed"))}
						onValueChange={(value) =>
							setValue("is_return_completed", value === "true")
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="true">完了</SelectItem>
							<SelectItem value="false">未完了</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="notes">備考</Label>
					<Input id="notes" {...register("notes")} />
				</div>
				<DialogFooter>
					<Button type="submit">{entry ? "保存" : "追加"}</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);

	if (trigger) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>{trigger}</DialogTrigger>
				{dialogContent}
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{dialogContent}
		</Dialog>
	);
}
