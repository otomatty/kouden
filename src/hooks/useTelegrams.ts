import { createClient } from "@/lib/supabase/client";
import { useSupabaseError } from "./useSupabaseError";
import type { Database } from "@/types/supabase";
import type { Telegram } from "@/atoms/telegrams";
import { convertToCamelCase } from "@/lib/utils";
import { useAtom } from "jotai";
import {
	telegramsAtom,
	optimisticTelegramsAtom,
	type OptimisticTelegram,
} from "@/atoms/telegrams";

// 入力型の共通化
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
	const { withErrorHandling, error, loading } = useSupabaseError();
	const [, setTelegrams] = useAtom(telegramsAtom);
	const [optimisticTelegrams, setOptimisticTelegrams] = useAtom(
		optimisticTelegramsAtom,
	);

	// 楽観的更新のヘルパー関数
	const addOptimisticTelegram = (telegram: OptimisticTelegram) => {
		setOptimisticTelegrams((prev) => [telegram, ...prev]);
	};

	const removeOptimisticTelegram = (id: string) => {
		setOptimisticTelegrams((prev) => prev.filter((t) => t.id !== id));
	};

	const createTelegram = async (input: TelegramInput): Promise<Telegram> => {
		const optimisticId = crypto.randomUUID();
		const snakeCaseInput = toSnakeCase(input);
		const optimisticTelegram: OptimisticTelegram = {
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
			isOptimistic: true,
		};

		addOptimisticTelegram(optimisticTelegram);

		return withErrorHandling(async () => {
			const { data: user } = await supabase.auth.getUser();
			if (!user.user) {
				throw new Error("認証されていません");
			}

			const { data, error } = await supabase
				.from("telegrams")
				.insert({
					kouden_id: koudenId,
					...snakeCaseInput,
					created_by: user.user.id,
				})
				.select()
				.single();

			if (error) {
				throw error;
			}

			if (!data) {
				throw new Error("弔電の作成に失敗しました");
			}

			removeOptimisticTelegram(optimisticId);
			const telegram = convertToCamelCase<Telegram>(data);
			setTelegrams((prev) => [telegram, ...prev]);
			return telegram;
		}) as Promise<Telegram>;
	};

	const updateTelegram = async (
		id: string,
		input: TelegramInput,
	): Promise<Telegram> => {
		const optimisticTelegram: OptimisticTelegram = {
			id,
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
			isOptimistic: true,
		};

		addOptimisticTelegram(optimisticTelegram);

		return withErrorHandling(async () => {
			const { data, error } = await supabase
				.from("telegrams")
				.update({
					kouden_id: koudenId,
					kouden_entry_id: input.koudenEntryId || null,
					sender_name: input.senderName,
					sender_organization: input.senderOrganization || null,
					sender_position: input.senderPosition || null,
					message: input.message || null,
					notes: input.notes || null,
				})
				.eq("id", id)
				.select()
				.single();

			if (error) {
				throw error;
			}

			if (!data) {
				throw new Error("弔電の更新に失敗しました");
			}

			removeOptimisticTelegram(id);
			const telegram = convertToCamelCase<Telegram>(data);
			setTelegrams((prev) => prev.map((t) => (t.id === id ? telegram : t)));
			return telegram;
		}) as Promise<Telegram>;
	};

	const deleteTelegram = async (id: string): Promise<void> => {
		const targetTelegram = optimisticTelegrams.find((t) => t.id === id);
		if (targetTelegram) {
			addOptimisticTelegram({ ...targetTelegram, isDeleted: true });
		}

		return withErrorHandling(async () => {
			const { error } = await supabase.from("telegrams").delete().eq("id", id);

			if (error) {
				throw error;
			}

			removeOptimisticTelegram(id);
			setTelegrams((prev) => prev.filter((t) => t.id !== id));
		}) as Promise<void>;
	};

	// 一括操作機能
	const bulkCreateTelegrams = async (
		inputs: TelegramInput[],
	): Promise<Telegram[]> => {
		return withErrorHandling(async () => {
			const { data: user } = await supabase.auth.getUser();
			if (!user.user) {
				throw new Error("認証されていません");
			}

			const { data, error } = await supabase
				.from("telegrams")
				.insert(
					inputs.map((input) => ({
						kouden_id: koudenId,
						kouden_entry_id: input.koudenEntryId || null,
						sender_name: input.senderName,
						sender_organization: input.senderOrganization || null,
						sender_position: input.senderPosition || null,
						message: input.message || null,
						notes: input.notes || null,
						created_by: user.user.id,
					})),
				)
				.select();

			if (error) {
				throw error;
			}

			if (!data) {
				throw new Error("弔電の一括作成に失敗しました");
			}

			const telegrams = data.map((d) => convertToCamelCase<Telegram>(d));
			setTelegrams((prev) => [...telegrams, ...prev]);
			return telegrams;
		}) as Promise<Telegram[]>;
	};

	const bulkDeleteTelegrams = async (ids: string[]): Promise<void> => {
		return withErrorHandling(async () => {
			const { error } = await supabase.from("telegrams").delete().in("id", ids);

			if (error) {
				throw error;
			}

			setTelegrams((prev) => prev.filter((t) => !ids.includes(t.id)));
		}) as Promise<void>;
	};

	return {
		createTelegram,
		updateTelegram,
		deleteTelegram,
		bulkCreateTelegrams,
		bulkDeleteTelegrams,
		error,
		loading,
	};
}
