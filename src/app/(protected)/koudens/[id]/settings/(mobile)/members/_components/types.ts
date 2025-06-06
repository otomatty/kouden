import type { KoudenMember } from "@/types/member";

export type Member = {
	id: string;
	user_id: string;
	role_id: string;
	profile: {
		id: string;
		display_name: string;
		avatar_url: string | null;
	};
	role: {
		id: string;
		name: string;
	};
	isOwner: boolean;
	canUpdateRole: boolean;
	canDelete: boolean;
};

export interface UiMember {
	id: string;
	user_id: string;
	role_id: string;
	profile: {
		display_name: string | null;
		avatar_url: string | null;
	};
	role: {
		id: string;
		name: string;
	};
	isOwner: boolean;
	canUpdateRole: boolean;
	canDelete: boolean;
}

export const convertToUiMember = (member: KoudenMember): UiMember => {
	return {
		id: member.id,
		user_id: member.user_id,
		role_id: member.role.id,
		profile: member.profile ?? {
			display_name: null,
			avatar_url: null,
		},
		role: member.role,
		isOwner: member.role.name.toUpperCase() === "OWNER",
		canUpdateRole: true, // TODO: 実際の権限チェックを実装
		canDelete: true, // TODO: 実際の権限チェックを実装
	};
};
