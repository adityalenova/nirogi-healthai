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
      breathing_sessions: {
        Row: {
          cycles: number | null
          duration_sec: number
          id: string
          logged_at: string
          member_id: string | null
          technique: string
          user_id: string
        }
        Insert: {
          cycles?: number | null
          duration_sec: number
          id?: string
          logged_at?: string
          member_id?: string | null
          technique: string
          user_id: string
        }
        Update: {
          cycles?: number | null
          duration_sec?: number
          id?: string
          logged_at?: string
          member_id?: string | null
          technique?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breathing_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          meta: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          meta?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      diet_compliance: {
        Row: {
          created_at: string
          eaten: boolean
          id: string
          meal_date: string
          meal_slot: string
          member_id: string | null
          plan_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          eaten?: boolean
          id?: string
          meal_date: string
          meal_slot: string
          member_id?: string | null
          plan_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          eaten?: boolean
          id?: string
          meal_date?: string
          meal_slot?: string
          member_id?: string | null
          plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_compliance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_compliance_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          active: boolean
          created_at: string
          id: string
          member_id: string | null
          plan: Json | null
          preferences: Json | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          member_id?: string | null
          plan?: Json | null
          preferences?: Json | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          member_id?: string | null
          plan?: Json | null
          preferences?: Json | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_chats: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "doctor_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          activity: string
          calories: number | null
          category: string | null
          created_at: string
          distance_km: number | null
          duration_min: number
          id: string
          intensity: string | null
          logged_at: string
          member_id: string | null
          notes: string | null
          steps: number | null
          user_id: string
        }
        Insert: {
          activity: string
          calories?: number | null
          category?: string | null
          created_at?: string
          distance_km?: number | null
          duration_min: number
          id?: string
          intensity?: string | null
          logged_at?: string
          member_id?: string | null
          notes?: string | null
          steps?: number | null
          user_id: string
        }
        Update: {
          activity?: string
          calories?: number | null
          category?: string | null
          created_at?: string
          distance_km?: number | null
          duration_min?: number
          id?: string
          intensity?: string | null
          logged_at?: string
          member_id?: string | null
          notes?: string | null
          steps?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sessions: {
        Row: {
          activity_type: string
          calories_burned: number | null
          created_at: string
          distance_km: number | null
          duration_seconds: number
          ended_at: string
          id: string
          member_id: string | null
          started_at: string
          steps: number | null
          user_id: string
        }
        Insert: {
          activity_type: string
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          duration_seconds?: number
          ended_at?: string
          id?: string
          member_id?: string | null
          started_at?: string
          steps?: number | null
          user_id: string
        }
        Update: {
          activity_type?: string
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          duration_seconds?: number
          ended_at?: string
          id?: string
          member_id?: string | null
          started_at?: string
          steps?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          id: string
          label: string | null
          member_id: string | null
          owner_id: string
          relation: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          id?: string
          label?: string | null
          member_id?: string | null
          owner_id: string
          relation?: string | null
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          id?: string
          label?: string | null
          member_id?: string | null
          owner_id?: string
          relation?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          age: number | null
          allergies: string | null
          blood_group: string | null
          bmi: number | null
          created_at: string
          current_medicines: string | null
          emergency_contact: string | null
          family_history: string | null
          full_name: string
          gender: string | null
          health_conditions: string | null
          height_cm: number | null
          id: string
          invite_status: string | null
          member_user_id: string | null
          owner_id: string
          recent_surgeries: string | null
          relation: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          bmi?: number | null
          created_at?: string
          current_medicines?: string | null
          emergency_contact?: string | null
          family_history?: string | null
          full_name: string
          gender?: string | null
          health_conditions?: string | null
          height_cm?: number | null
          id?: string
          invite_status?: string | null
          member_user_id?: string | null
          owner_id: string
          recent_surgeries?: string | null
          relation?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string | null
          blood_group?: string | null
          bmi?: number | null
          created_at?: string
          current_medicines?: string | null
          emergency_contact?: string | null
          family_history?: string | null
          full_name?: string
          gender?: string | null
          health_conditions?: string | null
          height_cm?: number | null
          id?: string
          invite_status?: string | null
          member_user_id?: string | null
          owner_id?: string
          recent_surgeries?: string | null
          relation?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      food_diary: {
        Row: {
          analysis: Json | null
          calories: number | null
          created_at: string
          dish_name: string
          fibre_g: number | null
          id: string
          member_id: string | null
          protein_g: number | null
          saturated_fat_g: number | null
          sodium_mg: number | null
          sugar_g: number | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          calories?: number | null
          created_at?: string
          dish_name: string
          fibre_g?: number | null
          id?: string
          member_id?: string | null
          protein_g?: number | null
          saturated_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          calories?: number | null
          created_at?: string
          dish_name?: string
          fibre_g?: number | null
          id?: string
          member_id?: string | null
          protein_g?: number | null
          saturated_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_diary_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      health_goals: {
        Row: {
          ai_plan: Json | null
          created_at: string
          current_height_cm: number | null
          current_weight_kg: number | null
          daily_calorie_target: number | null
          goal_type: string
          id: string
          member_id: string | null
          protein_target_g: number | null
          start_weight_kg: number | null
          status: string
          target_height_cm: number | null
          target_weight_kg: number | null
          timeline_months: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_plan?: Json | null
          created_at?: string
          current_height_cm?: number | null
          current_weight_kg?: number | null
          daily_calorie_target?: number | null
          goal_type: string
          id?: string
          member_id?: string | null
          protein_target_g?: number | null
          start_weight_kg?: number | null
          status?: string
          target_height_cm?: number | null
          target_weight_kg?: number | null
          timeline_months?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_plan?: Json | null
          created_at?: string
          current_height_cm?: number | null
          current_weight_kg?: number | null
          daily_calorie_target?: number | null
          goal_type?: string
          id?: string
          member_id?: string | null
          protein_target_g?: number | null
          start_weight_kg?: number | null
          status?: string
          target_height_cm?: number | null
          target_weight_kg?: number | null
          timeline_months?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_goals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      health_score_history: {
        Row: {
          breakdown: Json | null
          created_at: string
          id: string
          member_id: string | null
          score: number
          user_id: string
        }
        Insert: {
          breakdown?: Json | null
          created_at?: string
          id?: string
          member_id?: string | null
          score: number
          user_id: string
        }
        Update: {
          breakdown?: Json | null
          created_at?: string
          id?: string
          member_id?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_score_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      heart_rate_logs: {
        Row: {
          ai_note: string | null
          bpm: number
          context: string | null
          id: string
          logged_at: string
          member_id: string | null
          user_id: string
        }
        Insert: {
          ai_note?: string | null
          bpm: number
          context?: string | null
          id?: string
          logged_at?: string
          member_id?: string | null
          user_id: string
        }
        Update: {
          ai_note?: string | null
          bpm?: number
          context?: string | null
          id?: string
          logged_at?: string
          member_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "heart_rate_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_logs: {
        Row: {
          created_at: string
          due_at: string
          id: string
          marked_at: string
          reminder_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_at: string
          id?: string
          marked_at?: string
          reminder_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_at?: string
          id?: string
          marked_at?: string
          reminder_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "medicine_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_reminders: {
        Row: {
          active: boolean
          created_at: string
          doctor: string | null
          dose: string | null
          duration: string | null
          id: string
          medicine_name: string
          member_id: string | null
          special_instructions: string | null
          tablets_remaining: number | null
          timings: string[]
          updated_at: string
          user_id: string
          with_food: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          doctor?: string | null
          dose?: string | null
          duration?: string | null
          id?: string
          medicine_name: string
          member_id?: string | null
          special_instructions?: string | null
          tablets_remaining?: number | null
          timings?: string[]
          updated_at?: string
          user_id: string
          with_food?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          doctor?: string | null
          dose?: string | null
          duration?: string | null
          id?: string
          medicine_name?: string
          member_id?: string | null
          special_instructions?: string | null
          tablets_remaining?: number | null
          timings?: string[]
          updated_at?: string
          user_id?: string
          with_food?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_reminders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string | null
          avatar_url: string | null
          blood_group: string | null
          bmi: number | null
          created_at: string
          current_medicines: string | null
          email: string | null
          emergency_contact: string | null
          family_history: string | null
          full_name: string | null
          gender: string | null
          health_conditions: string | null
          height_cm: number | null
          id: string
          preferred_language: string
          prescription_analysis: string | null
          recent_surgeries: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          bmi?: number | null
          created_at?: string
          current_medicines?: string | null
          email?: string | null
          emergency_contact?: string | null
          family_history?: string | null
          full_name?: string | null
          gender?: string | null
          health_conditions?: string | null
          height_cm?: number | null
          id: string
          preferred_language?: string
          prescription_analysis?: string | null
          recent_surgeries?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          bmi?: number | null
          created_at?: string
          current_medicines?: string | null
          email?: string | null
          emergency_contact?: string | null
          family_history?: string | null
          full_name?: string | null
          gender?: string | null
          health_conditions?: string | null
          height_cm?: number | null
          id?: string
          preferred_language?: string
          prescription_analysis?: string | null
          recent_surgeries?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          created_at: string
          id: string
          member_id: string | null
          result: Json | null
          summary: string | null
          title: string | null
          tool: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id?: string | null
          result?: Json | null
          summary?: string | null
          title?: string | null
          tool: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string | null
          result?: Json | null
          summary?: string | null
          title?: string | null
          tool?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          ai_analysis: Json | null
          bedtime: string | null
          created_at: string
          duration_min: number | null
          id: string
          logged_at: string
          member_id: string | null
          notes: string | null
          quality_score: number | null
          user_id: string
          wake_time: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          bedtime?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          logged_at?: string
          member_id?: string | null
          notes?: string | null
          quality_score?: number | null
          user_id: string
          wake_time?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          bedtime?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          logged_at?: string
          member_id?: string | null
          notes?: string | null
          quality_score?: number | null
          user_id?: string
          wake_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sleep_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      updates: {
        Row: {
          body: string
          category: string | null
          id: string
          published_at: string
          title: string
        }
        Insert: {
          body: string
          category?: string | null
          id?: string
          published_at?: string
          title: string
        }
        Update: {
          body?: string
          category?: string | null
          id?: string
          published_at?: string
          title?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          last_refresh_date: string | null
          last_streak_date: string | null
          lifetime_earned: number
          lifetime_spent: number
          referral_code: string | null
          referred_by: string | null
          signup_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          last_refresh_date?: string | null
          last_streak_date?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
          referral_code?: string | null
          referred_by?: string | null
          signup_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          last_refresh_date?: string | null
          last_streak_date?: string | null
          lifetime_earned?: number
          lifetime_spent?: number
          referral_code?: string | null
          referred_by?: string | null
          signup_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string | null
          connected_at: string
          id: string
          provider: string
          refresh_token: string | null
          token_expiry: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          id?: string
          provider: string
          refresh_token?: string | null
          token_expiry?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          token_expiry?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          logged_at: string
          member_id: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          logged_at?: string
          member_id?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          logged_at?: string
          member_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          bmi: number | null
          created_at: string
          id: string
          logged_at: string
          member_id: string | null
          note: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          bmi?: number | null
          created_at?: string
          id?: string
          logged_at?: string
          member_id?: string | null
          note?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          bmi?: number | null
          created_at?: string
          id?: string
          logged_at?: string
          member_id?: string | null
          note?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_settings: {
        Row: {
          created_at: string
          exercise_goal_min: number
          id: string
          member_id: string | null
          sleep_goal_min: number
          target_bedtime: string | null
          target_wake_time: string | null
          updated_at: string
          user_id: string
          water_goal_ml: number
          water_reminder_min: number
        }
        Insert: {
          created_at?: string
          exercise_goal_min?: number
          id?: string
          member_id?: string | null
          sleep_goal_min?: number
          target_bedtime?: string | null
          target_wake_time?: string | null
          updated_at?: string
          user_id: string
          water_goal_ml?: number
          water_reminder_min?: number
        }
        Update: {
          created_at?: string
          exercise_goal_min?: number
          id?: string
          member_id?: string | null
          sleep_goal_min?: number
          target_bedtime?: string | null
          target_wake_time?: string | null
          updated_at?: string
          user_id?: string
          water_goal_ml?: number
          water_reminder_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "wellness_settings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
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
