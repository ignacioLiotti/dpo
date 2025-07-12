-- Drop the existing table and recreate it with the correct structure for organization files
DROP TABLE IF EXISTS public.folder_field_definitions CASCADE;

-- Create the corrected folder_field_definitions table for organization files
CREATE TABLE public.folder_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    field_description TEXT,
    extraction_method TEXT NOT NULL,
    extraction_pattern TEXT NOT NULL,
    validation_pattern TEXT,
    default_value TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_folder_field_definitions_folder_id ON public.folder_field_definitions(folder_id);
CREATE INDEX idx_folder_field_definitions_organization_id ON public.folder_field_definitions(organization_id);
CREATE INDEX idx_folder_field_definitions_user_id ON public.folder_field_definitions(user_id);

-- Add RLS policies
ALTER TABLE public.folder_field_definitions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view field definitions for folders in their organization
CREATE POLICY "Users can view folder field definitions in their organization" ON public.folder_field_definitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.organization_id = folder_field_definitions.organization_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- Policy: Users can insert field definitions for folders in their organization
CREATE POLICY "Users can create folder field definitions in their organization" ON public.folder_field_definitions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.organization_id = folder_field_definitions.organization_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
        AND EXISTS (
            SELECT 1 FROM public.folders f
            WHERE f.id = folder_field_definitions.folder_id
            AND f.organization_id = folder_field_definitions.organization_id
        )
    );

-- Policy: Users can update field definitions in their organization
CREATE POLICY "Users can update folder field definitions in their organization" ON public.folder_field_definitions
    FOR UPDATE USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.organization_id = folder_field_definitions.organization_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- Policy: Users can delete field definitions in their organization
CREATE POLICY "Users can delete folder field definitions in their organization" ON public.folder_field_definitions
    FOR DELETE USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.organization_id = folder_field_definitions.organization_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_folder_field_definitions_updated_at 
    BEFORE UPDATE ON public.folder_field_definitions 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 