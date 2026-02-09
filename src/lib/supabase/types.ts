export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      asd: {
        Row: {
          id: number;
          name: string;
          active: boolean;
        };
        Insert: {
          id?: number;
          name: string;
          active?: boolean;
        };
        Update: {
          id?: number;
          name?: string;
          active?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          bbo_username: string | null;
          avatar_url: string | null;
          asd_id: number | null;
          profile_type: "giovane" | "adulto" | "senior";
          xp: number;
          streak: number;
          last_login: string | null;
          hands_played: number;
          text_size: string;
          anim_speed: string;
          sound_on: boolean;
          memory_best: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          bbo_username?: string | null;
          avatar_url?: string | null;
          asd_id?: number | null;
          profile_type?: "giovane" | "adulto" | "senior";
          xp?: number;
          streak?: number;
          last_login?: string | null;
          hands_played?: number;
          text_size?: string;
          anim_speed?: string;
          sound_on?: boolean;
          memory_best?: number | null;
        };
        Update: {
          username?: string | null;
          display_name?: string | null;
          bbo_username?: string | null;
          avatar_url?: string | null;
          asd_id?: number | null;
          profile_type?: "giovane" | "adulto" | "senior";
          xp?: number;
          streak?: number;
          last_login?: string | null;
          hands_played?: number;
          text_size?: string;
          anim_speed?: string;
          sound_on?: boolean;
          memory_best?: number | null;
        };
      };
      completed_modules: {
        Row: {
          id: number;
          user_id: string;
          lesson_id: string;
          module_id: string;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          module_id: string;
          completed_at?: string;
        };
        Update: {
          lesson_id?: string;
          module_id?: string;
          completed_at?: string;
        };
      };
      badges: {
        Row: {
          id: number;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string;
        };
      };
      review_items: {
        Row: {
          id: number;
          user_id: string;
          lesson_id: string;
          module_id: string;
          question: string | null;
          wrong_count: number;
          last_review: string | null;
          next_review: string | null;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          module_id: string;
          question?: string | null;
          wrong_count?: number;
          last_review?: string | null;
          next_review?: string | null;
        };
        Update: {
          lesson_id?: string;
          module_id?: string;
          question?: string | null;
          wrong_count?: number;
          last_review?: string | null;
          next_review?: string | null;
        };
      };
      forum_posts: {
        Row: {
          id: number;
          user_id: string;
          category: "lezioni" | "strategia" | "tornei" | "generale" | "off-topic";
          title: string;
          body: string;
          likes_count: number;
          comments_count: number;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          category: "lezioni" | "strategia" | "tornei" | "generale" | "off-topic";
          title: string;
          body: string;
          likes_count?: number;
          comments_count?: number;
          pinned?: boolean;
        };
        Update: {
          category?: "lezioni" | "strategia" | "tornei" | "generale" | "off-topic";
          title?: string;
          body?: string;
          likes_count?: number;
          comments_count?: number;
          pinned?: boolean;
        };
      };
      forum_comments: {
        Row: {
          id: number;
          post_id: number;
          user_id: string;
          body: string;
          likes_count: number;
          created_at: string;
        };
        Insert: {
          post_id: number;
          user_id: string;
          body: string;
          likes_count?: number;
        };
        Update: {
          body?: string;
          likes_count?: number;
        };
      };
      forum_likes: {
        Row: {
          id: number;
          user_id: string;
          post_id: number | null;
          comment_id: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id?: number | null;
          comment_id?: number | null;
        };
        Update: {
          post_id?: number | null;
          comment_id?: number | null;
        };
      };
    };
  };
}
