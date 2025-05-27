"use client";
// library
import { useAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { entryFormDraftAtom } from "@/store/entries";
import { useEffect } from "react";
// ui
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";

// types
import type { Entry, AttendanceType, EntryFormValues } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import { entryFormSchema } from "@/schemas/entries";
// components
import { EntryFormBasic } from "./entry-form-basic";
import { EntryFormAdditional } from "./entry-form-additional";
// stores
import { formSubmissionStateAtom } from "@/store/entries";
// Server Actions
import { updateEntry, createEntry } from "@/app/_actions/entries";
import { handleEntrySubmission } from "@/app/_actions/entry-form";

export interface EntryFormProps {
	/**
	 * 香典ID
	 */
	koudenId: string;

	/**
	 * 関係者リスト
	 */
	relationships: Relationship[];

	/**
	 * デフォルト値
	 */
	defaultValues?: Entry;

	/**
	 * 成功時のコールバック
	 */
	onSuccess?: (entry: Entry) => void;
}

export function EntryForm({ koudenId, relationships, defaultValues, onSuccess }: EntryFormProps) {
	const [submissionState, setSubmissionState] = useAtom(formSubmissionStateAtom);
	const { toast } = useToast();
	const [draftValues, setDraftValues] = useAtom(entryFormDraftAtom);
	const isCreate = defaultValues == null;

	const initialValues = defaultValues
		? {
				name: defaultValues.name || "",
				organization: defaultValues.organization,
				position: defaultValues.position,
				amount: defaultValues.amount,
				postalCode: defaultValues.postal_code,
				address: defaultValues.address,
				phoneNumber: defaultValues.phone_number,
				relationshipId: defaultValues.relationship_id,
				attendanceType: defaultValues.attendance_type as AttendanceType,
				notes: defaultValues.notes,
				koudenId,
			}
		: (draftValues ?? {
				name: "",
				organization: null,
				position: null,
				amount: 0,
				postalCode: null,
				address: null,
				phoneNumber: null,
				relationshipId: null,
				attendanceType: "FUNERAL",
				notes: null,
				koudenId,
			});
	const form = useForm<EntryFormValues>({
		resolver: zodResolver(entryFormSchema),
		defaultValues: initialValues,
	});
	useEffect(() => {
		if (!isCreate) return;
		const subscription = form.watch((values) => {
			setDraftValues(values);
		});
		return () => subscription.unsubscribe();
	}, [form, isCreate, setDraftValues]);

	const onSubmit = async (values: EntryFormValues) => {
		try {
			setSubmissionState({ isSubmitting: true, error: null });

			if (values.relationshipId === undefined) {
				values.relationshipId = null;
			}
			const result = await handleEntrySubmission(values, koudenId, defaultValues);

			if (!result) {
				throw new Error("エントリーの保存に失敗しました");
			}

			// 成功時の処理
			onSuccess?.(result);
			toast({
				title: defaultValues ? "更新しました" : "登録しました",
				description: `${result.name || "名称未設定"}を${defaultValues ? "更新" : "登録"}しました`,
			});

			if (!defaultValues) {
				form.reset();
				setDraftValues(undefined);
			}
		} catch (error) {
			console.error("[DEBUG] Entry submission failed:", {
				error,
				errorMessage: error instanceof Error ? error.message : "Unknown error",
				errorStack: error instanceof Error ? error.stack : undefined,
				values,
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
					console.error("[DEBUG] Form validation errors:", {
						errors,
						formValues: form.getValues(),
						formState: form.formState,
					});
				})}
				className="grid gap-4 py-4"
			>
				<Tabs defaultValue="basic" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="basic">基本情報</TabsTrigger>
						<TabsTrigger value="additional">追加情報</TabsTrigger>
					</TabsList>
					<TabsContent value="basic" className="mt-4">
						<EntryFormBasic />
					</TabsContent>
					<TabsContent value="additional" className="mt-4">
						<EntryFormAdditional relationships={relationships} />
					</TabsContent>
				</Tabs>
				<div className="flex justify-end gap-2">
					<Button type="submit" disabled={submissionState.isSubmitting}>
						{submissionState.isSubmitting ? "保存中..." : defaultValues ? "更新" : "追加"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// ユーティリティ関数(TODO: 共通化)
export function formatPostalCode(value: string): string {
	const numbers = value.replace(/[^\d]/g, "");
	if (numbers.length <= 3) return numbers;
	return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
}

export function normalizePostalCode(value?: string | null): string {
	return value ? value.replace(/[^\d]/g, "") : "";
}

export async function searchAddress(postalCode: string): Promise<string | null> {
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
