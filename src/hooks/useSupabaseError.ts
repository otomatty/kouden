import { useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";

export function useSupabaseError() {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleError = (error: PostgrestError) => {
		switch (error.code) {
			case "23505":
				return new Error("既に登録されています");
			case "23503":
				return new Error("関連するデータが見つかりません");
			case "42501":
				return new Error("権限がありません");
			default:
				console.error("Supabase Error:", error);
				return new Error(error.message || "予期せぬエラーが発生しました");
		}
	};

	const withErrorHandling = async <T>(
		fn: () => Promise<T>,
	): Promise<T | undefined> => {
		try {
			setLoading(true);
			setError(null);
			return await fn();
		} catch (e) {
			const error = e as Error | PostgrestError;
			if ("code" in error) {
				const handledError = handleError(error as PostgrestError);
				setError(handledError.message);
				throw handledError;
			}
			setError(error.message || "予期せぬエラーが発生しました");
			throw error;
		} finally {
			setLoading(false);
		}
	};

	return {
		error,
		loading,
		withErrorHandling,
	};
}
