-- Proper Organization RLS Setup
-- This migration re-enables RLS with proper authentication handling

-- Re-enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create comprehensive organization policies
CREATE POLICY "Anyone can view public organization info" ON public.organizations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Organization owners and admins can update" ON public.organizations
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            id IN (
                SELECT organization_id 
                FROM public.organization_memberships 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin') 
                AND is_active = true
            )
        )
    );

CREATE POLICY "Organization owners can delete" ON public.organizations
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND (
            id IN (
                SELECT organization_id 
                FROM public.organization_memberships 
                WHERE user_id = auth.uid() 
                AND role = 'owner' 
                AND is_active = true
            )
        )
    );

-- Improve the organization creation trigger to handle authentication better
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- Only create membership if there's an authenticated user
    IF current_user_id IS NOT NULL THEN
        -- Create the organization membership without RLS interference
        -- Use INSERT with explicit user context
        INSERT INTO public.organization_memberships (
            organization_id, 
            user_id, 
            role, 
            joined_at,
            is_active
        )
        VALUES (
            NEW.id, 
            current_user_id, 
            'owner', 
            NOW(),
            true
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public; 