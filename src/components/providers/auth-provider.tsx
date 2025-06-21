"use client";
import { useEffect, type ReactNode } from "react";
import { useSetAtom } from "jotai";
import type { User } from "@supabase/supabase-js";
import { userAtom, isLoadingUserAtom } from "@/store/auth";

interface AuthProviderProps {
	initialUser: User | null;
	children: ReactNode;
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
	const setUser = useSetAtom(userAtom);
	const setLoading = useSetAtom(isLoadingUserAtom);

	useEffect(() => {
		setUser(initialUser);
		setLoading(false);
	}, [initialUser, setUser, setLoading]);

	return <>{children}</>;
}
