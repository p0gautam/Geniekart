import { authorize } from '@/lib/auth';
import { listEnquiries, enquiryFailure } from '@/lib/supabase-enquiries';
import type { Enquiry } from '@/lib/enquiry-types';
import { csvCell } from '@/lib/validation';
export async function GET() {
  try {
    await authorize(['SUPER_ADMIN', 'SALES']);
    const leads: Enquiry[] = [];
    for (let page = 1; ; page++) {
      const batch = await listEnquiries({ page }, 100);
      leads.push(...batch.rows);
      if (leads.length >= batch.total || !batch.rows.length) break;
    }
    const rows = [
      ['Name', 'Company', 'Email', 'Phone', 'Quantity', 'Status', 'Items', 'Source', 'UTM', 'Date'],
      ...leads.map((l) => [
        l.name,
        l.company,
        l.email,
        l.phone,
        l.quantity,
        l.status,
        l.selected_combo_name || '',
        l.source_page,
        JSON.stringify(l.utm),
        l.created_at,
      ]),
    ];
    return new Response('\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="geniekart-leads.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return enquiryFailure(e);
  }
}
