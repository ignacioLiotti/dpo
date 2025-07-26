-- Organization Invitation Functions
-- This migration adds database functions for managing organization invitations

-- Function to create an organization invitation
CREATE OR REPLACE FUNCTION public.create_organization_invitation(
    p_organization_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'member'
)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    email TEXT,
    role TEXT,
    token UUID,
    expires_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_role TEXT;
    v_invitation_id UUID;
    v_token UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Check if the current user has permission to invite
    SELECT om.role INTO v_user_role
    FROM public.organization_memberships om
    WHERE om.organization_id = p_organization_id
    AND om.user_id = auth.uid()
    AND om.is_active = true;
    
    IF v_user_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Insufficient permissions to invite members';
    END IF;
    
    -- Validate role
    IF p_role NOT IN ('viewer', 'member', 'admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be viewer, member, or admin';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM public.organization_memberships om
        JOIN auth.users u ON u.id = om.user_id
        WHERE om.organization_id = p_organization_id
        AND u.email = p_email
        AND om.is_active = true
    ) THEN
        RAISE EXCEPTION 'User is already a member of this organization';
    END IF;
    
    -- Check for existing active invitation
    IF EXISTS (
        SELECT 1 FROM public.organization_invitations oi
        WHERE oi.organization_id = p_organization_id
        AND oi.email = p_email
        AND oi.is_active = true
        AND oi.expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'An active invitation already exists for this email';
    END IF;
    
    -- Create the invitation
    v_invitation_id := gen_random_uuid();
    v_token := gen_random_uuid();
    v_expires_at := NOW() + INTERVAL '7 days';
    
    INSERT INTO public.organization_invitations (
        id,
        organization_id,
        email,
        role,
        invited_by,
        token,
        expires_at,
        is_active
    ) VALUES (
        v_invitation_id,
        p_organization_id,
        p_email,
        p_role,
        auth.uid(),
        v_token,
        v_expires_at,
        true
    );
    
    -- Return the created invitation
    RETURN QUERY
    SELECT 
        v_invitation_id,
        p_organization_id,
        p_email,
        p_role,
        v_token,
        v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an organization invitation
CREATE OR REPLACE FUNCTION public.accept_organization_invitation(
    p_token UUID
)
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    role TEXT
) AS $$
DECLARE
    v_invitation RECORD;
    v_user_email TEXT;
    v_org_name TEXT;
BEGIN
    -- Get the current user's email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get the invitation
    SELECT * INTO v_invitation
    FROM public.organization_invitations
    WHERE token = p_token
    AND is_active = true
    AND expires_at > NOW()
    FOR UPDATE;
    
    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;
    
    -- Verify the invitation is for this user
    IF v_invitation.email != v_user_email THEN
        RAISE EXCEPTION 'This invitation is for a different email address';
    END IF;
    
    -- Get organization name
    SELECT name INTO v_org_name
    FROM public.organizations
    WHERE id = v_invitation.organization_id;
    
    -- Create the membership
    INSERT INTO public.organization_memberships (
        organization_id,
        user_id,
        role,
        joined_at,
        is_active
    ) VALUES (
        v_invitation.organization_id,
        auth.uid(),
        v_invitation.role,
        NOW(),
        true
    )
    ON CONFLICT (organization_id, user_id) 
    DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true,
        joined_at = NOW();
    
    -- Mark invitation as accepted
    UPDATE public.organization_invitations
    SET 
        accepted_at = NOW(),
        is_active = false
    WHERE id = v_invitation.id;
    
    -- Return organization info
    RETURN QUERY
    SELECT 
        v_invitation.organization_id,
        v_org_name,
        v_invitation.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending invitations for an organization
CREATE OR REPLACE FUNCTION public.get_organization_invitations(
    p_organization_id UUID
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    invited_by_name TEXT,
    invited_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Check if user has permission to view invitations
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_memberships
        WHERE organization_id = p_organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to view invitations';
    END IF;
    
    RETURN QUERY
    SELECT 
        oi.id,
        oi.email,
        oi.role,
        COALESCE(p.full_name, u.email) as invited_by_name,
        oi.created_at as invited_at,
        oi.expires_at
    FROM public.organization_invitations oi
    JOIN auth.users u ON u.id = oi.invited_by
    LEFT JOIN public.profiles p ON p.id = oi.invited_by
    WHERE oi.organization_id = p_organization_id
    AND oi.is_active = true
    AND oi.expires_at > NOW()
    ORDER BY oi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel an invitation
CREATE OR REPLACE FUNCTION public.cancel_organization_invitation(
    p_invitation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_organization_id UUID;
BEGIN
    -- Get the organization ID from the invitation
    SELECT organization_id INTO v_organization_id
    FROM public.organization_invitations
    WHERE id = p_invitation_id;
    
    IF v_organization_id IS NULL THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;
    
    -- Check if user has permission to cancel
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_memberships
        WHERE organization_id = v_organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to cancel invitations';
    END IF;
    
    -- Cancel the invitation
    UPDATE public.organization_invitations
    SET is_active = false
    WHERE id = p_invitation_id
    AND is_active = true;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization members
CREATE OR REPLACE FUNCTION public.get_organization_members(
    p_organization_id UUID
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ,
    avatar_url TEXT
) AS $$
BEGIN
    -- Check if user has permission to view members
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_memberships
        WHERE organization_id = p_organization_id
        AND user_id = auth.uid()
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to view members';
    END IF;
    
    RETURN QUERY
    SELECT 
        om.user_id,
        u.email,
        COALESCE(p.full_name, u.email) as full_name,
        om.role,
        om.joined_at,
        p.avatar_url
    FROM public.organization_memberships om
    JOIN auth.users u ON u.id = om.user_id
    LEFT JOIN public.profiles p ON p.id = om.user_id
    WHERE om.organization_id = p_organization_id
    AND om.is_active = true
    ORDER BY 
        CASE om.role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'member' THEN 3 
            WHEN 'viewer' THEN 4 
        END,
        om.joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_organization_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_organization_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_members TO authenticated;