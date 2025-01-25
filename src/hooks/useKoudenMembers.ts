import { createClient } from "@/lib/supabase/client";
import { useSupabaseError } from "./useSupabaseError";
import type { Database } from "@/types/supabase";

type KoudenMember = Database["public"]["Tables"]["kouden_members"]["Row"];
type InsertKoudenMember =
	Database["public"]["Tables"]["kouden_members"]["Insert"];

export function useKoudenMembers(koudenId: string) {
	const supabase = createClient();
	const { withErrorHandling, error, loading } = useSupabaseError();

	const addMember = async (data: Omit<InsertKoudenMember, "kouden_id">) => {
		return withErrorHandling(async () => {
			const { data: newMember, error } = await supabase
				.from("kouden_members")
				.insert([{ ...data, kouden_id: koudenId }])
				.select()
				.single();

			if (error) throw error;
			return newMember;
		});
	};

	const removeMember = async (userId: string) => {
		return withErrorHandling(async () => {
			const { error } = await supabase
				.from("kouden_members")
				.delete()
				.eq("user_id", userId)
				.eq("kouden_id", koudenId);

			if (error) throw error;
		});
	};

	const updateRole = async (userId: string, roleId: string) => {
		return withErrorHandling(async () => {
			const { data: updatedMember, error } = await supabase.rpc(
				"update_member_role",
				{
					p_kouden_id: koudenId,
					p_user_id: userId,
					p_role_id: roleId,
				},
			);

			if (error) throw error;
			return updatedMember;
		});
	};

	return {
		addMember,
		removeMember,
		updateRole,
		error,
		loading,
	};
}
