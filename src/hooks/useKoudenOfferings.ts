import { createClient } from "@/lib/supabase/client";
import { useSupabaseError } from "./useSupabaseError";
import type { Offering } from "@/types/offering";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { CreateOfferingInput, UpdateOfferingInput } from "@/types/actions";

export function useKoudenOfferings(koudenId: string) {
	const supabase = createClient();
	const { withErrorHandling } = useSupabaseError();
	const queryClient = useQueryClient();

	// お供え物一覧の取得
	const {
		data: offerings,
		isLoading,
		error,
	} = useQuery<Offering[]>({
		queryKey: ["offerings", koudenId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("offerings")
				.select(`
					*,
					offering_photos (*)
				`)
				.eq("kouden_id", koudenId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data as Offering[];
		},
	});

	// 作成のMutation
	const createMutation = useMutation({
		mutationFn: async (data: CreateOfferingInput) => {
			return withErrorHandling(async () => {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) throw new Error("認証エラー");

				// 空文字列をnullに変換
				const description = data.description === "" ? null : data.description;

				const { data: newOffering, error: offeringError } = await supabase
					.from("offerings")
					.insert({
						kouden_id: koudenId,
						type: data.type,
						description: description,
						quantity: data.quantity,
						price: data.price,
						provider_name: data.provider_name,
						notes: data.notes,
						created_by: user.id,
					})
					.select(`
						*,
						offering_photos (*)
					`)
					.single();

				if (offeringError) throw offeringError;

				// 中間テーブルにエントリーを作成
				const offeringEntries = data.kouden_entry_ids.map((entryId) => ({
					offering_id: newOffering.id,
					kouden_entry_id: entryId,
					created_by: user.id,
				}));

				const { error: entryError } = await supabase
					.from("offering_entries")
					.insert(offeringEntries);

				if (entryError) {
					// エラーが発生した場合は作成したofferingを削除
					await supabase.from("offerings").delete().eq("id", newOffering.id);
					throw entryError;
				}

				// お供え物フラグを更新
				const { error: updateError } = await supabase
					.from("kouden_entries")
					.update({ has_offering: true })
					.in("id", data.kouden_entry_ids);

				if (updateError) throw updateError;

				return newOffering as Offering;
			});
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				["offerings", koudenId],
				(oldData: Offering[] = []) => [data, ...oldData],
			);
			toast({
				title: "登録しました",
				description: `${data?.description || "名称未設定"}を登録しました`,
			});
		},
		onError: (error) => {
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
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: UpdateOfferingInput;
		}) => {
			return withErrorHandling(async () => {
				const { data: updatedOffering, error } = await supabase
					.from("offerings")
					.update(data)
					.eq("id", id)
					.select(`
						*,
						offering_photos (*)
					`)
					.single();

				if (error) throw error;
				return updatedOffering as Offering;
			});
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				["offerings", koudenId],
				(oldData: Offering[] = []) =>
					oldData.map((item) => (item.id === data?.id ? data : item)),
			);
			toast({
				title: "更新しました",
				description: `${data?.description || "名称未設定"}を更新しました`,
			});
		},
		onError: (error) => {
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "保存に失敗しました",
				variant: "destructive",
			});
		},
	});

	// 削除のMutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return withErrorHandling(async () => {
				// 関連する香典情報IDを取得
				const { data: entry } = await supabase
					.from("offering_entries")
					.select("kouden_entry_id")
					.eq("offering_id", id)
					.single();

				// お供え物を削除（中間テーブルのエントリーは CASCADE で自動的に削除される）
				const { error } = await supabase
					.from("offerings")
					.delete()
					.eq("id", id);

				if (error) throw error;

				if (entry) {
					// 他にお供え物がない場合はフラグを更新
					const { data: remainingOfferings } = await supabase
						.from("offering_entries")
						.select("id")
						.eq("kouden_entry_id", entry.kouden_entry_id);

					if (!remainingOfferings?.length) {
						await supabase
							.from("kouden_entries")
							.update({ has_offering: false })
							.eq("id", entry.kouden_entry_id);
					}
				}

				return id;
			});
		},
		onSuccess: (id) => {
			queryClient.setQueryData(
				["offerings", koudenId],
				(oldData: Offering[] = []) => oldData.filter((item) => item.id !== id),
			);
			toast({
				title: "削除しました",
				description: "お供え物を削除しました",
			});
		},
		onError: (error) => {
			toast({
				title: "エラー",
				description:
					error instanceof Error ? error.message : "削除に失敗しました",
				variant: "destructive",
			});
		},
	});

	return {
		offerings,
		isLoading,
		error,
		createOffering: createMutation.mutateAsync,
		updateOffering: updateMutation.mutateAsync,
		deleteOffering: deleteMutation.mutateAsync,
		createMutation,
		updateMutation,
		deleteMutation,
	};
}
