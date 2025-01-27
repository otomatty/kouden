import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { createClient } from "@/lib/supabase/client";
import {
	telegramStateAtom,
	telegramActionsAtom,
	type OptimisticTelegram,
	telegramsAtom,
} from "@/store/telegrams";
import type { Telegram } from "@/types/telegram";
import { convertToCamelCase } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/use-supabase";
import type { Database } from "@/types/supabase";
import { toCamelCase } from "@/utils/case-converter";

// 入力型の定義
export type TelegramInput = {
	koudenEntryId?: string;
	senderName: string;
	senderOrganization?: string;
	senderPosition?: string;
	message?: string;
	notes?: string;
};

// スネークケースへの変換ヘルパー
const toSnakeCase = (input: TelegramInput) => ({
	kouden_entry_id: input.koudenEntryId || null,
	sender_name: input.senderName,
	sender_organization: input.senderOrganization || null,
	sender_position: input.senderPosition || null,
	message: input.message || null,
	notes: input.notes || null,
});

export function useTelegrams(koudenId: string) {
	const supabase = createClient();
	const [state] = useAtom(telegramStateAtom);
	const [, dispatch] = useAtom(telegramActionsAtom);
	const [, setTelegrams] = useAtom(telegramsAtom);
	const { supabase: supabaseSupabase } = useSupabase();

	// エラーハンドリングのヘルパー関数
	const handleError = useCallback(
		(error: Error) => {
			dispatch({ type: "setError", payload: error });
			toast({
				title: "エラーが発生しました",
				description: error.message,
				variant: "destructive",
			});
		},
		[dispatch],
	);

	// データの取得
	const fetchTelegrams = useCallback(async () => {
		try {
			dispatch({ type: "setLoading", payload: true });
			dispatch({ type: "setError", payload: null });

			const { data, error } = await supabase
				.from("telegrams")
				.select()
				.eq("kouden_id", koudenId)
				.order("created_at", { ascending: false });

			if (error) throw error;

			const telegrams = data.map((item) => convertToCamelCase<Telegram>(item));
			dispatch({ type: "setItems", payload: telegrams });
		} catch (error) {
			handleError(error as Error);
		} finally {
			dispatch({ type: "setLoading", payload: false });
		}
	}, [koudenId, dispatch, handleError, supabase]);

	// データの作成
	const createTelegram = useCallback(
		async (input: TelegramInput): Promise<void> => {
			try {
				const optimisticId = crypto.randomUUID();

				const optimisticTelegram: Telegram = {
					id: optimisticId,
					koudenId,
					koudenEntryId: input.koudenEntryId || null,
					senderName: input.senderName,
					senderOrganization: input.senderOrganization || null,
					senderPosition: input.senderPosition || null,
					message: input.message || null,
					notes: input.notes || null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					createdBy: "optimistic",
				};

				dispatch({
					type: "updateOptimistic",
					payload: { id: optimisticId, data: optimisticTelegram },
				});

				const { data: user } = await supabase.auth.getUser();

				if (!user.user) throw new Error("認証されていません");

				const { data, error } = await supabase
					.from("telegrams")
					.insert({
						kouden_id: koudenId,
						...toSnakeCase(input),
						created_by: user.user.id,
					})
					.select()
					.single();

				if (error) throw error;
				if (!data) throw new Error("弔電の作成に失敗しました");

				dispatch({ type: "clearOptimistic", payload: optimisticId });
				const telegram = convertToCamelCase<Telegram>(data);
				dispatch({
					type: "setItems",
					payload: [...state.data.items, telegram],
				});

				toast({
					title: "作成完了",
					description: "弔電を作成しました",
				});
			} catch (error) {
				console.error("弔電作成エラー:", error);
				handleError(error as Error);
			}
		},
		[koudenId, dispatch, handleError, state.data.items, supabase],
	);

	// データの更新
	const updateTelegram = useCallback(
		async (id: string, input: TelegramInput): Promise<void> => {
			try {
				console.log("Updating telegram with id:", id);
				console.log("Raw update input:", input);

				// 入力データの検証と変換
				const sanitizedInput = Object.fromEntries(
					Object.entries(input).map(([key, value]) => [
						key,
						value === "" ? null : value,
					]),
				);
				console.log("Sanitized input:", sanitizedInput);

				const snakeCaseInput = toSnakeCase(sanitizedInput as TelegramInput);
				console.log("Snake case input for Supabase:", snakeCaseInput);

				const { data, error } = await supabase
					.from("telegrams")
					.update(snakeCaseInput)
					.eq("id", id)
					.select()
					.single();

				if (error) {
					console.error("Supabase update error:", error);
					throw error;
				}
				if (!data) throw new Error("弔電の更新に失敗しました");

				console.log("Update successful, received data:", data);

				const telegram = convertToCamelCase<Telegram>(data);
				console.log("Converted telegram data:", telegram);

				setTelegrams((prev) =>
					prev.map((item) => (item.id === id ? telegram : item)),
				);

				toast({
					title: "更新完了",
					description: "弔電を更新しました",
				});
			} catch (error) {
				console.error("Error in updateTelegram:", error);
				handleError(error as Error);
			}
		},
		[setTelegrams, handleError, supabase],
	);

	// データの削除
	const deleteTelegram = useCallback(
		async (id: string): Promise<void> => {
			try {
				console.log("useTelegrams.deleteTelegram called with id:", id);
				const { error } = await supabase
					.from("telegrams")
					.delete()
					.eq("id", id);

				if (error) {
					console.error("Supabase delete error:", error);
					throw error;
				}

				console.log("Telegram deleted from database successfully");
				setTelegrams((prev) => prev.filter((item) => item.id !== id));

				toast({
					title: "削除完了",
					description: "弔電を削除しました",
				});
			} catch (error) {
				console.error("Error in deleteTelegram:", error);
				handleError(error as Error);
			}
		},
		[setTelegrams, handleError, supabase],
	);

	// 一括削除
	const bulkDeleteTelegrams = useCallback(
		async (ids: string[]): Promise<void> => {
			try {
				// 楽観的更新の適用
				for (const id of ids) {
					const existingItem = state.data.items.find((item) => item.id === id);
					if (!existingItem) {
						throw new Error("削除対象の弔電が見つかりません");
					}
					dispatch({
						type: "updateOptimistic",
						payload: {
							id,
							data: {
								...existingItem,
								isDeleted: true,
								isOptimistic: true,
							} as OptimisticTelegram,
						},
					});
				}

				const { error } = await supabase
					.from("telegrams")
					.delete()
					.in("id", ids);

				if (error) throw error;

				// 楽観的更新の削除と実際のデータの反映
				for (const id of ids) {
					dispatch({ type: "clearOptimistic", payload: id });
				}
				dispatch({
					type: "setItems",
					payload: state.data.items.filter((item) => !ids.includes(item.id)),
				});

				toast({
					title: "削除完了",
					description: `${ids.length}件の弔電を削除しました`,
				});
			} catch (error) {
				handleError(error as Error);
			}
		},
		[dispatch, handleError, state.data.items, supabase],
	);

	// リアルタイム同期の設定
	useEffect(() => {
		const channel = supabaseSupabase
			.channel(`telegrams:${koudenId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "telegrams",
					filter: `kouden_id=eq.${koudenId}`,
				},
				async (payload) => {
					switch (payload.eventType) {
						case "INSERT":
						case "UPDATE": {
							const newTelegram = toCamelCase<Telegram>(
								payload.new as Database["public"]["Tables"]["telegrams"]["Row"],
							);
							dispatch({
								type: "updateOptimistic",
								payload: { id: newTelegram.id, data: newTelegram },
							});
							break;
						}
						case "DELETE": {
							dispatch({ type: "clearOptimistic", payload: payload.old.id });
							break;
						}
					}
				},
			)
			.subscribe();

		return () => {
			supabaseSupabase.removeChannel(channel);
		};
	}, [koudenId, supabaseSupabase, dispatch]);

	return {
		state,
		fetchTelegrams,
		createTelegram,
		updateTelegram,
		deleteTelegram,
		bulkDeleteTelegrams,
	};
}
