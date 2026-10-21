"use server";

/**
 * 返礼方法種別に関するServer Actions
 * @module return-method-types
 */

import { type ActionResult, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ReturnMethodType } from "@/types/return-records/return-method-types";

/**
 * 返礼方法種別一覧を取得する
 */
export async function getReturnMethodTypes(): Promise<ActionResult<ReturnMethodType[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("return_method_types")
			.select("*")
			.order("sort_order", { ascending: true });

		if (error) {
			throw error;
		}

		return data as ReturnMethodType[];
	}, "返礼方法種別一覧の取得");
}

/**
 * 返礼方法種別を取得する
 */
export async function getReturnMethodType(
	id: string,
): Promise<ActionResult<ReturnMethodType | null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("return_method_types")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			throw error;
		}

		return data as ReturnMethodType | null;
	}, "返礼方法種別の取得");
}
