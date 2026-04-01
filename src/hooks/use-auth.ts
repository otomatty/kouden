import type { User } from "@supabase/supabase-js";
import { useAtom } from "jotai";
import { isLoadingUserAtom, userAtom } from "@/store/auth";

interface UseAuthReturn {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

/**
 * 認証状態を管理するカスタムフック
 * 既存のJotaiベースの認証システムと統合
 *
 * @returns ユーザー情報、ローディング状態、認証状態
 */
export function useAuth(): UseAuthReturn {
	const [user] = useAtom(userAtom);
	const [isLoading] = useAtom(isLoadingUserAtom);

	return {
		user,
		isLoading,
		isAuthenticated: !!user,
	};
}
