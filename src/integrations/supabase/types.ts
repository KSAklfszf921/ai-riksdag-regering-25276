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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      regeringskansliet_api_log: {
        Row: {
          antal_poster: number | null
          created_at: string
          endpoint: string
          felmeddelande: string | null
          id: string
          status: string
        }
        Insert: {
          antal_poster?: number | null
          created_at?: string
          endpoint: string
          felmeddelande?: string | null
          id?: string
          status: string
        }
        Update: {
          antal_poster?: number | null
          created_at?: string
          endpoint?: string
          felmeddelande?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      regeringskansliet_dokument: {
        Row: {
          avsandare: string | null
          beteckningsnummer: string | null
          bilagor: Json | null
          created_at: string
          document_id: string
          id: string
          innehall: string | null
          kategorier: string[] | null
          markdown_url: string | null
          publicerad_datum: string | null
          titel: string | null
          typ: string | null
          updated_at: string
          uppdaterad_datum: string | null
          url: string | null
        }
        Insert: {
          avsandare?: string | null
          beteckningsnummer?: string | null
          bilagor?: Json | null
          created_at?: string
          document_id: string
          id?: string
          innehall?: string | null
          kategorier?: string[] | null
          markdown_url?: string | null
          publicerad_datum?: string | null
          titel?: string | null
          typ?: string | null
          updated_at?: string
          uppdaterad_datum?: string | null
          url?: string | null
        }
        Update: {
          avsandare?: string | null
          beteckningsnummer?: string | null
          bilagor?: Json | null
          created_at?: string
          document_id?: string
          id?: string
          innehall?: string | null
          kategorier?: string[] | null
          markdown_url?: string | null
          publicerad_datum?: string | null
          titel?: string | null
          typ?: string | null
          updated_at?: string
          uppdaterad_datum?: string | null
          url?: string | null
        }
        Relationships: []
      }
      regeringskansliet_kategorier: {
        Row: {
          beskrivning: string | null
          created_at: string
          id: string
          kod: string
          namn: string | null
          updated_at: string
        }
        Insert: {
          beskrivning?: string | null
          created_at?: string
          id?: string
          kod: string
          namn?: string | null
          updated_at?: string
        }
        Update: {
          beskrivning?: string | null
          created_at?: string
          id?: string
          kod?: string
          namn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regeringskansliet_pressmeddelanden: {
        Row: {
          created_at: string
          departement: string | null
          document_id: string
          id: string
          innehall: string | null
          publicerad_datum: string | null
          titel: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          departement?: string | null
          document_id: string
          id?: string
          innehall?: string | null
          publicerad_datum?: string | null
          titel?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          departement?: string | null
          document_id?: string
          id?: string
          innehall?: string | null
          publicerad_datum?: string | null
          titel?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      regeringskansliet_propositioner: {
        Row: {
          beteckningsnummer: string | null
          created_at: string
          departement: string | null
          document_id: string
          id: string
          pdf_url: string | null
          publicerad_datum: string | null
          titel: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          beteckningsnummer?: string | null
          created_at?: string
          departement?: string | null
          document_id: string
          id?: string
          pdf_url?: string | null
          publicerad_datum?: string | null
          titel?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          beteckningsnummer?: string | null
          created_at?: string
          departement?: string | null
          document_id?: string
          id?: string
          pdf_url?: string | null
          publicerad_datum?: string | null
          titel?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      riksdagen_anforanden: {
        Row: {
          anfdatum: string | null
          anforande_id: string
          anftext: string | null
          avsnittsrubrik: string | null
          created_at: string
          debattnamn: string | null
          debattsekund: number | null
          dok_id: string | null
          id: string
          intressent_id: string | null
          parti: string | null
          talare: string | null
          updated_at: string
        }
        Insert: {
          anfdatum?: string | null
          anforande_id: string
          anftext?: string | null
          avsnittsrubrik?: string | null
          created_at?: string
          debattnamn?: string | null
          debattsekund?: number | null
          dok_id?: string | null
          id?: string
          intressent_id?: string | null
          parti?: string | null
          talare?: string | null
          updated_at?: string
        }
        Update: {
          anfdatum?: string | null
          anforande_id?: string
          anftext?: string | null
          avsnittsrubrik?: string | null
          created_at?: string
          debattnamn?: string | null
          debattsekund?: number | null
          dok_id?: string | null
          id?: string
          intressent_id?: string | null
          parti?: string | null
          talare?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      riksdagen_api_log: {
        Row: {
          antal_poster: number | null
          created_at: string
          endpoint: string
          felmeddelande: string | null
          id: string
          status: string
        }
        Insert: {
          antal_poster?: number | null
          created_at?: string
          endpoint: string
          felmeddelande?: string | null
          id?: string
          status: string
        }
        Update: {
          antal_poster?: number | null
          created_at?: string
          endpoint?: string
          felmeddelande?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      riksdagen_dokument: {
        Row: {
          beteckning: string | null
          created_at: string
          datum: string | null
          dok_id: string
          doktyp: string | null
          dokument_url_html: string | null
          dokument_url_text: string | null
          id: string
          nummer: string | null
          organ: string | null
          rm: string | null
          status: string | null
          subtitel: string | null
          subtyp: string | null
          systemdatum: string | null
          titel: string | null
          typ: string | null
          updated_at: string
        }
        Insert: {
          beteckning?: string | null
          created_at?: string
          datum?: string | null
          dok_id: string
          doktyp?: string | null
          dokument_url_html?: string | null
          dokument_url_text?: string | null
          id?: string
          nummer?: string | null
          organ?: string | null
          rm?: string | null
          status?: string | null
          subtitel?: string | null
          subtyp?: string | null
          systemdatum?: string | null
          titel?: string | null
          typ?: string | null
          updated_at?: string
        }
        Update: {
          beteckning?: string | null
          created_at?: string
          datum?: string | null
          dok_id?: string
          doktyp?: string | null
          dokument_url_html?: string | null
          dokument_url_text?: string | null
          id?: string
          nummer?: string | null
          organ?: string | null
          rm?: string | null
          status?: string | null
          subtitel?: string | null
          subtyp?: string | null
          systemdatum?: string | null
          titel?: string | null
          typ?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      riksdagen_ledamoter: {
        Row: {
          bild_url: string | null
          created_at: string
          efternamn: string | null
          fornamn: string | null
          id: string
          intressent_id: string
          parti: string | null
          status: string | null
          tilltalsnamn: string | null
          updated_at: string
          valkrets: string | null
        }
        Insert: {
          bild_url?: string | null
          created_at?: string
          efternamn?: string | null
          fornamn?: string | null
          id?: string
          intressent_id: string
          parti?: string | null
          status?: string | null
          tilltalsnamn?: string | null
          updated_at?: string
          valkrets?: string | null
        }
        Update: {
          bild_url?: string | null
          created_at?: string
          efternamn?: string | null
          fornamn?: string | null
          id?: string
          intressent_id?: string
          parti?: string | null
          status?: string | null
          tilltalsnamn?: string | null
          updated_at?: string
          valkrets?: string | null
        }
        Relationships: []
      }
      riksdagen_utskott: {
        Row: {
          beskrivning: string | null
          created_at: string
          id: string
          namn: string | null
          updated_at: string
          utskott_kod: string
        }
        Insert: {
          beskrivning?: string | null
          created_at?: string
          id?: string
          namn?: string | null
          updated_at?: string
          utskott_kod: string
        }
        Update: {
          beskrivning?: string | null
          created_at?: string
          id?: string
          namn?: string | null
          updated_at?: string
          utskott_kod?: string
        }
        Relationships: []
      }
      riksdagen_votering_ledamoter: {
        Row: {
          created_at: string
          id: string
          intressent_id: string | null
          parti: string | null
          rost: string | null
          votering_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intressent_id?: string | null
          parti?: string | null
          rost?: string | null
          votering_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intressent_id?: string | null
          parti?: string | null
          rost?: string | null
          votering_id?: string
        }
        Relationships: []
      }
      riksdagen_voteringar: {
        Row: {
          beteckning: string | null
          created_at: string
          id: string
          punkt: number | null
          rm: string | null
          titel: string | null
          updated_at: string
          vinnare: string | null
          votering_datum: string | null
          votering_id: string
          votering_typ: string | null
        }
        Insert: {
          beteckning?: string | null
          created_at?: string
          id?: string
          punkt?: number | null
          rm?: string | null
          titel?: string | null
          updated_at?: string
          vinnare?: string | null
          votering_datum?: string | null
          votering_id: string
          votering_typ?: string | null
        }
        Update: {
          beteckning?: string | null
          created_at?: string
          id?: string
          punkt?: number | null
          rm?: string | null
          titel?: string | null
          updated_at?: string
          vinnare?: string | null
          votering_datum?: string | null
          votering_id?: string
          votering_typ?: string | null
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
