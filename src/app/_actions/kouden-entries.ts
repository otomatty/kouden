"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from "@/types/supabase";
import type { CellValue } from "@/components/custom/data-table/types";

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
export type UpdateKoudenEntryInput = Partial<CreateKoudenEntryInput> & {
	id?: string;
	offering_entries?: Array<Record<string, unknown>>;
};

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
		const { id: _id, offering_entries, ...updateData } = input;

		const { error, data: updatedData } = await supabase
			.from("kouden_entries")
			.update({
				...updateData,
				attendance_type:
					updateData.attendance_type === null
						? undefined
						: updateData.attendance_type,
				relationship_id:
					updateData.relationship_id === ""
						? undefined
						: updateData.relationship_id,
			})
			.eq("id", id)
			.select()
			.single();

		if (error) {
			throw new Error("香典情報の更新に失敗しました");
		}

		Promise.resolve().then(() => {
			revalidatePath(`/koudens/${updatedData.kouden_id}`);
		});

		return updatedData;
	} catch (error) {
		throw new Error("香典情報の更新に失敗しました");
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

// 複数エントリーの一括削除機能
export async function deleteKoudenEntries(
	ids: string[],
	koudenId: string,
): Promise<void> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase
		.from("kouden_entries")
		.delete()
		.in("id", ids);

	if (error) {
		throw new Error("香典情報の一括削除に失敗しました");
	}

	Promise.resolve().then(() => {
		revalidatePath(`/koudens/${koudenId}`);
	});
}

// セル単位の更新用に最適化した関数
export async function updateKoudenEntryField(
	id: string,
	field: keyof KoudenEntryResponse,
	value: CellValue,
): Promise<KoudenEntryResponse> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	try {
		const { error, data: updatedData } = await supabase
			.from("kouden_entries")
			.update({
				[field]: value === "" ? null : value,
			})
			.eq("id", id)
			.select();

		if (error) {
			throw new Error(`${field}の更新に失敗しました`);
		}

		Promise.resolve().then(() => {
			revalidatePath(`/koudens/${updatedData[0].kouden_id}`);
		});

		return updatedData[0];
	} catch (error) {
		throw new Error(`${field}の更新に失敗しました`);
	}
}
