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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_name: string | null
          activity_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_name?: string | null
          activity_type: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_name?: string | null
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      face_scans: {
        Row: {
          confidence: number | null
          created_at: string
          description: string | null
          health_flags: string[] | null
          id: string
          mood: string
          user_id: string
          wellness_tip: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          health_flags?: string[] | null
          id?: string
          mood: string
          user_id: string
          wellness_tip?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          health_flags?: string[] | null
          id?: string
          mood?: string
          user_id?: string
          wellness_tip?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          id: string
          mood: number | null
          reflection: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood?: number | null
          reflection?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: number | null
          reflection?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          source: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          source?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          source?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      peer_posts: {
        Row: {
          alias: string
          category: string
          content: string
          created_at: string
          emoji: string
          hearts: number
          id: string
        }
        Insert: {
          alias?: string
          category?: string
          content: string
          created_at?: string
          emoji?: string
          hearts?: number
          id?: string
        }
        Update: {
          alias?: string
          category?: string
          content?: string
          created_at?: string
          emoji?: string
          hearts?: number
          id?: string
        }
        Relationships: []
      }
      peer_replies: {
        Row: {
          alias: string
          content: string
          created_at: string
          emoji: string
          hearts: number
          id: string
          post_id: string
        }
        Insert: {
          alias?: string
          content: string
          created_at?: string
          emoji?: string
          hearts?: number
          id?: string
          post_id: string
        }
        Update: {
          alias?: string
          content?: string
          created_at?: string
          emoji?: string
          hearts?: number
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "peer_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          college_stressors: string[] | null
          country: string | null
          created_at: string
          gender: string | null
          happiness_index: number | null
          health_index: number | null
          id: string
          name: string
          occupation: string | null
          updated_at: string
          user_id: string
          wellness_answers: Json | null
        }
        Insert: {
          age?: number | null
          college_stressors?: string[] | null
          country?: string | null
          created_at?: string
          gender?: string | null
          happiness_index?: number | null
          health_index?: number | null
          id?: string
          name?: string
          occupation?: string | null
          updated_at?: string
          user_id: string
          wellness_answers?: Json | null
        }
        Update: {
          age?: number | null
          college_stressors?: string[] | null
          country?: string | null
          created_at?: string
          gender?: string | null
          happiness_index?: number | null
          health_index?: number | null
          id?: string
          name?: string
          occupation?: string | null
          updated_at?: string
          user_id?: string
          wellness_answers?: Json | null
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
    Enums: {},
  },
} as const
