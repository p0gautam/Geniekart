import 'server-only';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { enquiryStatuses, type Enquiry, type EnquiryList } from './enquiry-types';

export class EnquiryError extends Error {
  constructor(
    public status: number,
    public category: string,
    message: string,
  ) {
    super(message);
  }
}
export async function supabaseRequest<T>(
  path: string,
  body?: unknown,
  method = 'POST',
): Promise<T> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new EnquiryError(
      503,
      'configuration',
      'Enquiry storage is not configured. Please try again later.',
    );
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !key.startsWith('sb_secret_'))
    throw new EnquiryError(503, 'configuration', 'Enquiry storage configuration needs attention.');
  try {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      method,
      headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('REMOTE_STORAGE');
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  } catch {
    throw new EnquiryError(
      503,
      'storage_unavailable',
      'Enquiry storage is temporarily unavailable. Please retry; your submission will not be duplicated.',
    );
  }
}
export const enquiryFilters = z
  .object({
    search: z.string().trim().max(250).default(''),
    status: z.enum(['', ...enquiryStatuses]).default(''),
    occasion: z.string().max(250).default(''),
    from: z.string().date().or(z.literal('')).default(''),
    to: z.string().date().or(z.literal('')).default(''),
    page: z.coerce.number().int().min(1).max(100000).default(1),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, 'Start date must precede end date');
export async function listEnquiries(input: unknown = {}, size = 20) {
  const f = enquiryFilters.parse(input);
  return supabaseRequest<EnquiryList>('rpc/geniekart_list', {
    p_search: f.search,
    p_status: f.status,
    p_occasion: f.occasion,
    p_from: f.from || null,
    p_to: f.to || null,
    p_page: f.page,
    p_size: size,
  });
}
export async function enquiryDetail(id: string) {
  return supabaseRequest<Enquiry | null>('rpc/geniekart_detail', {
    p_id: z.string().uuid().parse(id),
  });
}
export function enquiryFailure(error: unknown) {
  const reference = randomUUID();
  const message = error instanceof Error ? error.message : '';
  const mapped =
    message === 'UNAUTHORIZED'
      ? new EnquiryError(401, 'unauthorized', 'Please sign in.')
      : message === 'FORBIDDEN'
        ? new EnquiryError(403, 'forbidden', 'This action is not permitted.')
        : error instanceof z.ZodError
          ? new EnquiryError(422, 'validation', 'Please check the submitted fields.')
          : error instanceof EnquiryError
            ? error
            : new EnquiryError(
                503,
                'backend_unavailable',
                'Unable to complete this request. Please retry.',
              );
  console.warn(JSON.stringify({ reference, category: mapped.category }));
  return Response.json(
    { error: mapped.message, reference },
    { status: mapped.status, headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function readEnquiryJson(req: Request) {
  if (req.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
    throw new EnquiryError(415, 'content_type', 'Please send JSON.');
  const reader = req.body?.getReader();
  if (!reader) throw new EnquiryError(400, 'invalid_json', 'Missing request body.');
  let size = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 32768) {
        await reader.cancel();
        throw new EnquiryError(413, 'payload_size', 'This request is too large.');
      }
      parts.push(value);
    }
    return JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown;
  } catch (e) {
    if (e instanceof EnquiryError) throw e;
    throw new EnquiryError(400, 'invalid_json', 'Please submit a valid request.');
  }
}
