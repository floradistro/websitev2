import { Resend } from 'resend';

// Lazy initialization - only throw when actually used, not on import
let resendInstance: Resend | null = null;

function getResendClient() {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export const resend = () => getResendClient();

// Simple, clean email sending function
export async function sendEmail({
  to,
  subject,
  html,
  from = 'WhaleTools <onboarding@resend.dev>',
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
      reply_to: replyTo,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    return { success: true, emailId: data?.id };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
