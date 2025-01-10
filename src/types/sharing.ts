export type MemberRole = "viewer" | "editor";

export interface KoudenMember {
	id: string;
	kouden_id: string;
	user_id: string;
	role: MemberRole;
	created_at: string;
	updated_at: string;
	created_by: string;
	// プロフィール情報を含める
	profile?: {
		display_name: string;
		avatar_url: string | null;
	};
}

export interface KoudenInvitation {
	id: string;
	kouden_id: string;
	email: string;
	role: MemberRole;
	invitation_token: string;
	expires_at: string;
	accepted_at: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
	// 香典帳の情報を含める
	kouden?: {
		title: string;
		owner_id: string;
		owner?: {
			display_name: string;
		};
	};
}

export interface InviteUserParams {
	koudenId: string;
	email: string;
	role: MemberRole;
}

export interface UpdateMemberRoleParams {
	memberId: string;
	role: MemberRole;
}

export interface AcceptInvitationParams {
	invitationToken: string;
}

export interface GetKoudenMembersParams {
	koudenId: string;
}

export interface GetKoudenInvitationsParams {
	koudenId: string;
}
