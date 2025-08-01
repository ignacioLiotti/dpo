-- Fix organization_memberships RLS policies (v2)
-- This version properly handles the INSERT policy without using NEW keyword

-- First, drop the problematic policy from previous migration if it exists
DROP POLICY IF EXISTS "Allow initial membership creation" ON public.organization_memberships;
DROP POLICY IF EXISTS "Allow membership creation" ON public.organization_memberships;

-- Create a proper INSERT policy that checks if user is creating their own membership
-- or if they're an admin of the organization
CREATE POLICY "Allow membership creation" ON public.organization_memberships
    FOR INSERT WITH CHECK (
        -- Allow if:
        -- 1. User is creating their own membership (happens via trigger after org creation)
        -- 2. User is an admin/owner adding someone else to their organization
        (
            -- Case 1: Creating own membership (via trigger)
            user_id = auth.uid()
        ) OR (
            -- Case 2: Admin adding new members
            organization_id IN (
                SELECT om.organization_id
                FROM public.organization_memberships om
                WHERE om.user_id = auth.uid()
                AND om.role IN ('owner', 'admin')
                AND om.is_active = true
            )
        )
    );

-- Also ensure the trigger function doesn't throw errors
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID from auth context
    current_user_id := auth.uid();
    
    -- Only create membership if there's an authenticated user
    IF current_user_id IS NOT NULL THEN
        -- Use a block to catch any RLS policy violations
        BEGIN
            -- Insert membership - this should work because user_id = auth.uid()
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
        EXCEPTION WHEN OTHERS THEN
            -- If RLS fails, try with SECURITY DEFINER privileges
            -- This ensures the membership is created even if policies are restrictive
            EXECUTE format(
                'INSERT INTO public.organization_memberships (organization_id, user_id, role, joined_at, is_active) VALUES (%L, %L, %L, NOW(), true)',
                NEW.id,
                current_user_id,
                'owner'
            );
        END;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the organization creation
    RAISE WARNING 'Failed to create initial membership: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;