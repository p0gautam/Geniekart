export const categories = [
  ['Drinkware', 'drinkware'],
  ['Diaries & Notebooks', 'diaries-notebooks'],
  ['Premium Pens', 'premium-pens'],
  ['Wooden Gifts', 'wooden-gifts'],
  ['Desk Accessories', 'desk-accessories'],
  ['Bags & Laptop Accessories', 'bags-laptop-accessories'],
  ['Keychains', 'keychains'],
  ['Corporate Gift Combos', 'corporate-gift-combos'],
] as const;
export const customisationOptions = [
  'Company Logo Printing',
  'Personalised Gift Packaging',
  'Custom Branding',
  'Colour Preferences',
  'Bulk Corporate Orders',
];
export const products = [
  [
    'Vacuum Insulated Stainless Steel Bottle',
    0,
    'A practical drinkware choice for office routines, travel and corporate gifting. Discuss the finish, branding and packaging that suit your brief. Insulation performance and capacity will be confirmed with the quotation.',
  ],
  [
    'LED Temperature Display Bottle',
    0,
    'A bottle with a temperature-display concept for a distinctive everyday business gift. Display features, power requirements, capacity and care instructions will be confirmed before ordering.',
  ],
  [
    'Premium Ceramic Coffee Mug',
    0,
    'A ceramic coffee mug for workplace refreshment breaks, welcome gifts and client appreciation. Enquire about the available shape, finish and artwork placement for your gifting programme.',
  ],
  [
    'A5 PU Leather Executive Diary',
    1,
    'An A5 diary with a PU leather-style cover for meeting notes and everyday planning. Enquire about cover choices, page layout and branding. Paper details and finishing will be confirmed in your proposal.',
  ],
  [
    'Magnetic Closure Premium Diary',
    1,
    'A diary with a magnetic-closure design for keeping work notes together. A thoughtful option for onboarding or business appreciation; available cover, page and personalisation choices are confirmed on enquiry.',
  ],
  [
    'Undated Executive Planner',
    1,
    'An undated planner for organising priorities without a fixed calendar-year start. Discuss the planning layout, cover and branding preferences that best suit your team.',
  ],
  [
    'Premium Metal Rollerball Pen',
    2,
    'A metal rollerball pen for meeting rooms, executive desks and client gifting. Enquire about finish, writing details, personalisation and presentation options.',
  ],
  [
    'Executive Pen Gift Set',
    2,
    'A writing-focused gift set for professional occasions and employee recognition. The number of writing instruments, pen styles and presentation contents will be agreed in the quotation.',
  ],
  [
    'Wooden Desk Organiser',
    3,
    'A wooden desk organiser for arranging everyday workspace essentials. Enquire about the compartment layout, finish and branding preferences; materials and dimensions will be confirmed before ordering.',
  ],
  [
    'Wooden Perpetual Calendar',
    3,
    'A reusable desk-calendar format with adjustable date elements and a wooden presentation. Discuss the design, finish and branding preferences for an office or client gift.',
  ],
  [
    'Digital Desk Clock',
    4,
    'A digital clock for keeping time visible at a workstation or reception desk. Display functions, power source and dimensions will be confirmed as part of your quotation.',
  ],
  [
    'Wireless Charging Desk Pad',
    4,
    'A desk-pad format combining a workspace surface with wireless charging. Charging compatibility, power requirements and available branding areas must be confirmed for the selected model.',
  ],
  [
    'Premium Laptop Backpack',
    5,
    'A laptop backpack for work commutes, employee onboarding and corporate events. Share your preferred laptop fit, compartments and branding needs; capacity, materials and dimensions will be confirmed in the proposal.',
  ],
  [
    'Premium Metal & Leather Keychain',
    6,
    'A keychain combining metal and leather-style elements for a compact corporate gift. Material composition, finish and personalisation choices will be confirmed in your quotation.',
  ],
  [
    'Premium Diwali Corporate Gift Hamper',
    7,
    'A thoughtfully curated festive gifting collection bringing together useful everyday essentials in a corporate presentation box. The predefined selection pairs an executive diary, metal pen, water bottle and keychain for employees and business partners.',
  ],
  [
    'Executive Corporate Gift Box',
    7,
    'A coordinated corporate gift box with an executive diary, rollerball pen, wooden desk organiser and stainless steel bottle. Designed as a practical business gifting brief with presentation and branding preferences agreed during quotation.',
  ],
  [
    'Employee Welcome Gift Kit',
    7,
    'A predefined welcome kit bringing together a laptop backpack, diary, pen, bottle and keychain with a branded welcome-box brief. A cohesive starting point for introducing new colleagues to your organisation.',
  ],
  [
    'Premium Desk Essentials Gift Set',
    7,
    'A workspace-focused gift set combining a wooden desk organiser, perpetual calendar, digital desk clock and metal pen in a presentation box. Discuss finishing and branding to align the set with your business occasion.',
  ],
] as const;
// Component references use zero-based indices into the 14 individual listings.
export const combos: Record<number, { index?: number; name: string; description: string }[]> = {
  14: [
    {
      index: 3,
      name: 'A5 Executive Diary',
      description: 'A diary for notes and day-to-day planning.',
    },
    {
      index: 6,
      name: 'Premium Metal Pen',
      description: 'A writing instrument for everyday professional use.',
    },
    {
      index: 0,
      name: 'Stainless Steel Water Bottle',
      description: 'A drinkware component for work and travel.',
    },
    { index: 13, name: 'Premium Keychain', description: 'A compact accessory for everyday keys.' },
    {
      name: 'Customised Corporate Gift Box',
      description: 'Presentation packaging with artwork preferences agreed on enquiry.',
    },
  ],
  15: [
    {
      index: 3,
      name: 'Premium Executive Diary',
      description: 'An executive diary for meetings and notes.',
    },
    {
      index: 6,
      name: 'Metal Rollerball Pen',
      description: 'A metal writing instrument for business use.',
    },
    {
      index: 8,
      name: 'Wooden Desk Organiser',
      description: 'A desk accessory for workspace essentials.',
    },
    { index: 0, name: 'Stainless Steel Bottle', description: 'An everyday drinkware component.' },
    {
      name: 'Premium Gift Packaging',
      description: 'Gift presentation with the finish agreed in your quotation.',
    },
  ],
  16: [
    {
      index: 12,
      name: 'Premium Laptop Backpack',
      description: 'A work bag with fit and compartments confirmed on enquiry.',
    },
    {
      index: 3,
      name: 'Executive Diary',
      description: 'A diary for a new colleague’s notes and planning.',
    },
    { index: 6, name: 'Metal Pen', description: 'A practical writing accessory for daily work.' },
    {
      index: 0,
      name: 'Stainless Steel Bottle',
      description: 'Drinkware for the office and commute.',
    },
    { index: 13, name: 'Premium Keychain', description: 'An everyday carry accessory.' },
    {
      name: 'Branded Welcome Box',
      description: 'A welcome-box presentation with branding subject to approval.',
    },
  ],
  17: [
    {
      index: 8,
      name: 'Wooden Desk Organiser',
      description: 'An organiser for everyday desk essentials.',
    },
    {
      index: 9,
      name: 'Wooden Perpetual Calendar',
      description: 'An adjustable calendar for a workstation.',
    },
    {
      index: 10,
      name: 'Digital Desk Clock',
      description: 'A time-display accessory for the desk.',
    },
    { index: 6, name: 'Premium Metal Pen', description: 'A professional writing accessory.' },
    {
      name: 'Premium Presentation Box',
      description: 'Presentation packaging for the coordinated desk set.',
    },
  ],
};
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
