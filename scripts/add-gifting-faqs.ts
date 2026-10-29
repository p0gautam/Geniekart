import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';

loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const additions = [
    {
      question: 'How far in advance should I place my order?',
      answer:
        'Lead times depend on the products, quantity, customisation and delivery locations. Share your required delivery date when enquiring so our team can confirm a suitable schedule. For festive or large-volume orders, enquire early to allow time for planning and approvals.',
    },
    {
      question: 'Can you suggest gifts within my budget?',
      answer:
        'Share your budget per recipient, number of recipients and occasion in the enquiry form. Our team can discuss suitable product and packaging options and provide a quotation for your requirements.',
    },
    {
      question: 'Can gifts be delivered to multiple addresses?',
      answer:
        'Include the number of delivery locations and destination cities in your enquiry. Our team will confirm whether a multi-address delivery arrangement is available for your order, along with the applicable charges and timelines.',
    },
  ];
  const highest = await db.fAQ.aggregate({ _max: { position: true } });
  let position = (highest._max.position ?? -1) + 1;
  let added = 0;
  for (const item of additions) {
    if (await db.fAQ.findFirst({ where: { question: item.question } })) continue;
    await db.fAQ.create({ data: { ...item, status: 'PUBLISHED', position: position++ } });
    added++;
  }
  console.log({ added, published: await db.fAQ.count({ where: { status: 'PUBLISHED' } }) });
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
