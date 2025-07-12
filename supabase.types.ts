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
      areas: {
        Row: {
          id: number
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_examples: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          title: string
          description: string | null
          content: string | null
          category: string | null
          tags: string[] | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          title: string
          description?: string | null
          content?: string | null
          category?: string | null
          tags?: string[] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          title?: string
          description?: string | null
          content?: string | null
          category?: string | null
          tags?: string[] | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_examples_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_examples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      extracted_data: {
        Row: {
          id: string
          file_id: string
          folder_id: string
          extraction_config_id: string
          user_id: string
          extracted_value: string | null
          confidence_score: number | null
          is_verified: boolean | null
          verification_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          file_id: string
          folder_id: string
          extraction_config_id: string
          user_id: string
          extracted_value?: string | null
          confidence_score?: number | null
          is_verified?: boolean | null
          verification_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          folder_id?: string
          extraction_config_id?: string
          user_id?: string
          extracted_value?: string | null
          confidence_score?: number | null
          is_verified?: boolean | null
          verification_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_data_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_data_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_data_extraction_config_id_fkey"
            columns: ["extraction_config_id"]
            isOneToOne: false
            referencedRelation: "folder_extraction_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      file_analysis: {
        Row: {
          id: string
          file_id: string
          user_id: string
          ocr_text: string | null
          ai_description: string | null
          ai_category: string | null
          ai_tags: string[] | null
          confidence_score: number | null
          analysis_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          file_id: string
          user_id: string
          ocr_text?: string | null
          ai_description?: string | null
          ai_category?: string | null
          ai_tags?: string[] | null
          confidence_score?: number | null
          analysis_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          user_id?: string
          ocr_text?: string | null
          ai_description?: string | null
          ai_category?: string | null
          ai_tags?: string[] | null
          confidence_score?: number | null
          analysis_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_analysis_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      file_folder_assignments: {
        Row: {
          id: string
          file_id: string
          folder_id: string
          user_id: string
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          folder_id: string
          user_id: string
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          folder_id?: string
          user_id?: string
          sort_order?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_folder_assignments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_folder_assignments_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_folder_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      files: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          name: string
          original_name: string
          file_type: string
          file_size: number
          storage_path: string
          checksum: string | null
          is_active: boolean | null
          processing_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          name: string
          original_name: string
          file_type: string
          file_size: number
          storage_path: string
          checksum?: string | null
          is_active?: boolean | null
          processing_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          name?: string
          original_name?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          checksum?: string | null
          is_active?: boolean | null
          processing_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      folder_extraction_configs: {
        Row: {
          id: string
          folder_id: string
          user_id: string
          field_name: string
          field_label: string
          field_type: string
          extraction_pattern: string | null
          is_required: boolean | null
          default_value: string | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          folder_id: string
          user_id: string
          field_name: string
          field_label: string
          field_type: string
          extraction_pattern?: string | null
          is_required?: boolean | null
          default_value?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          folder_id?: string
          user_id?: string
          field_name?: string
          field_label?: string
          field_type?: string
          extraction_pattern?: string | null
          is_required?: boolean | null
          default_value?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_extraction_configs_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_extraction_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      folders: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      obras: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          obra_name: string
          descripcion: string | null
          provincia: string
          departamento: string
          calle: string
          area_id: number
          reparticion_id: number
          tipo_obra_id: number
          presupuesto: number
          presupuesto_oficial: number | null
          estado: Database["public"]["Enums"]["obra_estado"]
          etapa: Database["public"]["Enums"]["obra_etapa"] | null
          duracion: number | null
          fecha_inicio: string | null
          fecha_fin: string | null
          fecha_inicio_prevista: string | null
          fecha_basico: string | null
          fecha_creacion: string | null
          expediente: string | null
          ubicacion_google_maps: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          obra_name: string
          descripcion?: string | null
          provincia: string
          departamento: string
          calle: string
          area_id: number
          reparticion_id: number
          tipo_obra_id: number
          presupuesto: number
          presupuesto_oficial?: number | null
          estado?: Database["public"]["Enums"]["obra_estado"]
          etapa?: Database["public"]["Enums"]["obra_etapa"] | null
          duracion?: number | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          fecha_inicio_prevista?: string | null
          fecha_basico?: string | null
          fecha_creacion?: string | null
          expediente?: string | null
          ubicacion_google_maps?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          obra_name?: string
          descripcion?: string | null
          provincia?: string
          departamento?: string
          calle?: string
          area_id?: number
          reparticion_id?: number
          tipo_obra_id?: number
          presupuesto?: number
          presupuesto_oficial?: number | null
          estado?: Database["public"]["Enums"]["obra_estado"]
          etapa?: Database["public"]["Enums"]["obra_etapa"] | null
          duracion?: number | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          fecha_inicio_prevista?: string | null
          fecha_basico?: string | null
          fecha_creacion?: string | null
          expediente?: string | null
          ubicacion_google_maps?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          }
        ]
      }
      organization_invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: string
          invited_by: string
          token: string
          expires_at: string
          accepted_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role?: string
          invited_by: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: string
          invited_by?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_memberships: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: string
          invited_by: string | null
          joined_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: string
          invited_by?: string | null
          joined_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          invited_by?: string | null
          joined_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          website: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          settings: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          settings?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          settings?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          role: string
          organization_id: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          role?: string
          organization_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          role?: string
          organization_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      reparticiones: {
        Row: {
          id: number
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_obra: {
        Row: {
          id: number
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_new_organization: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      obra_estado: "PLANIFICADA" | "EN_EJECUCION" | "FINALIZADA" | "SUSPENDIDA" | "CANCELADA"
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

// Helper types for easier usage
export type Organization = Tables<"organizations">
export type Profile = Tables<"profiles">
export type OrganizationMembership = Tables<"organization_memberships">
export type OrganizationInvitation = Tables<"organization_invitations">
export type DocumentExample = Tables<"document_examples">
export type Obra = Tables<"obras">
export type File = Tables<"files">
export type Folder = Tables<"folders">
export type FileFolderAssignment = Tables<"file_folder_assignments">
export type FileAnalysis = Tables<"file_analysis">
export type FolderExtractionConfig = Tables<"folder_extraction_configs">
export type ExtractedData = Tables<"extracted_data">
export type Area = Tables<"areas">
export type Reparticion = Tables<"reparticiones">
export type TipoObra = Tables<"tipos_obra">

export const Constants = {
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