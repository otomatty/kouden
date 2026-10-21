import { useAtom } from "jotai";
import { userAtom, isLoadingUserAtom } from "@/store/auth";
import type { User } from "@supabase/supabase-js";

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
