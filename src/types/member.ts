export interface KoudenMember {
	id: string;
	user_id: string;
	kouden_id: string;
	role: {
		id: string;
		name: string;
	};
	profile?: {
		display_name: string | null;
		avatar_url: string | null;
	};
}
