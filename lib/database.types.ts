// Tipos de la base de datos de SOFANA.
// Escritos a mano espejando supabase/migrations/0001_initial_schema.sql.
// Si cambias el esquema, regenera con:
//   npx supabase gen types typescript --project-id <ref> --schema public > lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MediaType = "image" | "video";
export type SongSource = "spotify" | "youtube" | "upload";
export type EventAccent =
  | "court"
  | "ball"
  | "clay"
  | "rosa"
  | "cielo"
  | "violeta";
export type EventCategory =
  | "date"
  | "movie"
  | "call"
  | "game"
  | "poem"
  | "song"
  | "message"
  | "surprise"
  | "other";
export type DayImportance = "normal" | "special" | "grand";
export type PromiseStatus = "pending" | "kept" | "broken";
export type DateStatus = "scheduled" | "done" | "cancelled";
export type CommentTarget = "memory" | "vault_media";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      spaces: {
        Row: {
          id: string;
          name: string;
          member_a: string;
          member_b: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          member_a: string;
          member_b?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          member_a?: string;
          member_b?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          space_id: string;
          recipient_id: string;
          actor_id: string | null;
          type: string;
          title: string;
          body: string | null;
          href: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          recipient_id: string;
          actor_id?: string | null;
          type: string;
          title: string;
          body?: string | null;
          href?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          recipient_id?: string;
          actor_id?: string | null;
          type?: string;
          title?: string;
          body?: string | null;
          href?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          space_id: string;
          created_by: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          space_id: string;
          author_id: string;
          title: string;
          description: string | null;
          event_date: string | null;
          location: string | null;
          album_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          author_id: string;
          title: string;
          description?: string | null;
          event_date?: string | null;
          location?: string | null;
          album_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          author_id?: string;
          title?: string;
          description?: string | null;
          event_date?: string | null;
          location?: string | null;
          album_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memory_media: {
        Row: {
          id: string;
          memory_id: string;
          storage_path: string;
          media_type: MediaType;
          created_at: string;
        };
        Insert: {
          id?: string;
          memory_id: string;
          storage_path: string;
          media_type: MediaType;
          created_at?: string;
        };
        Update: {
          id?: string;
          memory_id?: string;
          storage_path?: string;
          media_type?: MediaType;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memory_media_memory_id_fkey";
            columns: ["memory_id"];
            isOneToOne: false;
            referencedRelation: "memories";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          space_id: string;
          author_id: string;
          body: string;
          answer: string | null;
          answered_by: string | null;
          answered_at: string | null;
          answer_edit_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          author_id: string;
          body: string;
          answer?: string | null;
          answered_by?: string | null;
          answered_at?: string | null;
          answer_edit_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          author_id?: string;
          body?: string;
          answer?: string | null;
          answered_by?: string | null;
          answered_at?: string | null;
          answer_edit_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      promises: {
        Row: {
          id: string;
          space_id: string;
          author_id: string;
          body: string;
          due_date: string | null;
          status: PromiseStatus;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          author_id: string;
          body: string;
          due_date?: string | null;
          status?: PromiseStatus;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          author_id?: string;
          body?: string;
          due_date?: string | null;
          status?: PromiseStatus;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      dates: {
        Row: {
          id: string;
          space_id: string;
          created_by: string;
          title: string;
          scheduled_at: string;
          location: string | null;
          notes: string | null;
          status: DateStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          created_by: string;
          title: string;
          scheduled_at: string;
          location?: string | null;
          notes?: string | null;
          status?: DateStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          created_by?: string;
          title?: string;
          scheduled_at?: string;
          location?: string | null;
          notes?: string | null;
          status?: DateStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          space_id: string;
          created_by: string;
          title: string;
          destination: string;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          checklist: Json;
          album_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          created_by: string;
          title: string;
          destination: string;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          checklist?: Json;
          album_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          created_by?: string;
          title?: string;
          destination?: string;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          checklist?: Json;
          album_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vault_media: {
        Row: {
          id: string;
          space_id: string;
          owner_id: string;
          storage_path: string;
          media_type: MediaType;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          owner_id: string;
          storage_path: string;
          media_type: MediaType;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          owner_id?: string;
          storage_path?: string;
          media_type?: MediaType;
          caption?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          space_id: string;
          author_id: string;
          target_type: CommentTarget;
          target_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          author_id: string;
          target_type: CommentTarget;
          target_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          author_id?: string;
          target_type?: CommentTarget;
          target_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          space_id: string;
          author_id: string;
          target_type: CommentTarget;
          target_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          author_id: string;
          target_type: CommentTarget;
          target_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          author_id?: string;
          target_type?: CommentTarget;
          target_id?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      songs: {
        Row: {
          id: string;
          space_id: string;
          added_by: string;
          title: string;
          artist: string | null;
          source: SongSource;
          embed_kind: string | null;
          external_id: string | null;
          external_url: string | null;
          storage_path: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          added_by: string;
          title: string;
          artist?: string | null;
          source: SongSource;
          embed_kind?: string | null;
          external_id?: string | null;
          external_url?: string | null;
          storage_path?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          added_by?: string;
          title?: string;
          artist?: string | null;
          source?: SongSource;
          embed_kind?: string | null;
          external_id?: string | null;
          external_url?: string | null;
          storage_path?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          space_id: string;
          created_by: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          accent: EventAccent;
          emoji: string | null;
          status: "active" | "archived";
          is_shared: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          accent?: EventAccent;
          emoji?: string | null;
          status?: "active" | "archived";
          is_shared?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          accent?: EventAccent;
          emoji?: string | null;
          status?: "active" | "archived";
          is_shared?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      event_days: {
        Row: {
          id: string;
          event_id: string;
          space_id: string;
          author_id: string;
          day_date: string;
          category: EventCategory;
          title: string;
          content: string | null;
          at_time: string | null;
          location: string | null;
          song_url: string | null;
          locked: boolean;
          done: boolean;
          accent: EventAccent;
          importance: DayImportance;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          space_id: string;
          author_id: string;
          day_date: string;
          category?: EventCategory;
          title: string;
          content?: string | null;
          at_time?: string | null;
          location?: string | null;
          song_url?: string | null;
          locked?: boolean;
          done?: boolean;
          accent?: EventAccent;
          importance?: DayImportance;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          space_id?: string;
          author_id?: string;
          day_date?: string;
          category?: EventCategory;
          title?: string;
          content?: string | null;
          at_time?: string | null;
          location?: string | null;
          song_url?: string | null;
          locked?: boolean;
          done?: boolean;
          accent?: EventAccent;
          importance?: DayImportance;
          details?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_days_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_space_member: {
        Args: { sid: string };
        Returns: boolean;
      };
      join_or_create_space: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          name: string;
          member_a: string;
          member_b: string | null;
          created_at: string;
        };
      };
    };
    Enums: {
      media_type: MediaType;
      promise_status: PromiseStatus;
      date_status: DateStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Space = Tables<"spaces">;
export type Album = Tables<"albums">;
export type Notification = Tables<"notifications">;
export type Memory = Tables<"memories">;
export type MemoryMedia = Tables<"memory_media">;
export type Question = Tables<"questions">;
export type PromiseRow = Tables<"promises">;
export type DateRow = Tables<"dates">;
export type Trip = Tables<"trips">;
export type VaultMedia = Tables<"vault_media">;
export type Comment = Tables<"comments">;
export type Reaction = Tables<"reactions">;
export type Song = Tables<"songs">;
export type EventRow = Tables<"events">;
export type EventDay = Tables<"event_days">;

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}
