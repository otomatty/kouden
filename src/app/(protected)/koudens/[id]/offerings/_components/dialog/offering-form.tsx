"use client";
import { zodResolver } from "@hookform/resolvers/zod";
// library
import { useAtom } from "jotai";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
// Server Actions
import { createOffering, updateOffering } from "@/app/_actions/offerings";
// ui
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { offeringFormSchema } from "@/schemas/offerings";
// stores
import { formSubmissionStateAtom, offeringsAtom, optimisticOfferingsAtom } from "@/store/offerings";
// types
import type { Entry } from "@/types/entries";
import type {
	OfferingFormValues,
	OfferingType,
	OfferingWithKoudenEntries,
} from "@/types/offerings";
import { OfferingFormAdditional } from "./offering-form-additional";
// components
import { OfferingFormBasic } from "./offering-form-basic";

// hooks
interface OfferingFormProps {
	koudenId: string;
	entries: Entry[];
	defaultValues?: OfferingWithKoudenEntries;
	onSuccess?: (offering: OfferingWithKoudenEntries) => void;
}

export function OfferingForm({ koudenId, entries, defaultValues, onSuccess }: OfferingFormProps) {
	const [submissionState, setSubmissionState] = useAtom(formSubmissionStateAtom);
	const [offerings, setOfferings] = useAtom(offeringsAtom);
	const [optimisticOfferings, setOptimisticOfferings] = useAtom(optimisticOfferingsAtom);

	const [, setPhotos] = useState<File[]>([]);

	const form = useForm<OfferingFormValues>({
		// biome-ignore lint: zod v4 と react-hook-form の型互換のため
		resolver: zodResolver(offeringFormSchema) as any,
		defaultValues: defaultValues
			? {
					type: defaultValues.type as OfferingType,
					description: defaultValues.description,
					quantity: defaultValues.quantity,
					price: defaultValues.price ?? undefined,
					provider_name: defaultValues.providerName,
					notes: defaultValues.notes,
					kouden_entry_ids:
						defaultValues.offeringEntries?.map((oe) => oe.koudenEntry?.id).filter(Boolean) || [],
					photos: [],
				}
			: {
					type: "FLOWER",
					description: null,
					quantity: 1,
					price: undefined,
					provider_name: "",
					notes: null,
					kouden_entry_ids: [],
					photos: [],
				},
	});

	const onSubmit = async (values: OfferingFormValues) => {
		try {
			setSubmissionState({ isSubmitting: true, error: null });

			// データベースに送信するデータを準備
			const input = {
				type: values.type,
				description: values.description,
				quantity: values.quantity,
				price: values.price,
				provider_name: values.provider_name,
				notes: values.notes,
				kouden_id: koudenId,
				kouden_entry_ids: values.kouden_entry_ids || [],
			};

			const result = defaultValues
				? await updateOffering(defaultValues.id, input)
				: await createOffering(input);

			if (!result) {
				throw new Error("保存に失敗しました");
			}

			// OfferingWithKoudenEntries型に必要なプロパティを追加
			const offering: OfferingWithKoudenEntries = {
				...result,
				offeringPhotos: [],
				offeringEntries: [],
			};

			// 新規作成時は配列に追加、更新時は既存のデータを更新
			if (!defaultValues) {
				setOfferings([...offerings, offering]);
			} else {
				setOfferings(offerings.map((o) => (o.id === offering.id ? offering : o)));
			}

			// 楽観的更新データをクリア
			setOptimisticOfferings(optimisticOfferings.filter((o) => o.id !== offering.id));

			onSuccess?.(offering);
			toast.success(defaultValues ? "供花・供物を更新しました" : "供花・供物を登録しました", {
				description: `${result.description || "説明未設定"}の処理が正常に完了しました`,
			});

			if (!defaultValues) {
				form.reset();
			}
		} catch (error) {
			console.error("[ERROR] Offering submission failed:", error);
			toast.error(error instanceof Error ? error.message : "予期せぬエラーが発生しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setSubmissionState({ isSubmitting: false, error: null });
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<Tabs defaultValue="basic" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="basic">基本情報</TabsTrigger>
						<TabsTrigger value="additional">追加情報</TabsTrigger>
					</TabsList>
					<TabsContent value="basic" className="mt-4">
						<OfferingFormBasic entries={entries} />
					</TabsContent>
					<TabsContent value="additional" className="mt-4">
						<OfferingFormAdditional
							defaultValues={!!defaultValues}
							onPhotosChange={(newPhotos) => setPhotos(newPhotos)}
						/>
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
