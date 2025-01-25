"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import type {
	EditKoudenEntryFormData,
	KoudenEntryTableData,
	AttendanceType,
} from "../types";
import { formatCurrency, formatInputCurrency } from "@/utils/currency";
import { toast } from "@/hooks/use-toast";
import { getRelationships } from "@/app/_actions/relationships";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useKoudenEntries } from "@/hooks/useKoudenEntries";

const attendanceTypeMap: Record<AttendanceType, string> = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "欠席",
} as const;

interface Relationship {
	id: string;
	name: string;
	description?: string;
}

export interface EntryDialogProps {
	koudenId: string;
	trigger?: React.ReactNode;
	defaultValues?: KoudenEntryTableData;
	onSuccess?: (entry: KoudenEntryTableData) => void;
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
	koudenId,
	trigger,
	defaultValues,
	onSuccess,
}: EntryDialogProps) {
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("basic");
	const isMobile = useMediaQuery("(max-width: 768px)");
	const queryClient = useQueryClient();
	const {
		createEntry,
		updateEntry,
		error: entryError,
	} = useKoudenEntries(koudenId);

	const { register, handleSubmit, reset, setValue, watch } =
		useForm<EditKoudenEntryFormData>({
			defaultValues: defaultValues || {
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
		if (defaultValues) {
			setOpen(true);
			reset({
				name: defaultValues.name || undefined,
				organization: defaultValues.organization || undefined,
				position: defaultValues.position || undefined,
				amount: defaultValues.amount,
				postal_code: defaultValues.postal_code
					? formatPostalCode(defaultValues.postal_code)
					: "",
				address: defaultValues.address,
				phone_number: defaultValues.phone_number || undefined,
				relationship_id: defaultValues.relationship_id || undefined,
				attendance_type: defaultValues.attendance_type,
				has_offering: defaultValues.has_offering,
				is_return_completed: defaultValues.is_return_completed,
				notes: defaultValues.notes || undefined,
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
	}, [defaultValues, reset]);

	const amount = watch("amount");

	// 作成のMutation
	const createMutation = useMutation({
		mutationFn: createEntry,
		onSuccess: (data) => {
			// キャッシュの更新
			queryClient.setQueryData(
				["koudenEntries", koudenId],
				(oldData: KoudenEntryTableData[] = []) => [...oldData, data],
			);
			onSuccess?.(data as KoudenEntryTableData);
			toast({
				title: "登録しました",
				description: `${data?.name || "名称未設定"}を登録しました`,
			});
			setOpen(false);
		},
		onError: (error) => {
			console.error("Failed to create entry:", error);
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "保存に失敗しました",
				variant: "destructive",
			});
		},
	});

	// 更新のMutation
	const updateMutation = useMutation({
		mutationFn: async (params: { id: string; data: EditKoudenEntryFormData }) =>
			updateEntry(params),
		onSuccess: (data) => {
			// キャッシュの更新
			queryClient.setQueryData(
				["koudenEntries", koudenId],
				(oldData: KoudenEntryTableData[] = []) =>
					oldData.map((item) => (item.id === data?.id ? data : item)),
			);
			onSuccess?.(data as KoudenEntryTableData);
			toast({
				title: "更新しました",
				description: `${data?.name || "名称未設定"}を更新しました`,
			});
			setOpen(false);
		},
		onError: (error) => {
			console.error("Failed to update entry:", error);
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "保存に失敗しました",
				variant: "destructive",
			});
		},
	});

	const onSubmit = handleSubmit(async (data) => {
		const input: EditKoudenEntryFormData = {
			name: data.name || undefined,
			organization: data.organization || undefined,
			position: data.position || undefined,
			amount: Number(data.amount),
			postal_code: data.postal_code
				? normalizePostalCode(data.postal_code)
				: undefined,
			address: data.address || undefined,
			phone_number: data.phone_number || undefined,
			relationship_id: data.relationship_id || undefined,
			attendance_type: data.attendance_type || "FUNERAL",
			has_offering: data.has_offering || false,
			is_return_completed: data.is_return_completed || false,
			notes: data.notes || undefined,
			kouden_id: koudenId,
		};

		if (defaultValues?.id) {
			// 更新の場合
			updateMutation.mutate({ id: defaultValues.id, data: input });
		} else {
			// 新規作成の場合
			createMutation.mutate(input);
		}

		if (!defaultValues) {
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
	});

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={setOpen}
			trigger={trigger}
			title={defaultValues ? "香典記録の編集" : "新規香典記録"}
			contentClassName="max-w-2xl"
		>
			<form onSubmit={onSubmit} className="grid gap-4 py-4">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="basic">基本情報</TabsTrigger>
						<TabsTrigger value="additional">追加情報</TabsTrigger>
					</TabsList>
					<TabsContent value="basic" className="mt-4">
						<div className="grid gap-4">
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
								{typeof amount === "number" && amount > 0 && (
									<div className="text-sm text-muted-foreground text-right">
										{formatCurrency(amount)}
									</div>
								)}
							</div>
							<div className="grid gap-2">
								<Label htmlFor="attendance_type">参列</Label>
								<Select
									value={watch("attendance_type") || "FUNERAL"}
									onValueChange={(
										value: "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT",
									) => setValue("attendance_type", value)}
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
					</TabsContent>
					<TabsContent value="additional" className="mt-4">
						<div className="grid gap-4">
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
						</div>
					</TabsContent>
				</Tabs>
				<div className="flex justify-end gap-2">
					<Button
						type="submit"
						disabled={createMutation.isPending || updateMutation.isPending}
					>
						{createMutation.isPending || updateMutation.isPending
							? "保存中..."
							: defaultValues
								? "保存"
								: "追加"}
					</Button>
				</div>
			</form>
		</ResponsiveDialog>
	);
}
