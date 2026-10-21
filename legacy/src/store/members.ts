import { atomFamily } from "jotai/utils";
import { atom } from "jotai";
import type { KoudenMember } from "@/types/member";
import type { KoudenRole, KoudenPermission } from "@/types/role";

export interface MembersState {
	members: KoudenMember[];
	roles: KoudenRole[];
	permission: KoudenPermission;
	isLoading: boolean;
	lastUpdated: number;
}

// キャッシュの有効期限を5分に設定
const CACHE_EXPIRY = 5 * 60 * 1000;

export const membersAtomFamily = atomFamily(() =>
	atom<MembersState>({
		members: [],
		roles: [],
		permission: "viewer",
		isLoading: true,
		lastUpdated: 0,
	}),
);

// キャッシュが有効かどうかを判定する関数
export const isCacheValid = (lastUpdated: number) => {
	return Date.now() - lastUpdated < CACHE_EXPIRY;
};

export const membersAtom = atom<KoudenMember[]>([]);
