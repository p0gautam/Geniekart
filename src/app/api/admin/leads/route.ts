import { authorize, assertOrigin } from '@/lib/auth';
import {
  enquiryDetail,
  enquiryFailure,
  listEnquiries,
  readEnquiryJson,
  supabaseRequest,
} from '@/lib/supabase-enquiries';
import { enquiryStatuses, type Enquiry } from '@/lib/enquiry-types';
import { z } from 'zod';
export async function GET(req: Request) {
  try {
    await authorize(['SUPER_ADMIN', 'SALES']);
    const params = new URL(req.url).searchParams;
    const result = params.has('id')
      ? await enquiryDetail(params.get('id')!)
      : await listEnquiries(Object.fromEntries(params));
    return Response.json(result, {
      status: result ? 200 : 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return enquiryFailure(e);
  }
}
export async function POST(req: Request) {
  try {
    await assertOrigin(req);
    const actor = await authorize(['SUPER_ADMIN', 'SALES']);
    const body = z
      .object({
        id: z.string().uuid(),
        operationId: z.string().uuid(),
        data: z.object({
          status: z.enum(enquiryStatuses),
          note: z.string().trim().max(5000).default(''),
        }),
      })
      .parse(await readEnquiryJson(req));
    const result = await supabaseRequest<Enquiry | null>('rpc/geniekart_update', {
      p_id: body.id,
      p_status: body.data.status,
      p_note: body.data.note,
      p_actor_id: actor.id,
      p_actor_name: actor.name,
      p_operation: body.operationId,
    });
    return Response.json(result || { error: 'Enquiry not found.' }, {
      status: result ? 200 : 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return enquiryFailure(e);
  }
}
