import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useOrganizations } from "@/hooks/useOrganizations";

interface Org {
	id: string;
	name: string;
	type?: string;
}

type SystemType = "funeral" | "gift" | "default";

interface OrganizationContextValue {
	orgs: Org[];
	selectedOrg: Org | null;
	setSelectedOrg: (org: Org) => void;
	filteredOrgs: Org[];
	systemType: SystemType;
	setSystemType: (type: SystemType) => void;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const STORAGE_KEY = "kouden_selected_org";
const SYSTEM_TYPE_KEY = "kouden_system_type";

export function OrganizationProvider({ children }: { children: ReactNode }) {
	const { data: orgs = [], isLoading } = useOrganizations();
	const [selectedOrg, setSelectedOrgState] = useState<Org | null>(null);
	const [systemType, setSystemTypeState] = useState<SystemType>("default");

	// 全組織を表示（フィルタリングしない）
	const filteredOrgs = orgs;

	// 組織選択の永続化
	const setSelectedOrg = React.useCallback((org: Org) => {
		setSelectedOrgState(org);
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(org));
		}
	}, []);

	// システムタイプの永続化
	const setSystemType = React.useCallback((type: SystemType) => {
		setSystemTypeState(type);
		if (typeof window !== "undefined") {
			localStorage.setItem(SYSTEM_TYPE_KEY, type);
		}
		// システムタイプが変更されたら選択組織をリセット
		setSelectedOrgState(null);
	}, []);

	// 初期化処理
	useEffect(() => {
		if (typeof window === "undefined") return;

		// 保存されたシステムタイプを復元
		const savedSystemType = localStorage.getItem(SYSTEM_TYPE_KEY) as SystemType;
		if (savedSystemType && ["funeral", "gift", "default"].includes(savedSystemType)) {
			setSystemTypeState(savedSystemType);
		}

		// 保存された組織を復元
		const savedOrg = localStorage.getItem(STORAGE_KEY);
		if (savedOrg) {
			try {
				const parsedOrg = JSON.parse(savedOrg) as Org;
				setSelectedOrgState(parsedOrg);
			} catch (error) {
				console.warn("Failed to parse saved organization:", error);
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	}, []);

	// 組織リストが更新された時の処理
	useEffect(() => {
		if (isLoading) return;
		if (selectedOrg) {
			// 選択中の組織が現在のフィルタリング結果に含まれているかチェック
			const isSelectedOrgValid = filteredOrgs.some((org) => org.id === selectedOrg.id);
			if (!isSelectedOrgValid) {
				// 無効な場合は最初の組織を選択
				const firstOrg = filteredOrgs[0];
				if (firstOrg) {
					setSelectedOrg(firstOrg);
				} else {
					setSelectedOrgState(null);
				}
			}
			return;
		}

		// 組織が選択されていない場合は最初の組織を選択
		const firstOrg = filteredOrgs[0];
		if (firstOrg) {
			setSelectedOrg(firstOrg);
		}
	}, [isLoading, filteredOrgs, selectedOrg, setSelectedOrg]);

	if (isLoading) return null;

	return (
		<OrganizationContext.Provider
			value={{
				orgs,
				selectedOrg,
				setSelectedOrg,
				filteredOrgs,
				systemType,
				setSystemType,
			}}
		>
			{children}
		</OrganizationContext.Provider>
	);
}

export function useOrganization() {
	const context = useContext(OrganizationContext);
	if (!context) throw new Error("useOrganization must be used within OrganizationProvider");
	return context;
}
