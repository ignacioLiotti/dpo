export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      adicionales: {
        Row: {
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["adicional_estado"]
          fecha_aprobacion: string | null
          fecha_solicitud: string
          id: string
          monto_aprobado: number | null
          monto_solicitado: number
          numero: number
          obra_id: string
          observaciones: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["adicional_estado"]
          fecha_aprobacion?: string | null
          fecha_solicitud?: string
          id?: string
          monto_aprobado?: number | null
          monto_solicitado: number
          numero: number
          obra_id: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["adicional_estado"]
          fecha_aprobacion?: string | null
          fecha_solicitud?: string
          id?: string
          monto_aprobado?: number | null
          monto_solicitado?: number
          numero?: number
          obra_id?: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adicionales_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      ampliaciones_plazo: {
        Row: {
          created_at: string
          dias_aprobados: number | null
          dias_solicitados: number
          estado: Database["public"]["Enums"]["ampliacion_plazo_estado"]
          fecha_aprobacion: string | null
          fecha_solicitud: string
          id: string
          motivo: string
          numero: number
          obra_id: string
          observaciones: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dias_aprobados?: number | null
          dias_solicitados: number
          estado?: Database["public"]["Enums"]["ampliacion_plazo_estado"]
          fecha_aprobacion?: string | null
          fecha_solicitud?: string
          id?: string
          motivo: string
          numero: number
          obra_id: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dias_aprobados?: number | null
          dias_solicitados?: number
          estado?: Database["public"]["Enums"]["ampliacion_plazo_estado"]
          fecha_aprobacion?: string | null
          fecha_solicitud?: string
          id?: string
          motivo?: string
          numero?: number
          obra_id?: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ampliaciones_plazo_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_email: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_user_email: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      developer_emails: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
        }
        Relationships: []
      }
      obras: {
        Row: {
          area_id: string | null
          calle: string
          created_at: string
          departamento: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["obra_estado"] | null
          expediente: string | null
          fecha_basico: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          obra_name: string
          presupuesto: number
          presupuesto_oficial: number | null
          provincia: string
          reparticion_id: string | null
          tipo_obra_id: string | null
          ubicacion_google_maps: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          area_id?: string | null
          calle: string
          created_at?: string
          departamento: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["obra_estado"] | null
          expediente?: string | null
          fecha_basico?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          obra_name: string
          presupuesto: number
          presupuesto_oficial?: number | null
          provincia: string
          reparticion_id?: string | null
          tipo_obra_id?: string | null
          ubicacion_google_maps?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          area_id?: string | null
          calle?: string
          created_at?: string
          departamento?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["obra_estado"] | null
          expediente?: string | null
          fecha_basico?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          obra_name?: string
          presupuesto?: number
          presupuesto_oficial?: number | null
          provincia?: string
          reparticion_id?: string | null
          tipo_obra_id?: string | null
          ubicacion_google_maps?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_area"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reparticion"
            columns: ["reparticion_id"]
            isOneToOne: false
            referencedRelation: "reparticiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tipo_obra"
            columns: ["tipo_obra_id"]
            isOneToOne: false
            referencedRelation: "tipos_obra"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "role_hierarchy"
            referencedColumns: ["role"]
          },
        ]
      }
      redeterminaciones: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["redeterminacion_estado"]
          fecha_aprobacion: string | null
          fecha_solicitud: string
          id: string
          monto_aprobado: number | null
          monto_solicitado: number
          numero: number
          obra_id: string
          observaciones: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["redeterminacion_estado"]
          fecha_aprobacion?: string | null
          fecha_solicitud?: string
          id?: string
          monto_aprobado?: number | null
          monto_solicitado: number
          numero: number
          obra_id: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["redeterminacion_estado"]
          fecha_aprobacion?: string | null
          fecha_solicitud?: string
          id?: string
          monto_aprobado?: number | null
          monto_solicitado?: number
          numero?: number
          obra_id?: string
          observaciones?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redeterminaciones_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      reparticiones: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_hierarchy: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: number
          role: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level: number
          role: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          role?: string
        }
        Relationships: []
      }
      tipos_obra: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { required_role: string }
        Returns: boolean
      }
    }
    Enums: {
      adicional_estado: "SOLICITADO" | "EN_REVISION" | "APROBADO" | "RECHAZADO"
      ampliacion_plazo_estado:
        | "SOLICITADA"
        | "EN_REVISION"
        | "APROBADA"
        | "RECHAZADA"
      obra_estado:
        | "PLANIFICADA"
        | "EN_EJECUCION"
        | "FINALIZADA"
        | "SUSPENDIDA"
        | "CANCELADA"
      redeterminacion_estado:
        | "SOLICITADA"
        | "EN_REVISION"
        | "APROBADA"
        | "RECHAZADA"
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
  public: {
    Enums: {
      adicional_estado: ["SOLICITADO", "EN_REVISION", "APROBADO", "RECHAZADO"],
      ampliacion_plazo_estado: [
        "SOLICITADA",
        "EN_REVISION",
        "APROBADA",
        "RECHAZADA",
      ],
      obra_estado: [
        "PLANIFICADA",
        "EN_EJECUCION",
        "FINALIZADA",
        "SUSPENDIDA",
        "CANCELADA",
      ],
      redeterminacion_estado: [
        "SOLICITADA",
        "EN_REVISION",
        "APROBADA",
        "RECHAZADA",
      ],
    },
  },
} as const 