import { LegalPage } from '@/components/legal';
export const metadata = { title: 'Privacy Policy' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  return (
    <LegalPage slug="privacy-policy" previewRequested={(await searchParams).preview === '1'} />
  );
}
