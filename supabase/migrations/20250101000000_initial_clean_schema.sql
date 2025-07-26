-- DPO Clean Database Initial Migration
-- This migration creates the complete clean database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ORGANIZATIONS (Multi-tenancy)
-- =============================================================================

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
    slug TEXT UNIQUE NOT NULL CHECK (char_length(slug) >= 2 AND char_length(slug) <= 50),
    description TEXT,
    logo_url TEXT,
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE TABLE public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

-- =============================================================================
-- USER PROFILES
-- =============================================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'developer')),
    organization_id UUID REFERENCES public.organizations(id),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- DOCUMENT EXAMPLES (Template for creating new entity types)
-- =============================================================================

CREATE TABLE public.document_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- OBRAS (Simplified, standalone)
-- =============================================================================

-- Reference tables for obras
CREATE TABLE public.areas (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.reparticiones (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.tipos_obra (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data for areas
INSERT INTO public.areas (id, name) VALUES
  (1, 'Construcciones'),
  (2, 'Proyectos'),
  (3, 'Inspecciones'),
  (4, 'Administración');

-- Seed data for reparticiones
INSERT INTO public.reparticiones (id, name) VALUES
  (1, 'Dirección de Arquitectura'),
  (2, 'Dirección de Vivienda'),
  (3, 'Dirección de Vialidad'),
  (4, 'Dirección de Hidráulica');

-- Seed data for tipos_obra
INSERT INTO public.tipos_obra (id, name) VALUES
  (1, 'Obra Nueva'),
  (2, 'Refacción'),
  (3, 'Ampliación'),
  (4, 'Restauración'),
  (5, 'Infraestructura Vial'),
  (6, 'Infraestructura Hidráulica');

-- Reset sequences to start after our seeded values
SELECT setval('areas_id_seq', 4);
SELECT setval('reparticiones_id_seq', 4);
SELECT setval('tipos_obra_id_seq', 6);

-- Main obras table
CREATE TYPE obra_estado AS ENUM ('PLANIFICADA', 'EN_EJECUCION', 'FINALIZADA', 'SUSPENDIDA', 'CANCELADA');
CREATE TYPE obra_etapa AS ENUM ('LICITACION', 'CONTRATACION', 'EJECUCION', 'FINALIZACION');

CREATE TABLE public.obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_name TEXT NOT NULL,
    descripcion TEXT,
    provincia TEXT NOT NULL,
    departamento TEXT NOT NULL,
    calle TEXT NOT NULL,
    area_id INTEGER NOT NULL REFERENCES public.areas(id),
    reparticion_id INTEGER NOT NULL REFERENCES public.reparticiones(id),
    tipo_obra_id INTEGER NOT NULL REFERENCES public.tipos_obra(id),
    presupuesto DECIMAL NOT NULL,
    presupuesto_oficial DECIMAL,
    estado obra_estado NOT NULL DEFAULT 'PLANIFICADA',
    etapa obra_etapa DEFAULT 'LICITACION',
    duracion INTEGER,
    fecha_inicio DATE,
    fecha_fin DATE,
    fecha_inicio_prevista DATE,
    fecha_basico DATE,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    expediente TEXT,
    ubicacion_google_maps TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- FILES SYSTEM (Organization-based, not obra-based)
-- =============================================================================

CREATE TABLE public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT '📁',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- MIME type
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    checksum TEXT,
    is_active BOOLEAN DEFAULT true,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.file_folder_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(file_id, folder_id)
);

-- =============================================================================
-- AI ANALYSIS & EXTRACTION
-- =============================================================================

CREATE TABLE public.file_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Store FULL OCR text to avoid re-OCR
    ocr_text TEXT,
    -- AI-generated analysis
    ai_description TEXT,
    ai_category TEXT,
    ai_tags TEXT[] DEFAULT '{}',
    confidence_score DECIMAL DEFAULT 0,
    analysis_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(file_id) -- One analysis per file
);

CREATE TABLE public.folder_extraction_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'currency', 'boolean', 'email', 'phone')),
    extraction_pattern TEXT, -- AI prompt or regex pattern
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(folder_id, field_name)
);

CREATE TABLE public.extracted_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    extraction_config_id UUID NOT NULL REFERENCES public.folder_extraction_configs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    extracted_value TEXT,
    confidence_score DECIMAL DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(file_id, extraction_config_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Organizations
CREATE INDEX organizations_slug_idx ON public.organizations(slug);
CREATE INDEX organization_memberships_organization_id_idx ON public.organization_memberships(organization_id);
CREATE INDEX organization_memberships_user_id_idx ON public.organization_memberships(user_id);
CREATE INDEX organization_invitations_organization_id_idx ON public.organization_invitations(organization_id);
CREATE INDEX organization_invitations_email_idx ON public.organization_invitations(email);
CREATE INDEX organization_invitations_token_idx ON public.organization_invitations(token);
CREATE INDEX organization_invitations_expires_at_idx ON public.organization_invitations(expires_at);

-- Profiles
CREATE INDEX profiles_organization_id_idx ON public.profiles(organization_id);

-- Document Examples
CREATE INDEX document_examples_organization_id_idx ON public.document_examples(organization_id);
CREATE INDEX document_examples_user_id_idx ON public.document_examples(user_id);

-- Example Documents table for CRUD demonstration
CREATE TABLE IF NOT EXISTS public.example_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Enable RLS for example_documents
ALTER TABLE public.example_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for example_documents
CREATE POLICY "Anyone can view example documents" ON public.example_documents
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own example documents" ON public.example_documents
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own example documents" ON public.example_documents
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own example documents" ON public.example_documents
    FOR DELETE USING (auth.uid() = author_id);

-- Indexes for example_documents
CREATE INDEX example_documents_author_id_idx ON public.example_documents(author_id);
CREATE INDEX example_documents_status_idx ON public.example_documents(status);
CREATE INDEX example_documents_category_idx ON public.example_documents(category);
CREATE INDEX example_documents_created_at_idx ON public.example_documents(created_at);

-- Obras
CREATE INDEX obras_organization_id_idx ON public.obras(organization_id);
CREATE INDEX obras_user_id_idx ON public.obras(user_id);
CREATE INDEX obras_area_id_idx ON public.obras(area_id);
CREATE INDEX obras_reparticion_id_idx ON public.obras(reparticion_id);
CREATE INDEX obras_tipo_obra_id_idx ON public.obras(tipo_obra_id);

-- Files System
CREATE INDEX folders_organization_id_idx ON public.folders(organization_id);
CREATE INDEX files_organization_id_idx ON public.files(organization_id);
CREATE INDEX files_user_id_idx ON public.files(user_id);
CREATE INDEX file_folder_assignments_file_id_idx ON public.file_folder_assignments(file_id);
CREATE INDEX file_folder_assignments_folder_id_idx ON public.file_folder_assignments(folder_id);

-- AI Analysis
CREATE INDEX file_analysis_file_id_idx ON public.file_analysis(file_id);
CREATE INDEX folder_extraction_configs_folder_id_idx ON public.folder_extraction_configs(folder_id);
CREATE INDEX extracted_data_file_id_idx ON public.extracted_data(file_id);
CREATE INDEX extracted_data_folder_id_idx ON public.extracted_data(folder_id);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_example_documents_updated_at
    BEFORE UPDATE ON public.example_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_organization_memberships_updated_at
    BEFORE UPDATE ON public.organization_memberships
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_organization_invitations_updated_at
    BEFORE UPDATE ON public.organization_invitations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_document_examples_updated_at
    BEFORE UPDATE ON public.document_examples
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON public.areas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_reparticiones_updated_at
    BEFORE UPDATE ON public.reparticiones
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tipos_obra_updated_at
    BEFORE UPDATE ON public.tipos_obra
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_obras_updated_at
    BEFORE UPDATE ON public.obras
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON public.folders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_file_analysis_updated_at
    BEFORE UPDATE ON public.file_analysis
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_folder_extraction_configs_updated_at
    BEFORE UPDATE ON public.folder_extraction_configs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_extracted_data_updated_at
    BEFORE UPDATE ON public.extracted_data
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_folder_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_extraction_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_data ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT om.organization_id INTO org_id
    FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.is_active = true
    ORDER BY om.joined_at
    LIMIT 1;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organization policies
CREATE POLICY "Users can view their organizations" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organization admins can update" ON public.organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND is_active = true
        )
    );

-- Organization membership policies
CREATE POLICY "Users can view memberships for their organizations" ON public.organization_memberships
    FOR SELECT USING (user_id = auth.uid() OR organization_id = public.get_user_organization_id());

-- Allow users to create their own memberships AND allow SECURITY DEFINER functions to bypass RLS
CREATE POLICY "Users can create their own memberships" ON public.organization_memberships
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        OR current_setting('role') = 'postgres'
        OR current_user = 'postgres'
    );

CREATE POLICY "Organization admins can manage memberships" ON public.organization_memberships
    FOR ALL USING (organization_id = public.get_user_organization_id());

-- Organization invitation policies
CREATE POLICY "Users can view invitations for their organizations" ON public.organization_invitations
    FOR SELECT USING (
        organization_id = public.get_user_organization_id()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Organization admins can manage invitations" ON public.organization_invitations
    FOR ALL USING (organization_id = public.get_user_organization_id());

-- Profile policies
CREATE POLICY "Users can view and update their own profile" ON public.profiles
    FOR ALL USING (id = auth.uid());

-- Document examples policies
CREATE POLICY "Organization members can access document examples" ON public.document_examples
    FOR ALL USING (organization_id = public.get_user_organization_id());

-- Obras policies
CREATE POLICY "Organization members can access obras" ON public.obras
    FOR ALL USING (organization_id = public.get_user_organization_id());

-- Files system policies
CREATE POLICY "Organization members can access folders" ON public.folders
    FOR ALL USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Organization members can access files" ON public.files
    FOR ALL USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Organization members can access file folder assignments" ON public.file_folder_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.files f 
            WHERE f.id = file_id 
            AND f.organization_id = public.get_user_organization_id()
        )
    );

-- AI analysis policies
CREATE POLICY "Organization members can access file analysis" ON public.file_analysis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.files f 
            WHERE f.id = file_id 
            AND f.organization_id = public.get_user_organization_id()
        )
    );

CREATE POLICY "Organization members can access folder extraction configs" ON public.folder_extraction_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.folders f 
            WHERE f.id = folder_id 
            AND f.organization_id = public.get_user_organization_id()
        )
    );

CREATE POLICY "Organization members can access extracted data" ON public.extracted_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.files f 
            WHERE f.id = file_id 
            AND f.organization_id = public.get_user_organization_id()
        )
    );

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'organization-files',
    'organization-files',
    false,
    50485760, -- 50MB limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
        'image/tiff',
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Organization members can access their files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'organization-files' AND 
        EXISTS (
            SELECT 1 FROM public.files f 
            WHERE f.storage_path = name 
            AND f.organization_id = public.get_user_organization_id()
        )
    );

CREATE POLICY "Organization members can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'organization-files' AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Organization members can update their files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'organization-files' AND 
        EXISTS (
            SELECT 1 FROM public.files f 
            WHERE f.storage_path = name 
            AND f.organization_id = public.get_user_organization_id()
        )
    );

CREATE POLICY "Organization members can delete their files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'organization-files' AND 
        EXISTS (
            SELECT 1 FROM public.files f 
            WHERE f.storage_path = name 
            AND f.organization_id = public.get_user_organization_id()
        )
    );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to handle new organization creation
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create membership if there's an authenticated user
    -- This prevents errors during seed/migration when auth.uid() is null
    IF auth.uid() IS NOT NULL THEN
        -- Temporarily disable RLS for this function to ensure membership creation succeeds
        PERFORM set_config('row_security', 'off', true);
        
        -- Create the organization membership
        INSERT INTO public.organization_memberships (organization_id, user_id, role, joined_at)
        VALUES (NEW.id, auth.uid(), 'owner', NOW());
        
        -- Re-enable RLS
        PERFORM set_config('row_security', 'on', true);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new organization
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_organization();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_organization_invitation(invitation_token UUID)
RETURNS JSONB AS $$
DECLARE
    invitation_record public.organization_invitations;
    user_email TEXT;
BEGIN
    -- Get current user's email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    -- Find the invitation
    SELECT * INTO invitation_record 
    FROM public.organization_invitations 
    WHERE token = invitation_token 
    AND email = user_email 
    AND is_active = true 
    AND expires_at > NOW()
    AND accepted_at IS NULL;
    
    IF invitation_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.organization_memberships 
        WHERE organization_id = invitation_record.organization_id 
        AND user_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User is already a member of this organization');
    END IF;
    
    -- Create membership
    INSERT INTO public.organization_memberships (
        organization_id, 
        user_id, 
        role, 
        invited_by, 
        invited_at,
        joined_at
    ) VALUES (
        invitation_record.organization_id,
        auth.uid(),
        invitation_record.role,
        invitation_record.invited_by,
        invitation_record.created_at,
        NOW()
    );
    
    -- Mark invitation as accepted
    UPDATE public.organization_invitations 
    SET accepted_at = NOW(), is_active = false 
    WHERE id = invitation_record.id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'organization_id', invitation_record.organization_id,
        'role', invitation_record.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (limited)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.organizations TO anon;