'use server';

import { orgActionClient, ActionError, revalidateHelpers } from '@/app/auth/safe-action';
import { z } from 'zod';
import { resend } from '@/lib/resend';

// Schemas
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['viewer', 'member', 'admin'], {
    errorMap: () => ({ message: 'Invalid role' })
  }),
});

const acceptInvitationSchema = z.object({
  token: z.string().uuid('Invalid invitation token'),
});

const cancelInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
});

// Create organization invitation
export const createOrganizationInvitation = orgActionClient
  .schema(createInvitationSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      // Call the database function
      const { data, error } = await ctx.supabase
        .rpc('create_organization_invitation', {
          p_organization_id: ctx.organizationId,
          p_email: parsedInput.email,
          p_role: parsedInput.role,
        })
        .single();

      if (error) {
        throw new ActionError(error.message, 'INVITATION_ERROR');
      }

      // Get organization details for email
      const { data: org } = await ctx.supabase
        .from('organizations')
        .select('name')
        .eq('id', ctx.organizationId)
        .single();

      // Get inviter details
      const { data: inviter } = await ctx.supabase
        .from('profiles')
        .select('full_name')
        .eq('id', ctx.user.id)
        .single();

      // Send invitation email if Resend is configured
      if (process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: 'DPO App <noreply@dpo-app.com>',
            to: parsedInput.email,
            subject: `You've been invited to join ${org?.name || 'an organization'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Organization Invitation</h2>
                <p>Hi there,</p>
                <p>${inviter?.full_name || ctx.user.email} has invited you to join <strong>${org?.name}</strong> as a ${parsedInput.role}.</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/invitations/accept?token=${data.token}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                  Accept Invitation
                </a>
                <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
                <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Don't fail the invitation if email fails
        }
      }

      revalidateHelpers.organization();
      return { 
        success: true, 
        invitationId: data.id,
        message: 'Invitation sent successfully' 
      };
    } catch (error) {
      if (error instanceof ActionError) throw error;
      throw new ActionError('Failed to create invitation', 'INVITATION_ERROR');
    }
  });

// Accept organization invitation
export const acceptOrganizationInvitation = authActionClient
  .schema(acceptInvitationSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { data, error } = await ctx.supabase
        .rpc('accept_organization_invitation', {
          p_token: parsedInput.token,
        })
        .single();

      if (error) {
        throw new ActionError(error.message, 'ACCEPT_ERROR');
      }

      revalidateHelpers.organization();
      return { 
        success: true, 
        organizationId: data.organization_id,
        organizationName: data.organization_name,
        role: data.role,
        message: `Successfully joined ${data.organization_name}` 
      };
    } catch (error) {
      if (error instanceof ActionError) throw error;
      throw new ActionError('Failed to accept invitation', 'ACCEPT_ERROR');
    }
  });

// Get organization invitations
export const getOrganizationInvitations = orgActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    try {
      const { data, error } = await ctx.supabase
        .rpc('get_organization_invitations', {
          p_organization_id: ctx.organizationId,
        });

      if (error) {
        throw new ActionError(error.message, 'FETCH_ERROR');
      }

      return data || [];
    } catch (error) {
      if (error instanceof ActionError) throw error;
      throw new ActionError('Failed to fetch invitations', 'FETCH_ERROR');
    }
  });

// Cancel invitation
export const cancelOrganizationInvitation = orgActionClient
  .schema(cancelInvitationSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { data, error } = await ctx.supabase
        .rpc('cancel_organization_invitation', {
          p_invitation_id: parsedInput.invitationId,
        });

      if (error) {
        throw new ActionError(error.message, 'CANCEL_ERROR');
      }

      revalidateHelpers.organization();
      return { success: true, message: 'Invitation cancelled' };
    } catch (error) {
      if (error instanceof ActionError) throw error;
      throw new ActionError('Failed to cancel invitation', 'CANCEL_ERROR');
    }
  });

// Get organization members
export const getOrganizationMembers = orgActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    try {
      const { data, error } = await ctx.supabase
        .rpc('get_organization_members', {
          p_organization_id: ctx.organizationId,
        });

      if (error) {
        throw new ActionError(error.message, 'FETCH_ERROR');
      }

      return data || [];
    } catch (error) {
      if (error instanceof ActionError) throw error;
      throw new ActionError('Failed to fetch members', 'FETCH_ERROR');
    }
  });