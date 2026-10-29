import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { categories } from '../scripts/catalog-data';
import { defaults } from '../src/lib/data';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  await db.siteSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global', data: defaults },
  });
  for (const [position, [name, slug]] of categories.entries())
    await db.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, position, status: 'PUBLISHED' },
    });
  const heroMedia = await db.product.findFirst({
    where: { sku: 'GK18-16' },
    include: { images: { include: { media: true }, orderBy: { position: 'asc' } } },
  });
  const hero = [
    '',
    heroMedia?.images[0]?.media.alt || 'Approved gift box photograph pending',
    heroMedia?.images[0]?.media.url || '',
  ];
  const page = await db.page.upsert({
    where: { slug: 'home' },
    update: {},
    create: { slug: 'home', title: 'Corporate gifting', status: 'PUBLISHED' },
  });
  if (!(await db.section.count({ where: { pageId: page.id } }))) {
    const sections = [
      {
        kind: 'hero',
        eyebrow: 'Curated Gifting for Modern Teams & CXOs',
        title: 'Corporate gifting',
        description:
          'Tailor-made welcome kits, festive hampers, and thoughtful gifts for the people behind your business.',
        imageUrl: hero?.[2] || '',
        imageAlt: hero?.[1] || 'Corporate gift box',
        ctaLabel: 'Connect with a Specialist',
        cards: [],
      },
      {
        kind: 'benefits',
        eyebrow: 'YOUR GIFTING EXPERIENCE STARTS HERE',
        title: 'Thoughtful gifts. Lasting connections.',
        description:
          'Plan your gifting with a dedicated conversation about your people, occasion and budget.',
        imageUrl: '',
        imageAlt: '',
        ctaLabel: 'Speak to a Gifting Specialist',
        cards: [
          {
            title: 'Made for your brand',
            description: 'Explore personalisation and packaging options.',
            imageUrl: '',
            href: '',
          },
          {
            title: 'Curated for your people',
            description: 'Choose gifts to suit your team and occasion.',
            imageUrl: '',
            href: '',
          },
          {
            title: 'A considered budget',
            description: 'Request a quotation tailored to your quantities.',
            imageUrl: '',
            href: '',
          },
          {
            title: 'Delivery planning',
            description: 'Discuss destinations and timelines with our team.',
            imageUrl: '',
            href: '',
          },
        ],
      },
      {
        kind: 'services',
        eyebrow: 'CORPORATE GIFTING, THOUGHTFULLY PLANNED',
        title: 'What We Offer',
        description: 'From a warm welcome to a festive thank you.',
        imageUrl: '',
        imageAlt: '',
        ctaLabel: 'Enquire Now',
        cards: [
          {
            title: 'Welcome Kits',
            description: 'A thoughtful first day for every new joiner.',
            imageUrl: '',
            href: '',
          },
          {
            title: 'Hampers & Merch',
            description: 'Bring your identity to everyday essentials.',
            imageUrl: '',
            href: '',
          },
          {
            title: 'Festive Gifting',
            description: 'Celebrate shared milestones and traditions.',
            imageUrl: '',
            href: '/corporate-diwali-gifts',
          },
          {
            title: 'Executive Gifts',
            description: 'Considered gifts for valued relationships.',
            imageUrl: '',
            href: '',
          },
          {
            title: 'Custom Packaging',
            description: 'Make the unboxing feel like your brand.',
            imageUrl: '',
            href: '',
          },
        ],
      },
      {
        kind: 'portfolio',
        eyebrow: 'GIFTING INSPIRATION',
        title: 'Make it personal. Make it memorable.',
        description:
          'Explore gifting concepts and talk to us about a box that feels like your brand.',
        imageUrl: hero?.[2] || '',
        imageAlt: 'Reference corporate hamper concept',
        ctaLabel: 'Discuss Your Brief',
        cards: [],
      },
      {
        kind: 'cta',
        eyebrow: 'LET’S CREATE SOMETHING THOUGHTFUL',
        title: 'Your next great gift starts here.',
        description: 'Tell us who you’re celebrating. We’ll help you explore the possibilities.',
        imageUrl: '',
        imageAlt: '',
        ctaLabel: 'Request a Bulk Quote',
        cards: [],
      },
    ];
    for (const [position, s] of sections.entries()) {
      const { kind, ...content } = s;
      await db.section.create({
        data: { pageId: page.id, kind, position, draft: content, published: content },
      });
    }
  }
  for (const [kind, title, description, eyebrow] of [
    [
      'catalog',
      'Categories',
      'Find a thoughtful way to welcome, celebrate and appreciate.',
      'FOR EVERY OCCASION & EVERY TEAM',
    ],
    ['faq', 'Have questions about minimum orders or timelines?', '', 'FREQUENTLY ASKED QUESTIONS'],
    ['reviews', 'What Our Clients Say', 'Verified corporate reviews', ''],
  ]) {
    if (!(await db.section.findFirst({ where: { pageId: page.id, kind } }))) {
      const content = { title, description, eyebrow, cards: [] };
      await db.section.create({
        data: { pageId: page.id, kind, position: 20, draft: content, published: content },
      });
    }
  }
  for (const [slug, title] of [
    ['privacy-policy', 'Privacy Policy'],
    ['terms', 'Terms and Conditions'],
  ])
    await db.page.upsert({ where: { slug }, update: {}, create: { slug, title, status: 'DRAFT' } });
  if (!(await db.navigationItem.count()))
    for (const [position, item] of [
      { label: 'Gift Categories', href: '/corporate-gifts' },
      { label: 'Corporate Gifts', href: '/corporate-gifts' },
      { label: 'Diwali & Hampers', href: '/corporate-diwali-gifts' },
      { label: 'Bulk Order Guide', href: '/#faq' },
      { label: 'Why Geniekart', href: '/#benefits' },
    ].entries())
      await db.navigationItem.create({ data: { ...item, position } });
  if (!(await db.fAQ.count()))
    for (const [position, question] of [
      'What is the minimum order quantity?',
      'Can gifts be customized with our brand?',
      'How do I request a quotation?',
    ].entries())
      await db.fAQ.create({
        data: {
          question,
          answer:
            position === 0
              ? 'Minimum quantities vary by product and customization. Tell us your requirements for a tailored quote.'
              : position === 1
                ? 'Branding and packaging options depend on the selected product. Our team can discuss suitable choices.'
                : 'Select a product or package and submit the enquiry form with your organization, contact details and quantity.',
          position,
          status: 'PUBLISHED',
        },
      });
  console.log(
    'Seeded site content and catalogue categories. Run catalog:replace with a backup to initialise the 18 products.',
  );
}
main().finally(() => db.$disconnect());
