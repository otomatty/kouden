"use server";

import { createDeliveryMethod } from "./delivery-methods";

export async function handleDeliveryMethodsSubmit(koudenId: string, methods: string[]) {
	try {
		await Promise.all(
			methods.map(async (name) => {
				await createDeliveryMethod({
					name,
					description: null,
					is_system: false,
					kouden_id: koudenId,
				});
			}),
		);
		return { success: true };
	} catch (error) {
		console.error("配送方法の保存エラー:", error);
		return { success: false, error: "配送方法の保存に失敗しました" };
	}
}
