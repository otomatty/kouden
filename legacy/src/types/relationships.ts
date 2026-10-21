import type { Database } from "./supabase";

export type Relationship = Database["public"]["Tables"]["relationships"]["Row"];

export interface CreateRelationshipInput {
	name: string;
	description?: string | null;
}

export interface UpdateRelationshipInput {
	name?: string;
	description?: string | null;
}

export type RelationshipResponse = {
	data: Relationship | null;
	error: string | null;
};

export type RelationshipsResponse = {
	data: Relationship[] | null;
	error: string | null;
};
