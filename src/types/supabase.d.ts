export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			kouden_entries: {
				Row: {
					address: string;
					amount: number;
					attendance_type: string;
					created_at: string;
					created_by: string;
					has_offering: boolean;
					id: string;
					is_return_completed: boolean;
					kouden_id: string;
					name: string;
					notes: string | null;
					organization: string | null;
					phone_number: string | null;
					position: string | null;
					postal_code: string | null;
					relationship_id: string | null;
					updated_at: string;
				};
				Insert: {
					address: string;
					amount: number;
					attendance_type: string;
					created_at?: string;
					created_by: string;
					has_offering?: boolean;
					id?: string;
					is_return_completed?: boolean;
					kouden_id: string;
					name: string;
					notes?: string | null;
					organization?: string | null;
					phone_number?: string | null;
					position?: string | null;
					postal_code?: string | null;
					relationship_id?: string | null;
					updated_at?: string;
				};
				Update: {
					address?: string;
					amount?: number;
					attendance_type?: string;
					created_at?: string;
					created_by?: string;
					has_offering?: boolean;
					id?: string;
					is_return_completed?: boolean;
					kouden_id?: string;
					name?: string;
					notes?: string | null;
					organization?: string | null;
					phone_number?: string | null;
					position?: string | null;
					postal_code?: string | null;
					relationship_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "kouden_entries_kouden_id_fkey";
						columns: ["kouden_id"];
						isOneToOne: false;
						referencedRelation: "koudens";
						referencedColumns: ["id"];
					},
				];
			};
			kouden_invitations: {
				Row: {
					created_at: string;
					email: string;
					expires_at: string;
					id: string;
					invitation_token: string;
					kouden_id: string;
					role: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					email: string;
					expires_at: string;
					id?: string;
					invitation_token: string;
					kouden_id: string;
					role: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					email?: string;
					expires_at?: string;
					id?: string;
					invitation_token?: string;
					kouden_id?: string;
					role?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "kouden_invitations_kouden_id_fkey";
						columns: ["kouden_id"];
						isOneToOne: false;
						referencedRelation: "koudens";
						referencedColumns: ["id"];
					},
				];
			};
			kouden_members: {
				Row: {
					created_at: string;
					id: string;
					kouden_id: string;
					role: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					kouden_id: string;
					role: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					kouden_id?: string;
					role?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "kouden_members_kouden_id_fkey";
						columns: ["kouden_id"];
						isOneToOne: false;
						referencedRelation: "koudens";
						referencedColumns: ["id"];
					},
				];
			};
			koudens: {
				Row: {
					created_at: string;
					created_by: string;
					description: string | null;
					id: string;
					owner_id: string;
					status: string;
					title: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					created_by: string;
					description?: string | null;
					id?: string;
					owner_id: string;
					status?: string;
					title: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					description?: string | null;
					id?: string;
					owner_id?: string;
					status?: string;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "koudens_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "koudens_owner_id_fkey";
						columns: ["owner_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			offerings: {
				Row: {
					created_at: string;
					created_by: string;
					description: string;
					id: string;
					kouden_entry_id: string;
					notes: string | null;
					price: number | null;
					type: Database["public"]["Enums"]["offering_type"] | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					created_by: string;
					description: string;
					id?: string;
					kouden_entry_id: string;
					notes?: string | null;
					price?: number | null;
					type?: Database["public"]["Enums"]["offering_type"] | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					description?: string;
					id?: string;
					kouden_entry_id?: string;
					notes?: string | null;
					price?: number | null;
					type?: Database["public"]["Enums"]["offering_type"] | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string;
					display_name: string;
					id: string;
					updated_at: string;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string;
					display_name: string;
					id: string;
					updated_at?: string;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string;
					display_name?: string;
					id?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			relationships: {
				Row: {
					created_at: string;
					created_by: string;
					description: string | null;
					id: string;
					is_default: boolean;
					kouden_id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					created_by: string;
					description?: string | null;
					id?: string;
					is_default?: boolean;
					kouden_id: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					description?: string | null;
					id?: string;
					is_default?: boolean;
					kouden_id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "relationships_kouden_id_fkey";
						columns: ["kouden_id"];
						isOneToOne: false;
						referencedRelation: "koudens";
						referencedColumns: ["id"];
					},
				];
			};
			return_items: {
				Row: {
					created_at: string;
					created_by: string;
					delivery_method:
						| Database["public"]["Enums"]["delivery_method"]
						| null;
					id: string;
					kouden_entry_id: string;
					name: string;
					notes: string | null;
					price: number;
					sent_date: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					created_by: string;
					delivery_method?:
						| Database["public"]["Enums"]["delivery_method"]
						| null;
					id?: string;
					kouden_entry_id: string;
					name: string;
					notes?: string | null;
					price: number;
					sent_date?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					delivery_method?:
						| Database["public"]["Enums"]["delivery_method"]
						| null;
					id?: string;
					kouden_entry_id?: string;
					name?: string;
					notes?: string | null;
					price?: number;
					sent_date?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			initialize_default_relationships: {
				Args: {
					kouden_id: string;
					owner_id: string;
				};
				Returns: undefined;
			};
			get_realtime_token: {
				Args: Record<string, never>;
				Returns: string;
			};
		};
		Enums: {
			attendance_type: "FUNERAL" | "CONDOLENCE_VISIT";
			delivery_method: "MAIL" | "HAND" | "DELIVERY" | "OTHER";
			offering_type: "FLOWER" | "INCENSE" | "FOOD" | "MONEY" | "OTHER";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
	PublicTableNameOrOptions extends
		| keyof (PublicSchema["Tables"] & PublicSchema["Views"])
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
				Database[PublicTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
			Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
				PublicSchema["Views"])
		? (PublicSchema["Tables"] &
				PublicSchema["Views"])[PublicTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	PublicTableNameOrOptions extends
		| keyof PublicSchema["Tables"]
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
		? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	PublicTableNameOrOptions extends
		| keyof PublicSchema["Tables"]
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
		? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	PublicEnumNameOrOptions extends
		| keyof PublicSchema["Enums"]
		| { schema: keyof Database },
	EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
	? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
		? PublicSchema["Enums"][PublicEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof PublicSchema["CompositeTypes"]
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
		? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;
