import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Luna <onboarding@resend.dev>';
    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text
    });
    
    if (result.error) {
      console.error('[Resend] API Error:', result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error('[Resend] Exception:', error);
    return { success: false, error };
  }
}
