export interface KoudenMember {
	id: string;
	kouden_id: string;
	user_id: string;
	role: {
		id: string;
		name: string;
	};
	created_at: string;
	updated_at: string;
	added_by: string;
	invitation_id?: string;
	profile?: {
		display_name: string | null;
		avatar_url: string | null;
	};
}

/**
 * 香典帳メンバーの作成時に必要な情報
 */
export interface CreateKoudenMemberInput {
	kouden_id: string;
	user_id: string;
	role_id: string;
	added_by: string;
	invitation_id?: string;
}

/**
 * 香典帳メンバーの更新時に必要な情報
 */
export interface UpdateKoudenMemberInput {
	role_id: string;
}
