-- Create organizations table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
    slug TEXT UNIQUE NOT NULL CHECK (char_length(slug) >= 2 AND char_length(slug) <= 50),
    description TEXT CHECK (char_length(description) <= 500),
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

-- Create organization memberships table
CREATE TABLE public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique membership per user per organization
    UNIQUE(organization_id, user_id)
);

-- Create organization invitations table
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
    
    -- Ensure unique invitation per email per organization
    UNIQUE(organization_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX organizations_slug_idx ON public.organizations(slug);
CREATE INDEX organizations_is_active_idx ON public.organizations(is_active);
CREATE INDEX organization_memberships_organization_id_idx ON public.organization_memberships(organization_id);
CREATE INDEX organization_memberships_user_id_idx ON public.organization_memberships(user_id);
CREATE INDEX organization_memberships_role_idx ON public.organization_memberships(role);
CREATE INDEX organization_invitations_organization_id_idx ON public.organization_invitations(organization_id);
CREATE INDEX organization_invitations_email_idx ON public.organization_invitations(email);
CREATE INDEX organization_invitations_token_idx ON public.organization_invitations(token);
CREATE INDEX organization_invitations_expires_at_idx ON public.organization_invitations(expires_at);

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_organization_memberships_updated_at
    BEFORE UPDATE ON public.organization_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_organization_invitations_updated_at
    BEFORE UPDATE ON public.organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Organization owners/admins can update their organization" ON public.organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND is_active = true
        )
    );

CREATE POLICY "Any authenticated user can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for organization memberships
CREATE POLICY "Users can view memberships for their organizations" ON public.organization_memberships
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Organization owners/admins can manage memberships" ON public.organization_memberships
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND is_active = true
        )
    );

CREATE POLICY "Users can update their own membership" ON public.organization_memberships
    FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for organization invitations
CREATE POLICY "Users can view invitations for their organizations" ON public.organization_invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND is_active = true
        )
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Organization owners/admins can manage invitations" ON public.organization_invitations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND is_active = true
        )
    );

-- Function to automatically create organization membership when organization is created
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    -- Create owner membership for the user who created the organization
    INSERT INTO public.organization_memberships (organization_id, user_id, role, joined_at)
    VALUES (NEW.id, auth.uid(), 'owner', NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create owner membership for new organizations
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_organization();

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