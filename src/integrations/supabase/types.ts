export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      doubts: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          image_url: string | null
          question: string
          status: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          question: string
          status?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          question?: string
          status?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      generated_materials: {
        Row: {
          content: string
          created_at: string | null
          id: string
          material_type: string | null
          subject: string | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          material_type?: string | null
          subject?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          material_type?: string | null
          subject?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_materials_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      marks: {
        Row: {
          created_at: string | null
          exam_date: string | null
          exam_name: string
          id: string
          marks_obtained: number
          notes: string | null
          percentage: number | null
          subject: string
          total_marks: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_date?: string | null
          exam_name: string
          id?: string
          marks_obtained: number
          notes?: string | null
          percentage?: number | null
          subject: string
          total_marks: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_date?: string | null
          exam_name?: string
          id?: string
          marks_obtained?: number
          notes?: string | null
          percentage?: number | null
          subject?: string
          total_marks?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_active_at: string | null
          streak_days: number | null
          total_study_minutes: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_active_at?: string | null
          streak_days?: number | null
          total_study_minutes?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          streak_days?: number | null
          total_study_minutes?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          notes: string | null
          subject: string | null
          target_duration: number | null
          timer_mode: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string | null
          duration_minutes: number
          id?: string
          notes?: string | null
          subject?: string | null
          target_duration?: number | null
          timer_mode?: string | null
          user_id: string
          xp_earned: number
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          subject?: string | null
          target_duration?: number | null
          timer_mode?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_twin: {
        Row: {
          character_type: string
          created_at: string | null
          current_xp: number
          id: string
          level: number
          owner_user_id: string
          total_sessions: number | null
          updated_at: string | null
          xp_to_next_level: number
        }
        Insert: {
          character_type?: string
          created_at?: string | null
          current_xp?: number
          id?: string
          level?: number
          owner_user_id: string
          total_sessions?: number | null
          updated_at?: string | null
          xp_to_next_level?: number
        }
        Update: {
          character_type?: string
          created_at?: string | null
          current_xp?: number
          id?: string
          level?: number
          owner_user_id?: string
          total_sessions?: number | null
          updated_at?: string | null
          xp_to_next_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_twin_owner_user_id_fkey"
            columns: ["owner_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      achievements: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          reward_xp: number | null
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          reward_xp?: number | null
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          reward_xp?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_goals: {
        Row: {
          completed: boolean | null
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          target_minutes: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          target_minutes?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          target_minutes?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_goals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      user_weekly_stats: {
        Row: {
          date: string | null
          sessions_count: number | null
          total_minutes: number | null
          user_id: string | null
          week_start: string | null
        }
      }
      user_leaderboard: {
        Row: {
          level: number | null
          rank: number | null
          total_xp: number | null
          user_id: string | null
          username: string | null
        }
      }
      subject_analysis: {
        Row: {
          average_duration: number | null
          sessions_count: number | null
          subject: string | null
          total_minutes: number | null
          user_id: string | null
        }
      }
    }
    Functions: {
      calculate_streak: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
      get_user_stats: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_study_minutes: number
          total_sessions: number
          average_session_length: number
          favorite_subject: string
          total_xp: number
        }
      }
      level_up_study_twin: {
        Args: {
          twin_id: string
          xp_to_add: number
        }
        Returns: {
          new_level: number
          new_xp: number
          leveled_up: boolean
        }
      }
      create_daily_summary: {
        Args: {
          user_uuid: string
          summary_date: string
        }
        Returns: {
          total_minutes: number
          sessions_count: number
          xp_earned: number
        }
      }
    }
    Enums: {
      doubt_status: "pending" | "answered" | "archived"
      timer_mode: "stopwatch" | "countdown"
      material_type: "flashcard" | "summary" | "quiz" | "exercise"
      achievement_type: "level" | "streak" | "duration" | "sessions" | "subject"
      character_type: "owl" | "fox" | "panda" | "cat" | "robot" | "wizard" | "astronaut" | "dragon"
    }
    CompositeTypes: {
      level_up_result: {
        old_level: number
        new_level: number
        xp_gained: number
        reward: string
      }
      session_stats: {
        date: string
        minutes: number
        sessions: number
      }
    }
  }
}

// Type utilities
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

// Commonly used types
export type StudyTwin = Tables<"study_twin">
export type StudySession = Tables<"study_sessions">
export type Profile = Tables<"profiles">
export type Doubt = Tables<"doubts">
export type Mark = Tables<"marks">
export type GeneratedMaterial = Tables<"generated_materials">
export type Achievement = Tables<"achievements">
export type StudyGoal = Tables<"study_goals">

// View types
export type WeeklyStats = Database["public"]["Views"]["user_weekly_stats"]["Row"]
export type LeaderboardEntry = Database["public"]["Views"]["user_leaderboard"]["Row"]
export type SubjectAnalysis = Database["public"]["Views"]["subject_analysis"]["Row"]

// Function return types
export type UserStats = Database["public"]["Functions"]["get_user_stats"]["Returns"]
export type LevelUpResult = Database["public"]["CompositeTypes"]["level_up_result"]
export type SessionStats = Database["public"]["CompositeTypes"]["session_stats"]

// Type guards and utilities
export function isStudyTwin(data: any): data is StudyTwin {
  return data && typeof data === "object" && "owner_user_id" in data && "level" in data
}

export function isStudySession(data: any): data is StudySession {
  return data && typeof data === "object" && "duration_minutes" in data && "xp_earned" in data
}

export function isProfile(data: any): data is Profile {
  return data && typeof data === "object" && "id" in data
}