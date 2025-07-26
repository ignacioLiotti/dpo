import { Resend } from 'resend';

// Initialize Resend client
// To use email functionality, add RESEND_API_KEY to your environment variables
export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null as any;

// Email templates can be added here
export const emailTemplates = {
  invitation: (data: {
    organizationName: string;
    inviterName: string;
    recipientEmail: string;
    role: string;
    acceptUrl: string;
  }) => ({
    subject: `Invitation to join ${data.organizationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited!</h2>
        <p>${data.inviterName} has invited you to join <strong>${data.organizationName}</strong> as a ${data.role}.</p>
        <a href="${data.acceptUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
          Accept Invitation
        </a>
      </div>
    `,
  }),
};