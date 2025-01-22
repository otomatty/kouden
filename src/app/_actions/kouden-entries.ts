"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from "@/types/supabase";

export type KoudenEntryResponse =
	Database["public"]["Tables"]["kouden_entries"]["Row"];

const koudenEntrySchema = z.object({
	kouden_id: z.string().uuid(),
	name: z.string().nullish(),
	organization: z.string().nullish(),
	position: z.string().nullish(),
	amount: z.number().min(1, "金額を入力してください"),
	postal_code: z.string().nullish(),
	address: z.string().nullish(),
	phone_number: z.string().nullish(),
	attendance_type: z.enum(["FUNERAL", "CONDOLENCE_VISIT", "ABSENT"]).nullish(),
	has_offering: z.boolean().default(false),
	is_return_completed: z.boolean().default(false),
	notes: z.string().nullish(),
	relationship_id: z.string().uuid().nullish(),
});

export type CreateKoudenEntryInput = z.infer<typeof koudenEntrySchema>;
export type UpdateKoudenEntryInput = Partial<CreateKoudenEntryInput>;

export async function createKoudenEntry(
	input: CreateKoudenEntryInput,
): Promise<KoudenEntryResponse> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("kouden_entries")
		.insert({
			...input,
			attendance_type: input.attendance_type ?? "ABSENT",
			created_by: user.id,
		})
		.select("*")
		.single();

	if (error) {
		throw new Error("香典情報の作成に失敗しました");
	}

	Promise.resolve().then(() => {
		revalidatePath(`/koudens/${input.kouden_id}`);
	});

	return data;
}

export async function getKoudenEntries(koudenId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("kouden_entries")
		.select("*")
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error("香典情報の取得に失敗しました");
	}

	return data;
}

export async function getKoudenEntry(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("kouden_entries")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		throw new Error("香典情報の取得に失敗しました");
	}

	return data;
}

export async function updateKoudenEntry(
	id: string,
	input: UpdateKoudenEntryInput,
): Promise<KoudenEntryResponse> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	try {
		console.log("Received update data:", { id, input });

		const { error, data: updatedData } = await supabase
			.from("kouden_entries")
			.update({
				...input,
				attendance_type:
					input.attendance_type === null ? undefined : input.attendance_type,
				relationship_id:
					input.relationship_id === "" ? undefined : input.relationship_id,
			})
			.eq("id", id)
			.select()
			.single();

		console.log("Supabase response:", { error, updatedData });

		if (error) {
			console.error("Supabase error:", error);
			throw new Error("香典情報の更新に失敗しました");
		}

		Promise.resolve().then(() => {
			revalidatePath(`/koudens/${updatedData.kouden_id}`);
		});

		return updatedData;
	} catch (error) {
		console.error("Update function error:", error);
		throw error;
	}
}

export async function deleteKoudenEntry(
	id: string,
	koudenId: string,
): Promise<void> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase.from("kouden_entries").delete().eq("id", id);

	if (error) {
		throw new Error("香典情報の削除に失敗しました");
	}

	Promise.resolve().then(() => {
		revalidatePath(`/koudens/${koudenId}`);
	});
}
