import { createClient } from "@/lib/supabase/client";
import { useSupabaseError } from "./useSupabaseError";
import type {
	EditKoudenEntryFormData,
	KoudenEntryTableData,
} from "@/app/(protected)/koudens/[id]/_components/entries/types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export function useKoudenEntries(koudenId: string) {
	const supabase = createClient();
	const { withErrorHandling } = useSupabaseError();
	const queryClient = useQueryClient();

	// エントリー一覧の取得
	const {
		data: entries,
		isLoading,
		error,
	} = useQuery<KoudenEntryTableData[]>({
		queryKey: ["koudenEntries", koudenId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("kouden_entries")
				.select("*")
				.eq("kouden_id", koudenId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data as KoudenEntryTableData[];
		},
	});

	// 作成のMutation
	const createMutation = useMutation({
		mutationFn: async (data: Omit<EditKoudenEntryFormData, "kouden_id">) => {
			return withErrorHandling(async () => {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) throw new Error("認証エラー");

				const { data: newEntry, error } = await supabase
					.from("kouden_entries")
					.insert([
						{
							...data,
							kouden_id: koudenId,
							created_by: user.id,
						},
					])
					.select()
					.single();

				if (error) throw error;
				return newEntry as KoudenEntryTableData;
			});
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				["koudenEntries", koudenId],
				(oldData: KoudenEntryTableData[] = []) => [data, ...oldData],
			);
			toast({
				title: "登録しました",
				description: `${data?.name || "名称未設定"}を登録しました`,
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
			data: Partial<EditKoudenEntryFormData>;
		}) => {
			return withErrorHandling(async () => {
				const { data: updatedEntry, error } = await supabase
					.from("kouden_entries")
					.update(data)
					.eq("id", id)
					.select()
					.single();

				if (error) throw error;
				return updatedEntry as KoudenEntryTableData;
			});
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				["koudenEntries", koudenId],
				(oldData: KoudenEntryTableData[] = []) =>
					oldData.map((item) => (item.id === data?.id ? data : item)),
			);
			toast({
				title: "更新しました",
				description: `${data?.name || "名称未設定"}を更新しました`,
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
				const { error } = await supabase
					.from("kouden_entries")
					.delete()
					.eq("id", id);

				if (error) throw error;
				return id;
			});
		},
		onSuccess: (id) => {
			queryClient.setQueryData(
				["koudenEntries", koudenId],
				(oldData: KoudenEntryTableData[] = []) =>
					oldData.filter((item) => item.id !== id),
			);
			toast({
				title: "削除しました",
				description: "エントリーを削除しました",
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
		entries,
		isLoading,
		error,
		createEntry: createMutation.mutateAsync,
		updateEntry: updateMutation.mutateAsync,
		deleteEntry: deleteMutation.mutateAsync,
		createMutation,
		updateMutation,
		deleteMutation,
	};
}
