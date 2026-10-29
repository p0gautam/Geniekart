import { authorize, assertOrigin } from '@/lib/auth';
import { supabaseRequest, enquiryFailure } from '@/lib/supabase-enquiries';
import { notifyLead } from '@/lib/notifications';
export async function POST(req: Request) {
  try {
    await assertOrigin(req);
    await authorize(['SUPER_ADMIN', 'SALES']);
    if (!process.env.SMTP_HOST)
      return Response.json(
        { ok: false, error: 'Email notifications are not configured.' },
        { status: 503 },
      );
    const pending = await supabaseRequest<{ enquiry_id: string }[]>(
      'enquiry_notifications?sent_at=is.null&attempts=lt.10&limit=20',
      undefined,
      'GET',
    );
    for (const n of pending) await notifyLead(n.enquiry_id);
    return Response.json({
      ok: true,
      message: 'Notification attempts completed. Check each enquiry for delivery status.',
    });
  } catch (e) {
    return enquiryFailure(e);
  }
}
