"use client";
// library
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
// ui
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// types
import type { Entry } from "@//types/entries";
import type { Offering, OfferingType, BaseOffering, OfferingFormValues } from "@/types/offerings";
import { offeringFormSchema } from "@/schemas/offerings";
// components
import { OfferingFormBasic } from "./offering-form-basic";
import { OfferingFormAdditional } from "./offering-form-additional";
// stores
import { offeringsAtom, formSubmissionStateAtom } from "@/store/offerings";
// Server Actions
import { createOffering, updateOffering } from "@/app/_actions/offerings";
import { handleOfferingSubmission } from "@/app/_actions/offering-form";
// hooks
interface OfferingFormProps {
	koudenId: string;
	entries: Entry[];
	defaultValues?: Offering;
	onSuccess?: (offering: Offering) => void;
}

export function OfferingForm({ koudenId, entries, defaultValues, onSuccess }: OfferingFormProps) {
	const [submissionState, setSubmissionState] = useAtom(formSubmissionStateAtom);
	const { toast } = useToast();

	const form = useForm<OfferingFormValues>({
		resolver: zodResolver(offeringFormSchema),
		defaultValues: defaultValues
			? {
					type: defaultValues.type as OfferingType,
					description: defaultValues.description,
					quantity: defaultValues.quantity,
					price: defaultValues.price,
					provider_name: defaultValues.provider_name,
					notes: defaultValues.notes,
					kouden_entry_ids: [],
					photos: [],
					entries: [],
				}
			: {
					type: "FLOWER",
					description: null,
					quantity: 1,
					price: null,
					provider_name: "",
					notes: null,
					kouden_entry_ids: [],
					photos: [],
					entries: [],
				},
	});

	const onSubmit = async (values: OfferingFormValues) => {
		try {
			setSubmissionState({ isSubmitting: true, error: null });

			if (values.relationshipId === undefined) {
				values.relationshipId = null;
			}

			const result = await handleOfferingSubmission(values, koudenId, defaultValues);

			if (!result) {
				throw new Error("保存に失敗しました");
			}

			if (defaultValues?.id) {
				await updateOffering(values.id, result);
			} else {
				await createOffering(result);
			}

			onSuccess?.(result);
			toast({
				title: defaultValues ? "更新しました" : "登録しました",
				description: `${result.description || "説明未設定"}を${defaultValues ? "更新" : "登録"}しました`,
			});

			if (!defaultValues) {
				form.reset();
			}
		} catch (error) {
			console.error("[ERROR] Offering submission failed:", error);
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
						<OfferingFormAdditional defaultValues={!!defaultValues} />
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
