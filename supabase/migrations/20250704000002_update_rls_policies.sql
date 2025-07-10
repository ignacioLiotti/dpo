-- Drop existing RLS policies that will be replaced with organization-scoped ones
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new organization-scoped RLS policies for profiles
CREATE POLICY "Users can view profiles in their organizations" ON public.profiles
    FOR SELECT USING (
        organization_id IS NULL -- Allow viewing profiles without organization (for backwards compatibility)
        OR organization_id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
        OR id = auth.uid() -- Users can always view their own profile
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Update obras RLS policies to be organization-scoped
-- First, drop any existing obras policies
DROP POLICY IF EXISTS "Users can view all obras" ON public.obras;
DROP POLICY IF EXISTS "Users can update their own obras" ON public.obras;
DROP POLICY IF EXISTS "Users can insert obras" ON public.obras;
DROP POLICY IF EXISTS "Users can delete their own obras" ON public.obras;

-- Create organization-scoped obras policies
CREATE POLICY "Users can view obras in their organizations" ON public.obras
    FOR SELECT USING (
        organization_id IS NULL -- Allow viewing obras without organization (for backwards compatibility)
        OR public.user_belongs_to_organization(organization_id)
    );

CREATE POLICY "Users can create obras in their organizations" ON public.obras
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
            organization_id IS NULL 
            OR public.user_belongs_to_organization(organization_id)
        )
    );

CREATE POLICY "Users can update obras in their organizations" ON public.obras
    FOR UPDATE USING (
        (user_id = auth.uid() OR public.user_is_organization_admin(organization_id))
        AND (
            organization_id IS NULL 
            OR public.user_belongs_to_organization(organization_id)
        )
    );

CREATE POLICY "Organization admins can delete obras" ON public.obras
    FOR DELETE USING (
        public.user_is_organization_admin(organization_id)
        OR (organization_id IS NULL AND user_id = auth.uid())
    );

-- Create RLS policies for documents tables if they exist
DO $$
BEGIN
    -- Documents table policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view documents in their organizations" ON public.documents;
        DROP POLICY IF EXISTS "Users can create documents in their organizations" ON public.documents;
        DROP POLICY IF EXISTS "Users can update documents in their organizations" ON public.documents;
        DROP POLICY IF EXISTS "Organization admins can delete documents" ON public.documents;
        
        -- Create new policies
        CREATE POLICY "Users can view documents in their organizations" ON public.documents
            FOR SELECT USING (
                organization_id IS NULL 
                OR public.user_belongs_to_organization(organization_id)
            );
            
        CREATE POLICY "Users can create documents in their organizations" ON public.documents
            FOR INSERT WITH CHECK (
                auth.uid() IS NOT NULL 
                AND (
                    organization_id IS NULL 
                    OR public.user_belongs_to_organization(organization_id)
                )
            );
            
        CREATE POLICY "Users can update documents in their organizations" ON public.documents
            FOR UPDATE USING (
                organization_id IS NULL 
                OR public.user_belongs_to_organization(organization_id)
            );
            
        CREATE POLICY "Organization admins can delete documents" ON public.documents
            FOR DELETE USING (
                public.user_is_organization_admin(organization_id)
                OR organization_id IS NULL
            );
    END IF;
    
    -- Obra documents table policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obra_documents' AND table_schema = 'public') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view obra_documents in their organizations" ON public.obra_documents;
        DROP POLICY IF EXISTS "Users can create obra_documents in their organizations" ON public.obra_documents;
        DROP POLICY IF EXISTS "Users can update obra_documents in their organizations" ON public.obra_documents;
        DROP POLICY IF EXISTS "Organization admins can delete obra_documents" ON public.obra_documents;
        
        -- Create new policies
        CREATE POLICY "Users can view obra_documents in their organizations" ON public.obra_documents
            FOR SELECT USING (
                organization_id IS NULL 
                OR public.user_belongs_to_organization(organization_id)
            );
            
        CREATE POLICY "Users can create obra_documents in their organizations" ON public.obra_documents
            FOR INSERT WITH CHECK (
                auth.uid() IS NOT NULL 
                AND (
                    organization_id IS NULL 
                    OR public.user_belongs_to_organization(organization_id)
                )
            );
            
        CREATE POLICY "Users can update obra_documents in their organizations" ON public.obra_documents
            FOR UPDATE USING (
                organization_id IS NULL 
                OR public.user_belongs_to_organization(organization_id)
            );
            
        CREATE POLICY "Organization admins can delete obra_documents" ON public.obra_documents
            FOR DELETE USING (
                public.user_is_organization_admin(organization_id)
                OR organization_id IS NULL
            );
    END IF;
    
    -- Document folders table policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_folders' AND table_schema = 'public') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view document_folders in their organizations" ON public.document_folders;
        DROP POLICY IF EXISTS "Users can create document_folders in their organizations" ON public.document_folders;
        DROP POLICY IF EXISTS "Users can update document_folders in their organizations" ON public.document_folders;
        DROP POLICY IF EXISTS "Organization admins can delete document_folders" ON public.document_folders;
        
        -- Create new policies
        CREATE POLICY "Users can view document_folders in their organizations" ON public.document_folders
            FOR SELECT USING (
                organization_id IS NULL 
                OR public.user_belongs_to_organization(organization_id)
            );
            
        CREATE POLICY "Users can create document_folders in their organizations" ON public.document_folders
            FOR INSERT WITH CHECK (
                auth.uid() IS NOT NULL 
                AND (
                    organization_id IS NULL 
                    OR public.user_belongs_to_organization(organization_id)
                )
            );
            
        CREATE POLICY "Users can update document_folders in their organizations" ON public.document_folders
            FOR UPDATE USING (
                organization_id IS NULL 
                OR public.user_belongs_to_organization(organization_id)
            );
            
        CREATE POLICY "Organization admins can delete document_folders" ON public.document_folders
            FOR DELETE USING (
                public.user_is_organization_admin(organization_id)
                OR organization_id IS NULL
            );
    END IF;
END $$;

-- Policies for reference tables (reparticiones, areas, tipos_obra)
-- These can be organization-specific or global, depending on your needs
-- For now, let's make them viewable by all authenticated users

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view reparticiones" ON public.reparticiones;
DROP POLICY IF EXISTS "Authenticated users can view areas" ON public.areas;
DROP POLICY IF EXISTS "Authenticated users can view tipos_obra" ON public.tipos_obra;

-- Create policies for reference tables
CREATE POLICY "Authenticated users can view reparticiones" ON public.reparticiones
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view areas" ON public.areas
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view tipos_obra" ON public.tipos_obra
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only organization admins can modify reference tables
CREATE POLICY "Organization admins can modify reparticiones" ON public.reparticiones
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND is_active = true
        )
    );

CREATE POLICY "Organization admins can modify areas" ON public.areas
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND is_active = true
        )
    );

CREATE POLICY "Organization admins can modify tipos_obra" ON public.tipos_obra
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND is_active = true
        )
    );