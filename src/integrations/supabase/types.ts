export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          agent_type: string | null
          agent_type_confidence: number | null
          agent_type_stage: string | null
          agent_type_updated_at: string | null
          anthropic_agent_id: string | null
          composition_pattern: string
          created_at: string
          customer_id: string
          display_name: string
          enforcement_mode: string
          id: string
          last_seen_at: string | null
          legion_id: string | null
          native_agent_id: string
          parent_agent_id: string | null
          provider: string
          shield_mode_detected: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_type?: string | null
          agent_type_confidence?: number | null
          agent_type_stage?: string | null
          agent_type_updated_at?: string | null
          anthropic_agent_id?: string | null
          composition_pattern?: string
          created_at?: string
          customer_id: string
          display_name: string
          enforcement_mode?: string
          id?: string
          last_seen_at?: string | null
          legion_id?: string | null
          native_agent_id: string
          parent_agent_id?: string | null
          provider?: string
          shield_mode_detected?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_type?: string | null
          agent_type_confidence?: number | null
          agent_type_stage?: string | null
          agent_type_updated_at?: string | null
          anthropic_agent_id?: string | null
          composition_pattern?: string
          created_at?: string
          customer_id?: string
          display_name?: string
          enforcement_mode?: string
          id?: string
          last_seen_at?: string | null
          legion_id?: string | null
          native_agent_id?: string
          parent_agent_id?: string | null
          provider?: string
          shield_mode_detected?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "agents_legion_id_fkey"
            columns: ["legion_id"]
            isOneToOne: false
            referencedRelation: "legions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_parent_agent_id_fkey"
            columns: ["parent_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_parent_agent_id_fkey"
            columns: ["parent_agent_id"]
            isOneToOne: false
            referencedRelation: "loop_overview_v"
            referencedColumns: ["agent_id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          customer_id: string
          hash: string
          id: string
          label: string
          last_used_at: string | null
          prefix: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          customer_id: string
          hash: string
          id?: string
          label: string
          last_used_at?: string | null
          prefix: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          customer_id?: string
          hash?: string
          id?: string
          label?: string
          last_used_at?: string | null
          prefix?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          plan: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          plan?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      decisions: {
        Row: {
          action_type: string | null
          agent_id: string
          customer_id: string
          decided_at: string
          decided_in_ms: number | null
          decision: string
          event_id_hash: string | null
          id: string
          input_hash: string | null
          message: string | null
          mode: string
          policy_id: string | null
          session_hash: string | null
          tool_name: string | null
          verification_status: string | null
        }
        Insert: {
          action_type?: string | null
          agent_id: string
          customer_id: string
          decided_at?: string
          decided_in_ms?: number | null
          decision: string
          event_id_hash?: string | null
          id?: string
          input_hash?: string | null
          message?: string | null
          mode?: string
          policy_id?: string | null
          session_hash?: string | null
          tool_name?: string | null
          verification_status?: string | null
        }
        Update: {
          action_type?: string | null
          agent_id?: string
          customer_id?: string
          decided_at?: string
          decided_in_ms?: number | null
          decision?: string
          event_id_hash?: string | null
          id?: string
          input_hash?: string | null
          message?: string | null
          mode?: string
          policy_id?: string | null
          session_hash?: string | null
          tool_name?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "loop_overview_v"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "decisions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "decisions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      early_access_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      fortress_settings: {
        Row: {
          customer_id: string
          session_ids_retention_days: number
          updated_at: string
        }
        Insert: {
          customer_id: string
          session_ids_retention_days?: number
          updated_at?: string
        }
        Update: {
          customer_id?: string
          session_ids_retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      guardian_scan_queue: {
        Row: {
          customer_id: string
          last_processed_at: string | null
          pending_signal_count: number
          scheduled_at: string
        }
        Insert: {
          customer_id: string
          last_processed_at?: string | null
          pending_signal_count?: number
          scheduled_at: string
        }
        Update: {
          customer_id?: string
          last_processed_at?: string | null
          pending_signal_count?: number
          scheduled_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_scan_queue_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_scan_queue_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      legions: {
        Row: {
          color: string
          created_at: string
          customer_id: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      policies: {
        Row: {
          action: string
          agent_id: string | null
          created_at: string
          customer_id: string
          enabled: boolean
          id: string
          match: Json
          message: string | null
          mode: string
          name: string
          priority: number
          rationale: string | null
          rule_id: string
          signature: string | null
          signed_at: string | null
          signing_key_id: string | null
          suggested_by_guardian: boolean
          suggestion_id: string | null
          surface_ref: string | null
          surface_type: string | null
          updated_at: string
        }
        Insert: {
          action: string
          agent_id?: string | null
          created_at?: string
          customer_id: string
          enabled?: boolean
          id?: string
          match: Json
          message?: string | null
          mode?: string
          name: string
          priority?: number
          rationale?: string | null
          rule_id: string
          signature?: string | null
          signed_at?: string | null
          signing_key_id?: string | null
          suggested_by_guardian?: boolean
          suggestion_id?: string | null
          surface_ref?: string | null
          surface_type?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          agent_id?: string | null
          created_at?: string
          customer_id?: string
          enabled?: boolean
          id?: string
          match?: Json
          message?: string | null
          mode?: string
          name?: string
          priority?: number
          rationale?: string | null
          rule_id?: string
          signature?: string | null
          signed_at?: string | null
          signing_key_id?: string | null
          suggested_by_guardian?: boolean
          suggestion_id?: string | null
          surface_ref?: string | null
          surface_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "loop_overview_v"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "policies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "policies_signing_key_id_fkey"
            columns: ["signing_key_id"]
            isOneToOne: false
            referencedRelation: "signing_keys"
            referencedColumns: ["kid"]
          },
          {
            foreignKeyName: "policies_signing_key_id_fkey"
            columns: ["signing_key_id"]
            isOneToOne: false
            referencedRelation: "signing_keys_public"
            referencedColumns: ["kid"]
          },
        ]
      }
      session_id_audit_log: {
        Row: {
          action: string
          created_at: string
          customer_id: string
          id: string
          session_id: string
          signal_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          customer_id: string
          id?: string
          session_id: string
          signal_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          customer_id?: string
          id?: string
          session_id?: string
          signal_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_id_audit_log_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      shield_templates: {
        Row: {
          archetype: string
          baseline_policies: Json | null
          id: string
          threat_profile: Json | null
          updated_at: string
          version: string | null
        }
        Insert: {
          archetype: string
          baseline_policies?: Json | null
          id?: string
          threat_profile?: Json | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          archetype?: string
          baseline_policies?: Json | null
          id?: string
          threat_profile?: Json | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      signals: {
        Row: {
          agent_id: string
          customer_id: string
          id: string
          ingested_at: string
          payload: Json
          session_ids: string[] | null
          window_end: string
          window_start: string
        }
        Insert: {
          agent_id: string
          customer_id: string
          id?: string
          ingested_at?: string
          payload: Json
          session_ids?: string[] | null
          window_end: string
          window_start: string
        }
        Update: {
          agent_id?: string
          customer_id?: string
          id?: string
          ingested_at?: string
          payload?: Json
          session_ids?: string[] | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "loop_overview_v"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "signals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      signing_keys: {
        Row: {
          created_at: string
          kid: string
          private_key_ref: string
          pubkey: string
          revoked_at: string | null
          signed_by_root: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          kid: string
          private_key_ref: string
          pubkey: string
          revoked_at?: string | null
          signed_by_root: string
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string
          kid?: string
          private_key_ref?: string
          pubkey?: string
          revoked_at?: string | null
          signed_by_root?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          agent_id: string
          applied_policy_id: string | null
          confidence: number | null
          customer_id: string
          generated_at: string
          generated_by: string | null
          id: string
          objective: string | null
          proposed_action: string
          proposed_match: Json
          proposed_message: string | null
          proposed_policy: Json | null
          rationale: string
          resolved_at: string | null
          resolved_by: string | null
          risk_category: string | null
          risk_score: number | null
          status: string
          surface_ref: string | null
          surface_type: string | null
          title: string
        }
        Insert: {
          agent_id: string
          applied_policy_id?: string | null
          confidence?: number | null
          customer_id: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          objective?: string | null
          proposed_action: string
          proposed_match: Json
          proposed_message?: string | null
          proposed_policy?: Json | null
          rationale: string
          resolved_at?: string | null
          resolved_by?: string | null
          risk_category?: string | null
          risk_score?: number | null
          status?: string
          surface_ref?: string | null
          surface_type?: string | null
          title: string
        }
        Update: {
          agent_id?: string
          applied_policy_id?: string | null
          confidence?: number | null
          customer_id?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          objective?: string | null
          proposed_action?: string
          proposed_match?: Json
          proposed_message?: string | null
          proposed_policy?: Json | null
          rationale?: string
          resolved_at?: string | null
          resolved_by?: string | null
          risk_category?: string | null
          risk_score?: number | null
          status?: string
          surface_ref?: string | null
          surface_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "loop_overview_v"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "suggestions_applied_policy_id_fkey"
            columns: ["applied_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "suggestions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_today_v: {
        Row: {
          actions_24h: number | null
          agents_active: number | null
          blocked_24h: number | null
          customer_id: string | null
          suggestions_pending: number | null
          tokens_24h: number | null
        }
        Relationships: []
      }
      loop_overview_v: {
        Row: {
          agent_id: string | null
          customer_id: string | null
          decisions_7d: number | null
          display_name: string | null
          enforcements_7d: number | null
          signals_7d: number | null
          suggestions_7d: number | null
          suggestions_accepted_7d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_today_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      signing_keys_public: {
        Row: {
          kid: string | null
          pubkey: string | null
          revoked_at: string | null
          signed_by_root: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          kid?: string | null
          pubkey?: string | null
          revoked_at?: string | null
          signed_by_root?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          kid?: string | null
          pubkey?: string | null
          revoked_at?: string | null
          signed_by_root?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_session_id_access: {
        Args: { p_action: string; p_session_id: string; p_signal_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      plan_agent_limit: { Args: { plan: string }; Returns: number }
      plan_api_key_limit: { Args: { plan: string }; Returns: number }
      plan_policy_limit: { Args: { plan: string }; Returns: number }
      plan_retention_days: { Args: { plan: string }; Returns: number }
      purge_old_data: { Args: never; Returns: undefined }
      purge_old_session_ids: { Args: never; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reveal_session_ids: { Args: { p_signal_id: string }; Returns: string[] }
    }
    Enums: {
      app_role: "viewer" | "incident_analyst" | "security_admin" | "operator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["viewer", "incident_analyst", "security_admin", "operator"],
    },
  },
} as const
