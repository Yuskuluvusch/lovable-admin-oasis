
import { Database as OriginalDatabase } from "./types";

// Extend the existing Database type with our new tables
export type Database = OriginalDatabase & {
  public: {
    Tables: {
      zones: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      territories: {
        Row: {
          id: string;
          name: string;
          google_maps_link: string | null;
          zone_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          google_maps_link?: string | null;
          zone_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          google_maps_link?: string | null;
          zone_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "territories_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "zones";
            referencedColumns: ["id"];
          }
        ];
      };
      assigned_territories: {
        Row: {
          id: string;
          territory_id: string;
          publisher_id: string;
          assigned_at: string;
          due_at: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          territory_id: string;
          publisher_id: string;
          assigned_at?: string;
          due_at?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          territory_id?: string;
          publisher_id?: string;
          assigned_at?: string;
          due_at?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assigned_territories_territory_id_fkey";
            columns: ["territory_id"];
            isOneToOne: false;
            referencedRelation: "territories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assigned_territories_publisher_id_fkey";
            columns: ["publisher_id"];
            isOneToOne: false;
            referencedRelation: "publishers";
            referencedColumns: ["id"];
          }
        ];
      };
    } & OriginalDatabase["public"]["Tables"];
    Views: OriginalDatabase["public"]["Views"];
    Functions: OriginalDatabase["public"]["Functions"];
    Enums: OriginalDatabase["public"]["Enums"];
    CompositeTypes: OriginalDatabase["public"]["CompositeTypes"];
  };
};
