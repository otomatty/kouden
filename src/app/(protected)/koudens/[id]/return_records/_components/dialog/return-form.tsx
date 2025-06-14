"use client";

// library
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// ui
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
// types
import type { ReturnManagementSummary, ReturnStatus } from "@/types/return-records/return-records";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
// actions
import { updateReturnEntry } from "@/app/_actions/return-records/return-records";
// components
import { ReturnFormBasic } from "./return-form-basic";
import { ReturnFormItems } from "./return-form-items";
import { ReturnFormAdditional } from "./return-form-additional";

// フォームスキーマ（データベース構造に合わせて修正）
const returnFormSchema = z.object({
	kouden_entry_id: z.string().min(1, "香典エントリーを選択してください"),
	return_status: z.enum(["PENDING", "PARTIAL_RETURNED", "COMPLETED", "NOT_REQUIRED"]),
	return_method: z.string().optional(),
	funeral_gift_amount: z.number().min(0, "金額は0以上で入力してください"),
	additional_return_amount: z.number().optional(),
	arrangement_date: z.string().optional(),
	remarks: z.string().optional(),
	return_items: z
		.array(
			z.object({
				name: z.string().min(1, "返礼品名は必須です"),
				price: z.number().min(0, "価格は0以上で入力してください"),
				quantity: z.number().min(1, "数量は1以上で入力してください"),
				notes: z.string().optional(),
			}),
		)
		.optional(),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

export interface ReturnFormProps {
	/**
	 * 香典ID
	 */
	koudenId: string;

	/**
	 * 香典エントリーリスト
	 */
	entries: Entry[];

	/**
	 * 関係者リスト
	 */
	relationships: Relationship[];

	/**
	 * デフォルト値（編集対象の返礼情報）
	 */
	defaultValues: ReturnManagementSummary;

	/**
	 * 成功時のコールバック
	 */
	onSuccess: (returnRecord: ReturnManagementSummary) => void;

	/**
	 * キャンセル時のコールバック
	 */
	onCancel: () => void;
}

/**
 * ReturnFormコンポーネント
 * 役割：返礼情報の編集フォーム（編集専用）
 * 返礼情報は既存の香典エントリーに対してのみ編集可能
 */
export function ReturnForm({
	koudenId,
	entries,
	relationships,
	defaultValues,
	onSuccess,
	onCancel,
}: ReturnFormProps) {
	const [submissionState, setSubmissionState] = useState({
		isSubmitting: false,
		error: null as string | null,
	});
	const { toast } = useToast();

	const initialValues: ReturnFormData = {
		kouden_entry_id: defaultValues.koudenEntryId,
		return_status: defaultValues.returnStatus,
		return_method: defaultValues.returnMethod || "",
		funeral_gift_amount: defaultValues.funeralGiftAmount || 0,
		additional_return_amount: defaultValues.additionalReturnAmount || 0,
		arrangement_date: defaultValues.arrangementDate || "",
		remarks: defaultValues.remarks || "",
		return_items: defaultValues.returnItems || [],
	};

	const form = useForm<ReturnFormData>({
		resolver: zodResolver(returnFormSchema),
		defaultValues: initialValues,
	});

	const selectedEntry = entries.find((entry) => entry.id === form.watch("kouden_entry_id"));

	const onSubmit = async (data: ReturnFormData) => {
		try {
			setSubmissionState({ isSubmitting: true, error: null });

			await updateReturnEntry({
				kouden_entry_id: data.kouden_entry_id,
				kouden_id: koudenId,
				return_status: data.return_status,
				return_method: data.return_method || null,
				funeral_gift_amount: data.funeral_gift_amount,
				additional_return_amount: data.additional_return_amount || null,
				arrangement_date: data.arrangement_date || null,
				remarks: data.remarks || null,
				return_items: data.return_items,
			});

			// 更新結果を作成
			const result: ReturnManagementSummary = {
				...defaultValues,
				returnStatus: data.return_status,
				returnMethod: data.return_method || "",
				funeralGiftAmount: data.funeral_gift_amount,
				additionalReturnAmount: data.additional_return_amount || 0,
				arrangementDate: data.arrangement_date || "",
				remarks: data.remarks || "",
				returnItems: data.return_items || [],
				returnRecordUpdated: new Date().toISOString(),
				needsAdditionalReturn: (data.additional_return_amount || 0) > 0,
			};

			// 成功時の処理
			onSuccess(result);
			toast({
				title: "更新しました",
				description: "返礼情報を更新しました",
			});
		} catch (error) {
			console.error("[DEBUG] Return form submission failed:", {
				error,
				errorMessage: error instanceof Error ? error.message : "Unknown error",
				errorStack: error instanceof Error ? error.stack : undefined,
				data,
				koudenId,
				defaultValues,
			});
			setSubmissionState({
				isSubmitting: false,
				error: error instanceof Error ? error.message : "保存に失敗しました",
			});
			toast({
				title: "エラー",
				description: error instanceof Error ? error.message : "保存に失敗しました",
				variant: "destructive",
			});
		} finally {
			setSubmissionState((prev) => ({ ...prev, isSubmitting: false }));
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit, (errors) => {
					console.error("[DEBUG] Return form validation errors:", {
						errors,
						formValues: form.getValues(),
						formState: form.formState,
					});
				})}
				className="space-y-6"
			>
				<Tabs defaultValue="basic" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="basic">基本情報</TabsTrigger>
						<TabsTrigger value="items">返礼品</TabsTrigger>
						<TabsTrigger value="additional">詳細・備考</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4 mt-4">
						<ReturnFormBasic
							form={form}
							entries={entries}
							relationships={relationships}
							selectedEntry={selectedEntry}
						/>
					</TabsContent>

					<TabsContent value="items" className="space-y-4 mt-4">
						<ReturnFormItems form={form} selectedEntry={selectedEntry} />
					</TabsContent>

					<TabsContent value="additional" className="space-y-4 mt-4">
						<ReturnFormAdditional form={form} />
					</TabsContent>
				</Tabs>

				{/* エラー表示 */}
				{submissionState.error && (
					<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
						{submissionState.error}
					</div>
				)}

				{/* アクションボタン */}
				<div className="flex justify-end gap-2 pt-4 border-t">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={submissionState.isSubmitting}
					>
						キャンセル
					</Button>
					<Button type="submit" disabled={submissionState.isSubmitting}>
						{submissionState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						{submissionState.isSubmitting ? "保存中..." : "更新"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
