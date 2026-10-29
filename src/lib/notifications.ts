import nodemailer from 'nodemailer';
import { enquiryDetail, supabaseRequest } from './supabase-enquiries';
import { settings } from './data';
export async function notifyLead(id: string) {
  const s = await settings();
  if (!process.env.SMTP_HOST || !s.notificationEmail) return;
  const n = await enquiryDetail(id);
  if (!n || !(await supabaseRequest<boolean>('rpc/geniekart_claim_notification', { p_id: id })))
    return;
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: s.notificationEmail,
      subject: 'New Geniekart bulk gifting enquiry',
      text: `A new enquiry (${id}) from ${n.company} is ready to review in the admin dashboard.\n${process.env.SITE_URL}/admin/leads`,
    });
    await supabaseRequest(
      `enquiry_notifications?enquiry_id=eq.${id}`,
      { sent_at: new Date().toISOString(), last_error: null, locked_until: null },
      'PATCH',
    );
  } catch {
    await supabaseRequest(
      `enquiry_notifications?enquiry_id=eq.${id}`,
      { last_error: 'Delivery failed. Check SMTP configuration and retry.', locked_until: null },
      'PATCH',
    );
  }
}
