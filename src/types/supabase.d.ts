export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  common: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customers_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          item: string
          organization_id: string
          stock_level: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          item: string
          organization_id: string
          stock_level: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          item?: string
          organization_id?: string
          stock_level?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_types: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          requested_by: string
          status: string
          type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          requested_by: string
          status?: string
          type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          requested_by?: string
          status?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "organization_types"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          id: string
          resource: string
        }
        Insert: {
          action: string
          id?: string
          resource: string
        }
        Update: {
          action?: string
          id?: string
          resource?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rp_permission"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rp_role"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  funeral: {
    Tables: {
      attendees: {
        Row: {
          case_id: string
          created_at: string
          id: string
          name: string
          organization_id: string
          relation: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          relation?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          relation?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attendees_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          created_at: string
          customer_id: string
          deceased_name: string
          id: string
          organization_id: string
          start_datetime: string | null
          status: string | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          deceased_name: string
          id?: string
          organization_id: string
          start_datetime?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          deceased_name?: string
          id?: string
          organization_id?: string
          start_datetime?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_sent_at: string | null
          organization_id: string
          template: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_sent_at?: string | null
          organization_id: string
          template?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_sent_at?: string | null
          organization_id?: string
          template?: string | null
          type?: string | null
        }
        Relationships: []
      }
      customer_details: {
        Row: {
          address: string | null
          allergy: string | null
          created_at: string
          customer_id: string
          id: string
          last_contact_date: string | null
          notes: string | null
          organization_id: string
          registration_date: string | null
          religion: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergy?: string | null
          created_at?: string
          customer_id: string
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          organization_id: string
          registration_date?: string | null
          religion?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergy?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          organization_id?: string
          registration_date?: string | null
          religion?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          case_id: string
          created_at: string
          donor_name: string | null
          id: string
          organization_id: string
          received_at: string | null
        }
        Insert: {
          amount: number
          case_id: string
          created_at?: string
          donor_name?: string | null
          id?: string
          organization_id: string
          received_at?: string | null
        }
        Update: {
          amount?: number
          case_id?: string
          created_at?: string
          donor_name?: string | null
          id?: string
          organization_id?: string
          received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_donations_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          case_id: string
          created_at: string
          due_date: string | null
          id: string
          organization_id: string
          paid_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          case_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          organization_id: string
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          case_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      kouden_cases: {
        Row: {
          case_id: string
          created_at: string
          family_user_id: string | null
          id: string
          kouden_id: string
          organization_id: string
          proxy_manager_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          family_user_id?: string | null
          id?: string
          kouden_id: string
          organization_id: string
          proxy_manager_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          family_user_id?: string | null
          id?: string
          kouden_id?: string
          organization_id?: string
          proxy_manager_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kouden_cases_case"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      material_orders: {
        Row: {
          case_id: string
          created_at: string
          id: string
          item: string | null
          order_date: string | null
          organization_id: string
          quantity: number | null
          status: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          item?: string | null
          order_date?: string | null
          organization_id: string
          quantity?: number | null
          status?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          item?: string | null
          order_date?: string | null
          organization_id?: string
          quantity?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_material_orders_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          case_id: string
          created_at: string
          id: string
          organization_id: string
          pdf_url: string | null
          status: string | null
          total_amount: number
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          organization_id: string
          pdf_url?: string | null
          status?: string | null
          total_amount: number
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          pdf_url?: string | null
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotes_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          customer_id: string
          date: string | null
          id: string
          organization_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          date?: string | null
          id?: string
          organization_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          date?: string | null
          id?: string
          organization_id?: string
          status?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string
          case_id: string
          created_at: string
          due_date: string | null
          id: string
          organization_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          case_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          organization_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          case_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  gift: {
    Tables: {
      loyalty_points: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          organization_id: string
          points: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          organization_id: string
          points: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          points?: number
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          end_date: string | null
          id: string
          name: string
          organization_id: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          end_date?: string | null
          id?: string
          name: string
          organization_id: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          end_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      marketing_templates: {
        Row: {
          campaign_id: string
          content: string | null
          id: string
          type: string | null
        }
        Insert: {
          campaign_id: string
          content?: string | null
          id?: string
          type?: string | null
        }
        Update: {
          campaign_id?: string
          content?: string | null
          id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_templates_campaign"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_items_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          organization_id: string
          status: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          organization_id: string
          status?: string | null
          total_amount: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          organization_id?: string
          status?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          price: number
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          price: number
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string
          created_at: string
          discount_type: string | null
          discount_value: number | null
          expires_at: string | null
          id: string
          organization_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          organization_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          organization_id?: string
        }
        Relationships: []
      }
      shipping: {
        Row: {
          carrier: string | null
          delivered_at: string | null
          id: string
          order_id: string
          organization_id: string
          status: string | null
          tracking_no: string | null
        }
        Insert: {
          carrier?: string | null
          delivered_at?: string | null
          id?: string
          order_id: string
          organization_id: string
          status?: string | null
          tracking_no?: string | null
        }
        Update: {
          carrier?: string | null
          delivered_at?: string | null
          id?: string
          order_id?: string
          organization_id?: string
          status?: string | null
          tracking_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_shipping_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          message: string
          organization_id: string
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          message: string
          organization_id: string
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          message?: string
          organization_id?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tiers: {
        Row: {
          id: string
          name: string
          organization_id: string
          threshold: number
        }
        Insert: {
          id?: string
          name: string
          organization_id: string
          threshold: number
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string
          threshold?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
          failed_login_attempts: number | null
          id: string
          last_login_at: string | null
          role: string
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          role?: string
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          role?: string
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string
          cta_label: string | null
          cta_link: string | null
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          priority: number
          show_until: string | null
          title: string
          type: Database["public"]["Enums"]["announcement_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          cta_label?: string | null
          cta_link?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          priority?: number
          show_until?: string | null
          title: string
          type?: Database["public"]["Enums"]["announcement_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          cta_label?: string | null
          cta_link?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          priority?: number
          show_until?: string | null
          title?: string
          type?: Database["public"]["Enums"]["announcement_type"]
          updated_at?: string
        }
        Relationships: []
      }
      campaign_hearing_applications: {
        Row: {
          created_at: string | null
          form_data: Json
          google_event_id: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          form_data: Json
          google_event_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          form_data?: Json
          google_event_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_request_attachments: {
        Row: {
          file_name: string
          file_url: string
          id: string
          request_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          request_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          request_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "contact_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          category: string
          company_name: string | null
          created_at: string
          email: string
          id: string
          ip_address: unknown | null
          message: string
          name: string | null
          status: string
          subject: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown | null
          message: string
          name?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          message?: string
          name?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_responses: {
        Row: {
          created_at: string
          id: string
          request_id: string
          responder_id: string | null
          response_message: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          responder_id?: string | null
          response_message: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          responder_id?: string | null
          response_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "contact_requests"
            referencedColumns: ["id"]
          },
        ]
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
      file_upload_restrictions: {
        Row: {
          created_at: string
          description: string | null
          file_extension: string
          id: string
          is_allowed: boolean
          max_file_size: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_extension: string
          id?: string
          is_allowed?: boolean
          max_file_size?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_extension?: string
          id?: string
          is_allowed?: boolean
          max_file_size?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ip_restrictions: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          reason: string | null
          restriction_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
          reason?: string | null
          restriction_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          reason?: string | null
          restriction_type?: string
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
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
          },
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
          {
            foreignKeyName: "kouden_entry_audit_logs_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "offering_consistency_check"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "kouden_entry_audit_logs_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "return_management_summary"
            referencedColumns: ["kouden_entry_id"]
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
          {
            foreignKeyName: "kouden_entry_locks_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "offering_consistency_check"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "kouden_entry_locks_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "return_management_summary"
            referencedColumns: ["kouden_entry_id"]
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
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
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
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
          },
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
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
          },
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
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
          },
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
      login_attempts: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          ip_address: unknown
          last_attempt_at: string
          locked_until: string | null
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          ip_address: unknown
          last_attempt_at?: string
          locked_until?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          ip_address?: unknown
          last_attempt_at?: string
          locked_until?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      offering_allocations: {
        Row: {
          allocated_amount: number
          allocation_ratio: number
          contribution_notes: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_primary_contributor: boolean | null
          kouden_entry_id: string | null
          offering_id: string | null
          updated_at: string | null
        }
        Insert: {
          allocated_amount: number
          allocation_ratio: number
          contribution_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_primary_contributor?: boolean | null
          kouden_entry_id?: string | null
          offering_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allocated_amount?: number
          allocation_ratio?: number
          contribution_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_primary_contributor?: boolean | null
          kouden_entry_id?: string | null
          offering_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offering_allocations_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offering_allocations_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "offering_consistency_check"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "offering_allocations_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "return_management_summary"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "offering_allocations_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
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
            foreignKeyName: "offering_entries_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "offering_consistency_check"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "offering_entries_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "return_management_summary"
            referencedColumns: ["kouden_entry_id"]
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
          price: number
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
          price?: number
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
          price?: number
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
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
          },
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
      posts: {
        Row: {
          author_id: string
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          organization_id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          organization_id: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          organization_id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
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
          is_enabled: boolean
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
          is_enabled?: boolean
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
          is_enabled?: boolean
          kouden_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
          },
          {
            foreignKeyName: "relationships_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
      return_entry_records: {
        Row: {
          additional_return_amount: number | null
          arrangement_date: string | null
          created_at: string
          created_by: string
          funeral_gift_amount: number
          id: string
          kouden_entry_id: string
          profit_loss: number | null
          remarks: string | null
          return_items: Json | null
          return_items_cost: number
          return_method: string | null
          return_status: string
          shipping_address: string | null
          shipping_phone_number: string | null
          shipping_postal_code: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          additional_return_amount?: number | null
          arrangement_date?: string | null
          created_at?: string
          created_by: string
          funeral_gift_amount?: number
          id?: string
          kouden_entry_id: string
          profit_loss?: number | null
          remarks?: string | null
          return_items?: Json | null
          return_items_cost?: number
          return_method?: string | null
          return_status?: string
          shipping_address?: string | null
          shipping_phone_number?: string | null
          shipping_postal_code?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          additional_return_amount?: number | null
          arrangement_date?: string | null
          created_at?: string
          created_by?: string
          funeral_gift_amount?: number
          id?: string
          kouden_entry_id?: string
          profit_loss?: number | null
          remarks?: string | null
          return_items?: Json | null
          return_items_cost?: number
          return_method?: string | null
          return_status?: string
          shipping_address?: string | null
          shipping_phone_number?: string | null
          shipping_postal_code?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_entry_records_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: true
            referencedRelation: "kouden_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_entry_records_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: true
            referencedRelation: "offering_consistency_check"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "return_entry_records_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: true
            referencedRelation: "return_management_summary"
            referencedColumns: ["kouden_entry_id"]
          },
        ]
      }
      return_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          kouden_id: string
          name: string
          price: number
          recommended_amount_max: number | null
          recommended_amount_min: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          kouden_id: string
          name: string
          price: number
          recommended_amount_max?: number | null
          recommended_amount_min?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          kouden_id?: string
          name?: string
          price?: number
          recommended_amount_max?: number | null
          recommended_amount_min?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_item_masters_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
          },
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
            foreignKeyName: "rrient_kouden_entry_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "offering_consistency_check"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "rrient_kouden_entry_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "return_management_summary"
            referencedColumns: ["kouden_entry_id"]
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
        ]
      }
      security_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          request_path: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          request_path?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          request_path?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
            foreignKeyName: "telegrams_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "offering_consistency_check"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "telegrams_kouden_entry_id_fkey"
            columns: ["kouden_entry_id"]
            isOneToOne: false
            referencedRelation: "return_management_summary"
            referencedColumns: ["kouden_entry_id"]
          },
          {
            foreignKeyName: "telegrams_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
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
      kouden_return_summary: {
        Row: {
          additional_return_amount_sum: number | null
          completed_count: number | null
          completion_rate: number | null
          description: string | null
          funeral_gift_amount_sum: number | null
          kouden_id: string | null
          needs_additional_count: number | null
          partial_count: number | null
          pending_count: number | null
          title: string | null
          total_amount_sum: number | null
          total_entries: number | null
        }
        Relationships: []
      }
      offering_consistency_check: {
        Row: {
          has_offering: boolean | null
          kouden_entry_id: string | null
          name: string | null
          offering_entries_count: number | null
          status: string | null
        }
        Relationships: []
      }
      return_management_summary: {
        Row: {
          additional_return_amount: number | null
          arrangement_date: string | null
          entry_name: string | null
          entry_position: string | null
          funeral_gift_amount: number | null
          kouden_amount: number | null
          kouden_entry_id: string | null
          kouden_id: string | null
          needs_additional_return: boolean | null
          offering_count: number | null
          offering_total: number | null
          organization: string | null
          profit_loss: number | null
          relationship_name: string | null
          remarks: string | null
          return_items: Json | null
          return_items_cost: number | null
          return_method: string | null
          return_record_created: string | null
          return_record_updated: string | null
          return_status: string | null
          shipping_address: string | null
          shipping_phone_number: string | null
          shipping_postal_code: string | null
          status_display: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kouden_entries_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "kouden_return_summary"
            referencedColumns: ["kouden_id"]
          },
          {
            foreignKeyName: "kouden_entries_kouden_id_fkey"
            columns: ["kouden_id"]
            isOneToOne: false
            referencedRelation: "koudens"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: {
        Args: { p_invitation_token: string; p_user_id: string }
        Returns: undefined
      }
      bulk_mark_funeral_gift_returned: {
        Args: {
          kouden_id_param: string
          funeral_gift_amount_param: number
          performed_by?: string
        }
        Returns: {
          updated_count: number
          affected_entries: Json
        }[]
      }
      calculate_return_items_cost: {
        Args: { p_return_record_id: string }
        Returns: number
      }
      calculate_total_amount: {
        Args: { p_kouden_entry_id: string }
        Returns: number
      }
      check_offering_allocation_integrity: {
        Args: { p_offering_id?: string }
        Returns: {
          offering_id: string
          total_allocated: number
          offering_price: number
          allocation_difference: number
          ratio_sum: number
        }[]
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
      create_entry_with_return_record: {
        Args: {
          p_kouden_id: string
          p_created_by: string
          p_name?: string
          p_organization?: string
          p_position?: string
          p_amount?: number
          p_postal_code?: string
          p_address?: string
          p_phone_number?: string
          p_relationship_id?: string
          p_attendance_type?: string
          p_has_offering?: boolean
          p_notes?: string
        }
        Returns: {
          id: string
          kouden_id: string
          name: string
          organization: string
          position: string
          amount: number
          postal_code: string
          address: string
          phone_number: string
          relationship_id: string
          attendance_type: string
          has_offering: boolean
          notes: string
          created_at: string
          updated_at: string
          created_by: string
          version: number
          last_modified_at: string
          last_modified_by: string
          is_duplicate: boolean
        }[]
      }
      create_funeral_company_role: {
        Args: { p_kouden_id: string; p_created_by: string }
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
      create_kouden_for_funeral_case: {
        Args: {
          p_case_id: string
          p_organization_id: string
          p_proxy_manager_id: string
          p_title: string
          p_description?: string
        }
        Returns: string
      }
      detect_suspicious_activity: {
        Args: { p_user_id: string; p_ip_address: unknown; p_event_type: string }
        Returns: boolean
      }
      get_kouden_return_summary: {
        Args: { kouden_id_param: string }
        Returns: {
          kouden_id: string
          title: string
          description: string
          total_entries: number
          completed_count: number
          partial_count: number
          pending_count: number
          needs_additional_count: number
          total_amount_sum: number
          funeral_gift_amount_sum: number
          additional_return_amount_sum: number
          completion_rate: number
        }[]
      }
      get_return_management_summary: {
        Args: { kouden_id_param: string }
        Returns: {
          kouden_id: string
          kouden_entry_id: string
          entry_name: string
          organization: string
          entry_position: string
          relationship_name: string
          kouden_amount: number
          offering_count: number
          offering_total: number
          total_amount: number
          return_status: string
          funeral_gift_amount: number
          additional_return_amount: number
          return_method: string
          return_items: Json
          arrangement_date: string
          remarks: string
          return_record_created: string
          return_record_updated: string
          status_display: string
          needs_additional_return: boolean
        }[]
      }
      get_user_organization_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
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
      log_security_event: {
        Args: {
          p_event_type: string
          p_user_id?: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_request_path?: string
          p_details?: Json
          p_severity?: string
        }
        Returns: string
      }
      migrate_return_entries: {
        Args: Record<PropertyKey, never>
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
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      transfer_kouden_ownership: {
        Args: {
          p_kouden_id: string
          p_new_owner_id: string
          p_proxy_manager_id: string
        }
        Returns: boolean
      }
      update_member_role: {
        Args: { p_kouden_id: string; p_user_id: string; p_role_id: string }
        Returns: undefined
      }
      update_return_status: {
        Args: {
          entry_id: string
          new_status: string
          new_funeral_gift_amount?: number
          return_method_param?: string
          return_items_param?: Json
          arrangement_date_param?: string
          remarks_param?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      announcement_type:
        | "info"
        | "warning"
        | "success"
        | "promotion"
        | "maintenance"
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
      post_status: "draft" | "published"
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
  common: {
    Enums: {},
  },
  funeral: {
    Enums: {},
  },
  gift: {
    Enums: {},
  },
  public: {
    Enums: {
      announcement_type: [
        "info",
        "warning",
        "success",
        "promotion",
        "maintenance",
      ],
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
      post_status: ["draft", "published"],
    },
  },
} as const
