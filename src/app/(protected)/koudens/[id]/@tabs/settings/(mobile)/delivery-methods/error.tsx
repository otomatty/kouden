"use client";

import { ErrorMessage } from "@/components/custom/error-message";

export default function DeliveryMethodsError() {
	return (
		<div className="container max-w-2xl mx-auto p-4">
			<ErrorMessage
				title="エラーが発生しました"
				description="配送方法設定の読み込み中にエラーが発生しました。"
			/>
		</div>
	);
}
