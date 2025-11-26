"use client";
import { isLoadingUserAtom, userAtom } from "@/store/auth";
import type { User } from "@supabase/supabase-js";
import { useSetAtom } from "jotai";
import { type ReactNode, useEffect } from "react";

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
