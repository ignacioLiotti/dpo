-- Fix Organization Security and Enable RLS
-- This migration re-enables Row Level Security on organizations table with proper policies

-- First, re-enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization admins can update" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete" ON public.organizations;

-- Policy 1: Users can view organizations they are members of
CREATE POLICY "Users can view organizations they are members of" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Policy 2: Authenticated users can create organizations
CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Policy 3: Organization owners and admins can update
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

-- Policy 4: Only organization owners can delete
CREATE POLICY "Organization owners can delete" ON public.organizations
    FOR DELETE USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
            AND is_active = true
        )
    );

-- Fix the organization_memberships policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization admins can manage memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Users can update their own non-role fields" ON public.organization_memberships;

-- Allow users to view memberships for organizations they belong to
CREATE POLICY "Users can view memberships in their organizations" ON public.organization_memberships
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_memberships AS om
            WHERE om.user_id = auth.uid() 
            AND om.is_active = true
        )
    );

-- Allow organization admins to manage memberships
CREATE POLICY "Organization admins can manage memberships" ON public.organization_memberships
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_memberships AS om
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin')
            AND om.is_active = true
        )
    );

-- Fix the organization invitations policies
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organization admins can manage invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.organization_invitations;

-- Organization admins can manage invitations
CREATE POLICY "Organization admins can manage invitations" ON public.organization_invitations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND is_active = true
        )
    );

-- Users can view and accept invitations sent to their email
CREATE POLICY "Users can view invitations sent to their email" ON public.organization_invitations
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND is_active = true
        AND expires_at > NOW()
    );

-- Update the trigger function to work with RLS enabled
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- Only create membership if there's an authenticated user
    IF current_user_id IS NOT NULL THEN
        -- Insert membership with SECURITY DEFINER context
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_organization();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_active 
    ON public.organization_memberships(user_id, is_active) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_org_memberships_org_role 
    ON public.organization_memberships(organization_id, role);

CREATE INDEX IF NOT EXISTS idx_org_invitations_email_active 
    ON public.organization_invitations(email, is_active, expires_at) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_org_invitations_token 
    ON public.organization_invitations(token) 
    WHERE is_active = true;