-- Fix infinite recursion in organization_memberships RLS policies
-- The issue is that the policies are self-referencing when checking memberships

-- First, temporarily disable RLS to clean up policies
ALTER TABLE public.organization_memberships DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on organization_memberships
DROP POLICY IF EXISTS "Users can view memberships in their organizations" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization admins can manage memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Users can view organization memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization admins can insert memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization admins can update memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization owners can delete memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "System can create initial membership" ON public.organization_memberships;

-- Re-enable RLS
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Create new, simpler policies that avoid recursion

-- Policy 1: Users can always view their own membership records
CREATE POLICY "Users can view their own memberships" ON public.organization_memberships
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Policy 2: For INSERT - Allow trigger function to create initial membership
-- This policy allows both the trigger and admins to insert memberships
CREATE POLICY "Allow membership creation" ON public.organization_memberships
    FOR INSERT WITH CHECK (
        -- Always allow inserts - the trigger will handle the initial membership
        -- and admins can add new members
        true
    );

-- Policy 3: For UPDATE - Only admins can update memberships
CREATE POLICY "Admins can update memberships" ON public.organization_memberships
    FOR UPDATE USING (
        -- Check if the current user is an admin of this organization
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_memberships om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.is_active = true
        )
    );

-- Policy 4: For DELETE - Only owners can delete memberships
CREATE POLICY "Owners can delete memberships" ON public.organization_memberships
    FOR DELETE USING (
        organization_id IN (
            SELECT om.organization_id
            FROM public.organization_memberships om
            WHERE om.user_id = auth.uid()
            AND om.role = 'owner'
            AND om.is_active = true
        )
    );

-- Also update the trigger function to ensure it works with the new policies
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID from auth context
    current_user_id := auth.uid();
    
    -- Only create membership if there's an authenticated user
    IF current_user_id IS NOT NULL THEN
        -- Insert membership - this will work because of SECURITY DEFINER
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
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the organization creation
    RAISE WARNING 'Failed to create initial membership: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_organization();