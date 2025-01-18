export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      debug_logs: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      kouden_entries: {
        Row: {
          address: string | null
          amount: number
          attendance_type: string
          created_at: string
          created_by: string
          has_offering: boolean
          id: string
          is_return_completed: boolean
          kouden_id: string
          last_modified_at: string | null
          last_modified_by: string | null
          name: string | null
          notes: string | null
          organization: string | null
          phone_number: string | null
          position: string | null
          postal_code: string | null
          relationship_id: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          address?: string | null
          amount: number
          attendance_type: string
          created_at?: string
          created_by: string
          has_offering?: boolean
          id?: string
          is_return_completed?: boolean
          kouden_id: string
          last_modified_at?: string | null
          last_modified_by?: string | null
          name?: string | null
          notes?: string | null
          organization?: string | null
          phone_number?: string | null
          position?: string | null
          postal_code?: string | null
          relationship_id?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          address?: string | null
          amount?: number
          attendance_type?: string
          created_at?: string
          created_by?: string
          has_offering?: boolean
          id?: string
          is_return_completed?: boolean
          kouden_id?: string
          last_modified_at?: string | null
          last_modified_by?: string | null
          name?: string | null
          notes?: string | null
          organization?: string | null
          phone_number?: string | null
          position?: string | null
          postal_code?: string | null
          relationship_id?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kouden_entries_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
      kouden_entry_audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kouden_entry_audit_logs_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      kouden_entry_locks: {
        Row: {
          created_at: string
          entry_id: string
          expires_at: string
          id: string
          locked_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          expires_at?: string
          id?: string
          locked_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          expires_at?: string
          id?: string
          locked_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kouden_entry_locks_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      kouden_invitations: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          invitation_token: string
          kouden_data: Json | null
          kouden_id: string
          max_uses: number | null
          role_id: string
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
          used_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          invitation_token?: string
          kouden_data?: Json | null
          kouden_id: string
          max_uses?: number | null
          role_id: string
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
          used_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          kouden_data?: Json | null
          kouden_id?: string
          max_uses?: number | null
          role_id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "kouden_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kouden_invitations_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kouden_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "kouden_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      kouden_members: {
        Row: {
          added_by: string
          created_at: string
          id: string
          invitation_id: string | null
          kouden_id: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          invitation_id?: string | null
          kouden_id: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          invitation_id?: string | null
          kouden_id?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kouden_members_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kouden_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "kouden_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      kouden_roles: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          kouden_id: string
          name: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          kouden_id: string
          name: string
          permissions: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          kouden_id?: string
          name?: string
          permissions?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kouden_roles_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
      koudens: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          owner_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          owner_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          owner_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "koudens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "koudens_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offerings: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          kouden_entry_id: string | null
          notes: string | null
          price: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          kouden_entry_id?: string | null
          notes?: string | null
          price?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          kouden_entry_id?: string | null
          notes?: string | null
          price?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerings_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          kouden_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          kouden_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          kouden_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          created_at: string
          created_by: string
          delivery_method: string
          id: string
          kouden_entry_id: string
          name: string
          notes: string | null
          price: number
          sent_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          delivery_method: string
          id?: string
          kouden_entry_id: string
          name: string
          notes?: string | null
          price: number
          sent_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_method?: string
          id?: string
          kouden_entry_id?: string
          name?: string
          notes?: string | null
          price?: number
          sent_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_items_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: {
          p_invitation_token: string
          p_user_id: string
        }
        Returns: undefined
      }
      cleanup_expired_locks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_invitation: {
        Args: {
          p_kouden_id: string
          p_email: string
          p_role_id: string
          p_created_by: string
          p_type?: Database["public"]["Enums"]["invitation_type"]
          p_max_uses?: number
        }
        Returns: string
      }
      initialize_default_relationships: {
        Args: {
          kouden_id: string
          owner_id: string
        }
        Returns: undefined
      }
      log_debug: {
        Args: {
          p_action: string
          p_details: Json
        }
        Returns: string
      }
      remove_member: {
        Args: {
          p_kouden_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      set_invitation_token: {
        Args: {
          token: string
        }
        Returns: undefined
      }
      update_member_role: {
        Args: {
          p_kouden_id: string
          p_user_id: string
          p_role_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      attendance_type: "FUNERAL" | "CONDOLENCE_VISIT"
      delivery_method: "MAIL" | "HAND" | "DELIVERY" | "OTHER"
      invitation_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "canceled"
      invitation_type: "email" | "share"
      offering_type: "FLOWER" | "INCENSE" | "FOOD" | "MONEY" | "OTHER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

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
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

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
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
