export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
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
      adicionales: {
        Row: {
          created_at: string
          descripcion: string | null
          expediente: string | null
          fecha_aprobacion: string | null
          id: string
          monto: number
          numero: number
          obra_id: string
          tipo_adicional_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          expediente?: string | null
          fecha_aprobacion?: string | null
          id?: string
          monto: number
          numero: number
          obra_id: string
          tipo_adicional_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          expediente?: string | null
          fecha_aprobacion?: string | null
          id?: string
          monto?: number
          numero?: number
          obra_id?: string
          tipo_adicional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adicionales_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionales_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_adicionales"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "adicionales_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_ampliaciones_plazo"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "adicionales_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionales_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_redeterminaciones"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "adicionales_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adicionales_tipo_adicional_id_fkey"
            columns: ["tipo_adicional_id"]
            isOneToOne: false
            referencedRelation: "tipos_adicional"
            referencedColumns: ["id"]
          },
        ]
      }
      ampliaciones_plazo: {
        Row: {
          created_at: string
          descripcion: string | null
          dias: number
          expediente: string | null
          fecha_aprobacion: string | null
          id: string
          numero: number
          obra_id: string
          tipo_ampliacion_plazo_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          dias: number
          expediente?: string | null
          fecha_aprobacion?: string | null
          id?: string
          numero: number
          obra_id: string
          tipo_ampliacion_plazo_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          dias?: number
          expediente?: string | null
          fecha_aprobacion?: string | null
          id?: string
          numero?: number
          obra_id?: string
          tipo_ampliacion_plazo_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ampliaciones_plazo_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ampliaciones_plazo_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_adicionales"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "ampliaciones_plazo_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_ampliaciones_plazo"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "ampliaciones_plazo_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ampliaciones_plazo_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_redeterminaciones"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "ampliaciones_plazo_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ampliaciones_plazo_tipo_ampliacion_plazo_id_fkey"
            columns: ["tipo_ampliacion_plazo_id"]
            isOneToOne: false
            referencedRelation: "tipos_ampliacion_plazo"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string
          id: number
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      obras: {
        Row: {
          area_id: number
          calle: string
          created_at: string
          departamento: string
          descripcion: string | null
          duracion: number | null
          estado: Database["public"]["Enums"]["obra_estado"]
          etapa: Database["public"]["Enums"]["obra_etapa"]
          expediente: string | null
          fecha_basico: string | null
          fecha_creacion: string
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_inicio_prevista: string | null
          id: string
          obra_name: string
          presupuesto: number
          presupuesto_oficial: number | null
          provincia: string
          reparticion_id: number
          tipo_obra_id: number
          ubicacion_google_maps: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id: number
          calle: string
          created_at?: string
          departamento: string
          descripcion?: string | null
          duracion?: number | null
          estado: Database["public"]["Enums"]["obra_estado"]
          etapa?: Database["public"]["Enums"]["obra_etapa"]
          expediente?: string | null
          fecha_basico?: string | null
          fecha_creacion?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_inicio_prevista?: string | null
          id?: string
          obra_name: string
          presupuesto: number
          presupuesto_oficial?: number | null
          provincia: string
          reparticion_id: number
          tipo_obra_id: number
          ubicacion_google_maps?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: number
          calle?: string
          created_at?: string
          departamento?: string
          descripcion?: string | null
          duracion?: number | null
          estado?: Database["public"]["Enums"]["obra_estado"]
          etapa?: Database["public"]["Enums"]["obra_etapa"]
          expediente?: string | null
          fecha_basico?: string | null
          fecha_creacion?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_inicio_prevista?: string | null
          id?: string
          obra_name?: string
          presupuesto?: number
          presupuesto_oficial?: number | null
          provincia?: string
          reparticion_id?: number
          tipo_obra_id?: number
          ubicacion_google_maps?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_reparticion_id_fkey"
            columns: ["reparticion_id"]
            isOneToOne: false
            referencedRelation: "reparticiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_tipo_obra_id_fkey"
            columns: ["tipo_obra_id"]
            isOneToOne: false
            referencedRelation: "tipos_obra"
            referencedColumns: ["id"]
          },
        ]
      }
      redeterminaciones: {
        Row: {
          created_at: string
          expediente: string | null
          fecha_basico: string
          id: string
          monto: number
          numero: number
          obra_id: string
          tipo_redeterminacion_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expediente?: string | null
          fecha_basico: string
          id?: string
          monto: number
          numero: number
          obra_id: string
          tipo_redeterminacion_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expediente?: string | null
          fecha_basico?: string
          id?: string
          monto?: number
          numero?: number
          obra_id?: string
          tipo_redeterminacion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeterminaciones_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeterminaciones_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_adicionales"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "redeterminaciones_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_ampliaciones_plazo"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "redeterminaciones_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeterminaciones_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_redeterminaciones"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "redeterminaciones_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeterminaciones_tipo_redeterminacion_id_fkey"
            columns: ["tipo_redeterminacion_id"]
            isOneToOne: false
            referencedRelation: "tipos_redeterminacion"
            referencedColumns: ["id"]
          },
        ]
      }
      reparticiones: {
        Row: {
          created_at: string
          id: number
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_adicional: {
        Row: {
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_ampliacion_plazo: {
        Row: {
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_obra: {
        Row: {
          created_at: string
          id: number
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_redeterminacion: {
        Row: {
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      obras_adicionales: {
        Row: {
          cantidad_adicionales: number | null
          monto_total_adicionales: number | null
          obra_id: string | null
          obra_nombre: string | null
        }
        Relationships: []
      }
      obras_ampliaciones_plazo: {
        Row: {
          cantidad_ampliaciones: number | null
          dias_totales_ampliacion: number | null
          obra_id: string | null
          obra_nombre: string | null
        }
        Relationships: []
      }
      obras_completas: {
        Row: {
          area_id: number | null
          area_nombre: string | null
          calle: string | null
          created_at: string | null
          departamento: string | null
          descripcion: string | null
          duracion: number | null
          estado: Database["public"]["Enums"]["obra_estado"] | null
          etapa: Database["public"]["Enums"]["obra_etapa"] | null
          expediente: string | null
          fecha_basico: string | null
          fecha_creacion: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_inicio_prevista: string | null
          id: string | null
          obra_name: string | null
          presupuesto: number | null
          presupuesto_oficial: number | null
          provincia: string | null
          reparticion_id: number | null
          reparticion_nombre: string | null
          tipo_obra_id: number | null
          tipo_obra_nombre: string | null
          ubicacion_google_maps: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_reparticion_id_fkey"
            columns: ["reparticion_id"]
            isOneToOne: false
            referencedRelation: "reparticiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_tipo_obra_id_fkey"
            columns: ["tipo_obra_id"]
            isOneToOne: false
            referencedRelation: "tipos_obra"
            referencedColumns: ["id"]
          },
        ]
      }
      obras_redeterminaciones: {
        Row: {
          cantidad_redeterminaciones: number | null
          monto_total_redeterminaciones: number | null
          obra_id: string | null
          obra_nombre: string | null
        }
        Relationships: []
      }
      obras_resumen: {
        Row: {
          area_id: number | null
          area_nombre: string | null
          calle: string | null
          cantidad_adicionales: number | null
          cantidad_ampliaciones: number | null
          cantidad_redeterminaciones: number | null
          created_at: string | null
          departamento: string | null
          descripcion: string | null
          dias_totales_ampliacion: number | null
          duracion: number | null
          estado: Database["public"]["Enums"]["obra_estado"] | null
          etapa: Database["public"]["Enums"]["obra_etapa"] | null
          expediente: string | null
          fecha_basico: string | null
          fecha_creacion: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_inicio_prevista: string | null
          id: string | null
          monto_total: number | null
          monto_total_adicionales: number | null
          monto_total_redeterminaciones: number | null
          obra_name: string | null
          presupuesto: number | null
          presupuesto_oficial: number | null
          provincia: string | null
          reparticion_id: number | null
          reparticion_nombre: string | null
          tipo_obra_id: number | null
          tipo_obra_nombre: string | null
          ubicacion_google_maps: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_reparticion_id_fkey"
            columns: ["reparticion_id"]
            isOneToOne: false
            referencedRelation: "reparticiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_tipo_obra_id_fkey"
            columns: ["tipo_obra_id"]
            isOneToOne: false
            referencedRelation: "tipos_obra"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_obra_total_amount: {
        Args: { p_obra_id: string }
        Returns: number
      }
      calculate_obra_total_extension_days: {
        Args: { p_obra_id: string }
        Returns: number
      }
      get_latest_redeterminacion: {
        Args: { p_obra_id: string }
        Returns: {
          id: string
          numero: number
          monto: number
          fecha_basico: string
          tipo_redeterminacion_id: string
          tipo_redeterminacion_nombre: string
        }[]
      }
    }
    Enums: {
      obra_estado:
        | "PLANIFICADA"
        | "EN_EJECUCION"
        | "FINALIZADA"
        | "SUSPENDIDA"
        | "CANCELADA"
      obra_etapa: "LICITACION" | "CONTRATACION" | "EJECUCION" | "FINALIZACION"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      obra_estado: [
        "PLANIFICADA",
        "EN_EJECUCION",
        "FINALIZADA",
        "SUSPENDIDA",
        "CANCELADA",
      ],
      obra_etapa: ["LICITACION", "CONTRATACION", "EJECUCION", "FINALIZACION"],
    },
  },
} as const

