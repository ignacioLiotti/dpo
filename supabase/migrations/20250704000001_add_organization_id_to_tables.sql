-- Add organization_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Add organization_id to obras table
ALTER TABLE public.obras 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Add organization_id to documents table (if it exists)
-- Note: This will be adjusted based on your actual documents table structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        ALTER TABLE public.documents 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Add organization_id to obra_documents table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obra_documents' AND table_schema = 'public') THEN
        ALTER TABLE public.obra_documents 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Add organization_id to document_folders table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_folders' AND table_schema = 'public') THEN
        ALTER TABLE public.document_folders 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Add organization_id to adicionales table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adicionales' AND table_schema = 'public') THEN
        ALTER TABLE public.adicionales 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Add organization_id to redeterminaciones table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'redeterminaciones' AND table_schema = 'public') THEN
        ALTER TABLE public.redeterminaciones 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Add organization_id to ampliaciones_plazo table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ampliaciones_plazo' AND table_schema = 'public') THEN
        ALTER TABLE public.ampliaciones_plazo 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Create indexes for organization_id columns
CREATE INDEX profiles_organization_id_idx ON public.profiles(organization_id);
CREATE INDEX obras_organization_id_idx ON public.obras(organization_id);

-- Add indexes for other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        CREATE INDEX documents_organization_id_idx ON public.documents(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obra_documents' AND table_schema = 'public') THEN
        CREATE INDEX obra_documents_organization_id_idx ON public.obra_documents(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_folders' AND table_schema = 'public') THEN
        CREATE INDEX document_folders_organization_id_idx ON public.document_folders(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adicionales' AND table_schema = 'public') THEN
        CREATE INDEX adicionales_organization_id_idx ON public.adicionales(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'redeterminaciones' AND table_schema = 'public') THEN
        CREATE INDEX redeterminaciones_organization_id_idx ON public.redeterminaciones(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ampliaciones_plazo' AND table_schema = 'public') THEN
        CREATE INDEX ampliaciones_plazo_organization_id_idx ON public.ampliaciones_plazo(organization_id);
    END IF;
END $$;

-- Function to get user's current organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Get the user's primary organization (first active membership)
    -- In a more sophisticated setup, you might store the "current" org in user preferences
    SELECT om.organization_id INTO org_id
    FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.is_active = true
    ORDER BY 
        CASE WHEN om.role = 'owner' THEN 1 
             WHEN om.role = 'admin' THEN 2 
             ELSE 3 END,
        om.joined_at
    LIMIT 1;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_memberships 
        WHERE user_id = auth.uid() 
        AND organization_id = org_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin role in organization
CREATE OR REPLACE FUNCTION public.user_is_organization_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_memberships 
        WHERE user_id = auth.uid() 
        AND organization_id = org_id 
        AND role IN ('owner', 'admin')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;