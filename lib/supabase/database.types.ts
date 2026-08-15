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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      event_types: {
        Row: {
          color: Database["public"]["Enums"]["event_color"]
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
          weather_sensitive: boolean
        }
        Insert: {
          color: Database["public"]["Enums"]["event_color"]
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
          weather_sensitive?: boolean
        }
        Update: {
          color?: Database["public"]["Enums"]["event_color"]
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          weather_sensitive?: boolean
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_at: string
          event_type_id: string | null
          google_event_id: string | null
          id: string
          reminders: number[]
          reminders_sent: number[]
          start_at: string
          synced_from_google: boolean
          title: string
          updated_at: string
          user_id: string
          weather_alert_sent: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at: string
          event_type_id?: string | null
          google_event_id?: string | null
          id?: string
          reminders?: number[]
          reminders_sent?: number[]
          start_at: string
          synced_from_google?: boolean
          title: string
          updated_at?: string
          user_id: string
          weather_alert_sent?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string
          event_type_id?: string | null
          google_event_id?: string | null
          id?: string
          reminders?: number[]
          reminders_sent?: number[]
          start_at?: string
          synced_from_google?: boolean
          title?: string
          updated_at?: string
          user_id?: string
          weather_alert_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_event_map: {
        Row: {
          created_at: string
          event_id: string
          google_calendar_id: string
          google_event_id: string
          id: string
          last_synced_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          google_calendar_id?: string
          google_event_id: string
          id?: string
          last_synced_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          google_calendar_id?: string
          google_event_id?: string
          id?: string
          last_synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_event_map_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          connected_at: string
          expires_at: string
          google_email: string | null
          refresh_token: string
          scope: string | null
          sync_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          expires_at: string
          google_email?: string | null
          refresh_token: string
          scope?: string | null
          sync_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          expires_at?: string
          google_email?: string | null
          refresh_token?: string
          scope?: string | null
          sync_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          created_at: string
          origin: string | null
          return_to: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          origin?: string | null
          return_to?: string
          state?: string
          user_id: string
        }
        Update: {
          created_at?: string
          origin?: string | null
          return_to?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          profile_completed: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          profile_completed?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          profile_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          default_reminders: number[]
          google_calendar_connected: boolean
          google_email: string | null
          onboarding_completed: boolean
          onboarding_step: number
          theme: Database["public"]["Enums"]["theme_preference"]
          updated_at: string
          user_id: string
          weather_city: string | null
          weather_lat: number | null
          weather_lon: number | null
          weekly_recap_enabled: boolean
        }
        Insert: {
          default_reminders?: number[]
          google_calendar_connected?: boolean
          google_email?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          theme?: Database["public"]["Enums"]["theme_preference"]
          updated_at?: string
          user_id: string
          weather_city?: string | null
          weather_lat?: number | null
          weather_lon?: number | null
          weekly_recap_enabled?: boolean
        }
        Update: {
          default_reminders?: number[]
          google_calendar_connected?: boolean
          google_email?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          theme?: Database["public"]["Enums"]["theme_preference"]
          updated_at?: string
          user_id?: string
          weather_city?: string | null
          weather_lat?: number | null
          weather_lon?: number | null
          weekly_recap_enabled?: boolean
        }
        Relationships: []
      }
      weekly_recap_log: {
        Row: {
          sent_at: string
          week_start: string
        }
        Insert: {
          sent_at?: string
          week_start: string
        }
        Update: {
          sent_at?: string
          week_start?: string
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
      event_color: "blue" | "coral" | "green" | "amber" | "purple"
      theme_preference: "light" | "dark" | "auto"
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
      event_color: ["blue", "coral", "green", "amber", "purple"],
      theme_preference: ["light", "dark", "auto"],
    },
  },
} as const
