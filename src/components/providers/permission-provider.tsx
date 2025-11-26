"use client";

import { permissionAtom } from "@/store/permission";
import type { KoudenPermission } from "@/types/role";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

interface PermissionProviderProps {
	permission: KoudenPermission;
	children: React.ReactNode;
}

/**
 * 香典帳の権限情報をグローバルステートに設定するプロバイダーコンポーネント
 * @param permission - ユーザーの香典帳に対する権限
 * @param children - 子コンポーネント
 */
export function PermissionProvider({ permission, children }: PermissionProviderProps) {
	const setPermission = useSetAtom(permissionAtom);

	useEffect(() => {
		setPermission(permission);
	}, [permission, setPermission]);

	return <>{children}</>;
}
