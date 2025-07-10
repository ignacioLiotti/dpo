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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "adicionales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "ampliaciones_plazo_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      developer_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_extracted_data: {
        Row: {
          created_at: string
          document_id: string
          extracted_data: Json
          extraction_confidence: number | null
          extraction_metadata: Json | null
          field_count: number | null
          folder_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          extracted_data?: Json
          extraction_confidence?: number | null
          extraction_metadata?: Json | null
          field_count?: number | null
          folder_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          extracted_data?: Json
          extraction_confidence?: number | null
          extraction_metadata?: Json | null
          field_count?: number | null
          folder_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extracted_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents_with_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extracted_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "obra_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extracted_data_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "documents_with_folders"
            referencedColumns: ["folder_id"]
          },
          {
            foreignKeyName: "document_extracted_data_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folder_extraction_overview"
            referencedColumns: ["folder_id"]
          },
          {
            foreignKeyName: "document_extracted_data_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folder_items: {
        Row: {
          created_at: string
          document_id: string
          folder_id: string
          id: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          folder_id: string
          id?: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          folder_id?: string
          id?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folder_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string
          created_at: string
          default_metadata: Json | null
          description: string | null
          fields: Json
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          updated_at: string
          user_id: string | null
          validation_rules: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          default_metadata?: Json | null
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          updated_at?: string
          user_id?: string | null
          validation_rules?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          default_metadata?: Json | null
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          checksum: string | null
          created_at: string
          description: string | null
          folder: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          metadata: Json | null
          name: string
          ocr_content: string | null
          organization_id: string | null
          parent_id: string | null
          size: number
          storage_path: string
          tags: string[] | null
          type: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          category?: string | null
          checksum?: string | null
          created_at?: string
          description?: string | null
          folder?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          ocr_content?: string | null
          organization_id?: string | null
          parent_id?: string | null
          size: number
          storage_path: string
          tags?: string[] | null
          type: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          category?: string | null
          checksum?: string | null
          created_at?: string
          description?: string | null
          folder?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          ocr_content?: string | null
          organization_id?: string | null
          parent_id?: string | null
          size?: number
          storage_path?: string
          tags?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      file_extracted_data: {
        Row: {
          confidence_score: number | null
          created_at: string
          extracted_value: string | null
          extraction_method_used: string | null
          field_definition_id: string
          file_id: string
          id: string
          is_verified: boolean | null
          notes: string | null
          raw_extracted_text: string | null
          updated_at: string
          user_id: string
          verification_date: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          extracted_value?: string | null
          extraction_method_used?: string | null
          field_definition_id: string
          file_id: string
          id?: string
          is_verified?: boolean | null
          notes?: string | null
          raw_extracted_text?: string | null
          updated_at?: string
          user_id: string
          verification_date?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          extracted_value?: string | null
          extraction_method_used?: string | null
          field_definition_id?: string
          file_id?: string
          id?: string
          is_verified?: boolean | null
          notes?: string | null
          raw_extracted_text?: string | null
          updated_at?: string
          user_id?: string
          verification_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_extracted_data_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "folder_field_definitions_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_extracted_data_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "user_files"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_documents: {
        Row: {
          created_at: string
          document_id: string
          folder_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          folder_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          folder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents_with_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "obra_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "documents_with_folders"
            referencedColumns: ["folder_id"]
          },
          {
            foreignKeyName: "folder_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folder_extraction_overview"
            referencedColumns: ["folder_id"]
          },
          {
            foreignKeyName: "folder_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_field_definitions: {
        Row: {
          created_at: string
          default_value: string | null
          extraction_method: string
          extraction_pattern: string
          field_description: string | null
          field_label: string
          field_name: string
          field_type: string
          folder_id: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          obra_id: string
          sort_order: number | null
          updated_at: string
          user_id: string
          validation_pattern: string | null
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          extraction_method: string
          extraction_pattern: string
          field_description?: string | null
          field_label: string
          field_name: string
          field_type: string
          folder_id: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          obra_id: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
          validation_pattern?: string | null
        }
        Update: {
          created_at?: string
          default_value?: string | null
          extraction_method?: string
          extraction_pattern?: string
          field_description?: string | null
          field_label?: string
          field_name?: string
          field_type?: string
          folder_id?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          obra_id?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
          validation_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folder_field_definitions_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "documents_with_folders"
            referencedColumns: ["folder_id"]
          },
          {
            foreignKeyName: "folder_field_definitions_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folder_extraction_overview"
            referencedColumns: ["folder_id"]
          },
          {
            foreignKeyName: "folder_field_definitions_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_field_definitions_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_field_definitions_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_adicionales"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "folder_field_definitions_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_ampliaciones_plazo"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "folder_field_definitions_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_field_definitions_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_redeterminaciones"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "folder_field_definitions_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_field_definitions_new: {
        Row: {
          created_at: string
          default_value: string | null
          extraction_method: string
          extraction_pattern: string
          field_description: string | null
          field_label: string
          field_name: string
          field_type: string
          folder_id: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          sort_order: number | null
          updated_at: string
          user_id: string
          validation_pattern: string | null
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          extraction_method: string
          extraction_pattern: string
          field_description?: string | null
          field_label: string
          field_name: string
          field_type: string
          folder_id: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
          validation_pattern?: string | null
        }
        Update: {
          created_at?: string
          default_value?: string | null
          extraction_method?: string
          extraction_pattern?: string
          field_description?: string | null
          field_label?: string
          field_name?: string
          field_type?: string
          folder_id?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
          validation_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folder_field_definitions_new_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          extract_data: boolean | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          obra_id: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          extract_data?: boolean | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          obra_id: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          extract_data?: boolean | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          obra_id?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_adicionales"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "folders_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_ampliaciones_plazo"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "folders_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_redeterminaciones"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "folders_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_documents: {
        Row: {
          category: string | null
          checksum: string | null
          created_at: string
          description: string | null
          folder: string | null
          id: string
          is_public: boolean | null
          name: string
          obra_id: string
          ocr_content: string | null
          organization_id: string | null
          path: string[]
          size: number
          tags: string[] | null
          type: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          category?: string | null
          checksum?: string | null
          created_at?: string
          description?: string | null
          folder?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          obra_id: string
          ocr_content?: string | null
          organization_id?: string | null
          path: string[]
          size: number
          tags?: string[] | null
          type: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          category?: string | null
          checksum?: string | null
          created_at?: string
          description?: string | null
          folder?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          obra_id?: string
          ocr_content?: string | null
          organization_id?: string | null
          path?: string[]
          size?: number
          tags?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_adicionales"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_ampliaciones_plazo"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_redeterminaciones"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_resumen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          expediente: string | null
          fecha_basico: string | null
          fecha_creacion: string
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_inicio_prevista: string | null
          id: string
          obra_name: string
          organization_id: string | null
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
          expediente?: string | null
          fecha_basico?: string | null
          fecha_creacion?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_inicio_prevista?: string | null
          id?: string
          obra_name: string
          organization_id?: string | null
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
          expediente?: string | null
          fecha_basico?: string | null
          fecha_creacion?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_inicio_prevista?: string | null
          id?: string
          obra_name?: string
          organization_id?: string | null
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
            foreignKeyName: "obras_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          is_active: boolean
          organization_id: string
          role: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          is_active?: boolean
          organization_id: string
          role?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          is_active?: boolean
          organization_id?: string
          role?: string
          token?: string
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
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          joined_at: string | null
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string | null
          role: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "redeterminaciones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      user_files: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          is_active: boolean | null
          name: string
          ocr_content: string | null
          size: number
          storage_path: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          ocr_content?: string | null
          size: number
          storage_path: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          ocr_content?: string | null
          size?: number
          storage_path?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_folders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      documents_with_folders: {
        Row: {
          category: string | null
          checksum: string | null
          created_at: string | null
          description: string | null
          folder: string | null
          folder_color: string | null
          folder_icon: string | null
          folder_id: string | null
          folder_name: string | null
          id: string | null
          is_public: boolean | null
          name: string | null
          obra_id: string | null
          path: string[] | null
          size: number | null
          tags: string[] | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_adicionales"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_ampliaciones_plazo"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_redeterminaciones"
            referencedColumns: ["obra_id"]
          },
          {
            foreignKeyName: "obra_documents_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras_resumen"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_extraction_overview: {
        Row: {
          avg_confidence: number | null
          extract_data: boolean | null
          extracted_documents_count: number | null
          field_count: number | null
          folder_id: string | null
          folder_name: string | null
          total_documents_count: number | null
        }
        Relationships: []
      }
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
      accept_organization_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      calculate_obra_total_amount: {
        Args: { p_obra_id: string }
        Returns: number
      }
      calculate_obra_total_extension_days: {
        Args: { p_obra_id: string }
        Returns: number
      }
      create_default_folders_for_obra: {
        Args: { obra_id: string; user_id: string }
        Returns: undefined
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
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      migrate_existing_folders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_belongs_to_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      user_is_organization_admin: {
        Args: { org_id: string }
        Returns: boolean
      }
    }
    Enums: {
      obra_estado:
        | "PLANIFICADA"
        | "EN_EJECUCION"
        | "FINALIZADA"
        | "SUSPENDIDA"
        | "CANCELADA"
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
    },
  },
} as const

// Export commonly used types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

