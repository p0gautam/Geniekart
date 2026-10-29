import { EnquiryForm } from '@/components/enquiry';
import { settings } from '@/lib/data';
export const metadata = { title: 'Contact', alternates: { canonical: '/contact' } };
export default async function Page() {
  const s = await settings();
  return (
    <div className="container contact-grid">
      <div>
        <span className="eyebrow">WE’D LOVE TO HEAR YOUR BRIEF</span>
        <h1>Let’s make gifting meaningful.</h1>
        <p>
          Tell us about your people, occasion and quantity. We’ll help you explore the right gifts.
        </p>
        {s.email && (
          <p>
            <a href={'mailto:' + s.email}>{s.email}</a>
          </p>
        )}
        {s.phone && (
          <p>
            <a href={'tel:' + s.phone}>{s.phone}</a>
          </p>
        )}
        <p>{s.address}</p>
      </div>
      <div className="quote-panel">
        <h2>Connect with a Specialist</h2>
        <EnquiryForm />
      </div>
    </div>
  );
}
