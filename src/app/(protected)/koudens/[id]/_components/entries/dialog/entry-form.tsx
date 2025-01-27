"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import { EntryFormBasic } from "./entry-form-basic";
import { EntryFormAdditional } from "./entry-form-additional";

import type {
	KoudenEntry,
	AttendanceType,
	Relationship,
	EditKoudenEntryFormData,
} from "@/types/kouden";
import { getRelationships } from "@/app/_actions/relationships";
import {
	createKoudenEntry,
	updateKoudenEntry,
} from "@/app/_actions/kouden-entries";
import {
	entriesAtom,
	entryFormAtom,
	setEntryFormAtom,
	resetEntryFormAtom,
	formSubmissionStateAtom,
} from "@/store/entries";

export interface EntryFormProps {
	koudenId: string;
	defaultValues?: KoudenEntry;
	onSuccess?: (entry: KoudenEntry) => void;
	onCancel?: () => void;
}

export function EntryForm({
	koudenId,
	defaultValues,
	onSuccess,
	onCancel,
}: EntryFormProps) {
	const setEntries = useSetAtom(entriesAtom);
	const entries = useAtomValue(entriesAtom);
	const [formData] = useAtom(entryFormAtom);
	const setFormData = useSetAtom(setEntryFormAtom);
	const resetForm = useSetAtom(resetEntryFormAtom);
	const [submissionState, setSubmissionState] = useAtom(
		formSubmissionStateAtom,
	);

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

	// 初期値のセット
	useEffect(() => {
		if (defaultValues) {
			setFormData(defaultValues);
		} else {
			resetForm();
		}
	}, [defaultValues, setFormData, resetForm]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setSubmissionState({ isSubmitting: true, error: null });
			const input: EditKoudenEntryFormData = {
				name: formData.name || null,
				organization: formData.organization || null,
				position: formData.position || null,
				amount: Number(formData.amount),
				postal_code: formData.postal_code
					? normalizePostalCode(formData.postal_code)
					: null,
				address: formData.address || null,
				phone_number: formData.phone_number || null,
				relationship_id: formData.relationship_id || null,
				attendance_type: formData.attendance_type,
				has_offering: Boolean(formData.has_offering),
				is_return_completed: Boolean(formData.is_return_completed),
				notes: formData.notes || null,
				kouden_id: koudenId,
			};

			let result: KoudenEntry | null = null;
			if (defaultValues?.id) {
				const response = await updateKoudenEntry(defaultValues.id, input);
				result = {
					...response,
					attendance_type: response.attendance_type as AttendanceType,
				};
				setEntries(
					entries.map((entry) => (entry.id === result?.id ? result : entry)),
				);
			} else {
				const response = await createKoudenEntry(input);
				result = {
					...response,
					attendance_type: response.attendance_type as AttendanceType,
				};
				setEntries([result, ...entries]);
			}

			if (!result) {
				throw new Error("保存に失敗しました");
			}

			onSuccess?.(result);
			toast({
				title: defaultValues ? "更新しました" : "登録しました",
				description: `${result?.name || "名称未設定"}を${defaultValues ? "更新" : "登録"}しました`,
			});

			if (!defaultValues) {
				resetForm();
			}
		} catch (error) {
			console.error("Failed to save entry:", error);
			setSubmissionState({
				isSubmitting: false,
				error: error instanceof Error ? error.message : "保存に失敗しました",
			});
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "保存に失敗しました",
				variant: "destructive",
			});
		} finally {
			setSubmissionState((prev) => ({ ...prev, isSubmitting: false }));
		}
	};

	return (
		<form onSubmit={onSubmit} className="grid gap-4 py-4">
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
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						キャンセル
					</Button>
				)}
				<Button type="submit" disabled={submissionState.isSubmitting}>
					{submissionState.isSubmitting
						? "保存中..."
						: defaultValues
							? "保存"
							: "追加"}
				</Button>
			</div>
		</form>
	);
}

// ユーティリティ関数
export function formatPostalCode(value: string): string {
	const numbers = value.replace(/[^\d]/g, "");
	if (numbers.length <= 3) return numbers;
	return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
}

export function normalizePostalCode(value?: string | null): string {
	return value ? value.replace(/[^\d]/g, "") : "";
}

export async function searchAddress(
	postalCode: string,
): Promise<string | null> {
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
