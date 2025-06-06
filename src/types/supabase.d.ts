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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      delivery_methods: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_system: boolean
          kouden_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_system?: boolean
          kouden_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_system?: boolean
          kouden_id?: string
          name?: string
          updated_at?: string
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
          is_duplicate: boolean
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
          is_duplicate?: boolean
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
          is_duplicate?: boolean
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
      kouden_purchases: {
        Row: {
          amount_paid: number
          expected_count: number | null
          id: string
          kouden_id: string
          plan_id: string
          purchased_at: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          expected_count?: number | null
          id?: string
          kouden_id: string
          plan_id: string
          purchased_at?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          expected_count?: number | null
          id?: string
          kouden_id?: string
          plan_id?: string
          purchased_at?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kouden_purchases_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kouden_purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
          plan_id: string
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
          plan_id: string
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
          plan_id?: string
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
          {
            foreignKeyName: "koudens_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_types: {
        Row: {
          created_at: string
          default_icon: string | null
          default_title: string
          description: string | null
          id: number
          type_key: string
        }
        Insert: {
          created_at?: string
          default_icon?: string | null
          default_title: string
          description?: string | null
          id?: number
          type_key: string
        }
        Update: {
          created_at?: string
          default_icon?: string | null
          default_title?: string
          description?: string | null
          id?: number
          type_key?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          link_path: string | null
          notification_type_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          link_path?: string | null
          notification_type_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          link_path?: string | null
          notification_type_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_notification_type_id_fkey"
            columns: ["notification_type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      offering_entries: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kouden_entry_id: string
          offering_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kouden_entry_id: string
          offering_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kouden_entry_id?: string
          offering_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offering_entries_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offering_entries_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      offering_photos: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string
          id: string
          offering_id: string
          storage_key: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by: string
          id?: string
          offering_id: string
          storage_key: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string
          id?: string
          offering_id?: string
          storage_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offering_photos_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      offerings: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          kouden_id: string
          notes: string | null
          price: number | null
          provider_name: string
          quantity: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          kouden_id: string
          notes?: string | null
          price?: number | null
          provider_name: string
          quantity?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          kouden_id?: string
          notes?: string | null
          price?: number | null
          provider_name?: string
          quantity?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerings_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
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
          description: string | null
          id: string
          kouden_id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          kouden_id: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          kouden_id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_item_masters_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
      return_method_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_item_required: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_item_required?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_item_required?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      return_record_entries: {
        Row: {
          assigned_amount: number
          created_at: string
          created_by: string
          kouden_entry_id: string
          return_record_id: string
          updated_at: string
        }
        Insert: {
          assigned_amount?: number
          created_at?: string
          created_by: string
          kouden_entry_id: string
          return_record_id: string
          updated_at?: string
        }
        Update: {
          assigned_amount?: number
          created_at?: string
          created_by?: string
          kouden_entry_id?: string
          return_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_record_entries_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_record_entries_return_record_id_fkey"
            columns: ["return_record_id"]
            isOneToOne: false
            referencedRelation: "return_records"
            referencedColumns: ["id"]
          },
        ]
      }
      return_record_item_entries: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kouden_entry_id: string
          notes: string | null
          quantity: number
          return_record_item_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kouden_entry_id: string
          notes?: string | null
          quantity?: number
          return_record_item_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kouden_entry_id?: string
          notes?: string | null
          quantity?: number
          return_record_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrient_kouden_entry_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrient_return_record_item_fkey"
            columns: ["return_record_item_id"]
            isOneToOne: false
            referencedRelation: "return_record_items"
            referencedColumns: ["id"]
          },
        ]
      }
      return_record_items: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          price: number
          quantity: number
          return_item_master_id: string
          return_record_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          price: number
          quantity?: number
          return_item_master_id: string
          return_record_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          price?: number
          quantity?: number
          return_item_master_id?: string
          return_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_record_items_return_item_master_id_fkey"
            columns: ["return_item_master_id"]
            isOneToOne: false
            referencedRelation: "return_items"
            referencedColumns: ["id"]
          },
        ]
      }
      return_record_offerings: {
        Row: {
          assigned_quantity: number
          created_at: string
          created_by: string
          offering_id: string
          return_record_id: string
          updated_at: string
        }
        Insert: {
          assigned_quantity?: number
          created_at?: string
          created_by: string
          offering_id: string
          return_record_id: string
          updated_at?: string
        }
        Update: {
          assigned_quantity?: number
          created_at?: string
          created_by?: string
          offering_id?: string
          return_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_record_offerings_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_record_offerings_return_record_id_fkey"
            columns: ["return_record_id"]
            isOneToOne: false
            referencedRelation: "return_records"
            referencedColumns: ["id"]
          },
        ]
      }
      return_record_selected_methods: {
        Row: {
          created_at: string
          id: string
          return_method_type_id: string
          return_record_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          return_method_type_id: string
          return_record_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          return_method_type_id?: string
          return_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_record_selected_methods_return_method_type_id_fkey"
            columns: ["return_method_type_id"]
            isOneToOne: false
            referencedRelation: "return_method_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_record_selected_methods_return_record_id_fkey"
            columns: ["return_record_id"]
            isOneToOne: false
            referencedRelation: "return_records"
            referencedColumns: ["id"]
          },
        ]
      }
      return_records: {
        Row: {
          arrangement_date: string | null
          created_at: string
          created_by: string
          id: string
          koden_id: string
          remarks: string | null
          status: string
          updated_at: string
        }
        Insert: {
          arrangement_date?: string | null
          created_at?: string
          created_by: string
          id?: string
          koden_id: string
          remarks?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          arrangement_date?: string | null
          created_at?: string
          created_by?: string
          id?: string
          koden_id?: string
          remarks?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_records_koden_id_fkey"
            columns: ["koden_id"]
            isOneToOne: true
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          content: string
          created_at: string | null
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          content: string
          created_at?: string | null
          id?: string
          priority: string
          resolved_at?: string | null
          status: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          content?: string
          created_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_announcements: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          priority: string
          published_at: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          priority?: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          priority?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      telegrams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kouden_entry_id: string | null
          kouden_id: string
          message: string | null
          notes: string | null
          sender_name: string
          sender_organization: string | null
          sender_position: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kouden_entry_id?: string | null
          kouden_id: string
          message?: string | null
          notes?: string | null
          sender_name: string
          sender_organization?: string | null
          sender_position?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kouden_entry_id?: string | null
          kouden_id?: string
          message?: string | null
          notes?: string | null
          sender_name?: string
          sender_organization?: string | null
          sender_position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegrams_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegrams_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_admin_reply: boolean
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_admin_reply?: boolean
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_admin_reply?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          is_read: boolean | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          is_read?: boolean | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          is_read?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "system_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          guide_mode: boolean | null
          id: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          guide_mode?: boolean | null
          id: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          guide_mode?: boolean | null
          id?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { p_invitation_token: string; p_user_id: string }
        Returns: undefined
      }
      cleanup_expired_locks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_admin_audit_log: {
        Args: {
          p_action: string
          p_target_type: string
          p_target_id: string
          p_details?: Json
          p_ip_address?: unknown
        }
        Returns: string
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
      has_kouden_access: {
        Args: { p_kouden_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uid: string }
        Returns: boolean
      }
      log_debug: {
        Args: { p_action: string; p_details: Json }
        Returns: string
      }
      remove_member: {
        Args: { p_kouden_id: string; p_user_id: string }
        Returns: undefined
      }
      set_invitation_token: {
        Args: { token: string }
        Returns: undefined
      }
      update_member_role: {
        Args: { p_kouden_id: string; p_user_id: string; p_role_id: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_type: ["FUNERAL", "CONDOLENCE_VISIT"],
      delivery_method: ["MAIL", "HAND", "DELIVERY", "OTHER"],
      invitation_status: [
        "pending",
        "accepted",
        "rejected",
        "expired",
        "canceled",
      ],
      invitation_type: ["email", "share"],
      offering_type: ["FLOWER", "INCENSE", "FOOD", "MONEY", "OTHER"],
    },
  },
} as const
