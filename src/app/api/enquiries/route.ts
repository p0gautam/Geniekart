import { db } from '@/lib/db';
import { leadSchema } from '@/lib/validation';
import { assertOrigin, hash } from '@/lib/auth';
import { supabaseRequest, readEnquiryJson, enquiryFailure } from '@/lib/supabase-enquiries';
import { notifyLead } from '@/lib/notifications';
import { after } from 'next/server';
import { comboContents } from '@/lib/combo';
export async function POST(req: Request) {
  try {
    await assertOrigin(req);
    const result = leadSchema.safeParse(await readEnquiryJson(req));
    if (!result.success)
      return Response.json(
        {
          error: 'Please check your contact details, quantity and consent.',
          fields: result.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    const {
      requestId,
      consent,
      website,
      productId,
      packageId,
      customisationRequirements,
      packagingPreferences,
      comboName,
      selectedOccasion,
      ...data
    } = result.data;
    void website;
    void comboName; // Use the authoritative database name snapshot.
    const prior = await supabaseRequest<{ id: string }[]>(
      `enquiries?submission_id=eq.${requestId}&select=id`,
      undefined,
      'GET',
    );
    if (prior.length) return Response.json({ ok: true });
    const product = productId
      ? await db.product.findFirst({
          where: { id: productId, status: 'PUBLISHED', productType: 'combo', enquiryEnabled: true },
        })
      : null;
    const pack = packageId
      ? await db.giftPackage.findFirst({ where: { id: packageId, status: 'PUBLISHED' } })
      : null;
    if ((productId && !product) || (packageId && !pack))
      return Response.json(
        { error: 'This item is no longer available. Please submit a general enquiry.' },
        { status: 422 },
      );
    const ip =
      process.env.TRUST_PROXY === 'true'
        ? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        : 'shared';
    const lead = await supabaseRequest<{ id: string; duplicate: boolean; limited?: boolean }>(
      'rpc/geniekart_receive',
      {
        p_rate_key: 'enquiry:' + hash(ip),
        p_data: {
          ...data,
          consent,
          message: [
            data.message,
            selectedOccasion && `Collection context: ${selectedOccasion}`,
            customisationRequirements && `Customisation requirements: ${customisationRequirements}`,
            packagingPreferences && `Packaging preferences: ${packagingPreferences}`,
            product?.productType === 'combo' &&
              `Selected gift hamper: ${product.name}\nIncluded products:\n${comboContents(
                product.includedProducts,
              )
                .map((c) => `${c.quantity} × ${c.displayName}`)
                .join('\n')}`,
          ]
            .filter(Boolean)
            .join('\n\n'),
          submission_id: requestId,
          source_page: data.source,
          occasion: data.occasion || selectedOccasion || null,
          selected_combo_id: product?.id || pack?.id || null,
          selected_combo_name: product?.name || pack?.name || null,
        },
      },
    );
    if (lead.limited)
      return Response.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 },
      );
    if (!lead.duplicate)
      after(async () => {
        try {
          await notifyLead(lead.id);
        } catch {
          console.warn('enquiry_notification_failed');
        }
      });
    return Response.json({ ok: true }, { status: lead.duplicate ? 200 : 201 });
  } catch (e) {
    return enquiryFailure(e);
  }
}
