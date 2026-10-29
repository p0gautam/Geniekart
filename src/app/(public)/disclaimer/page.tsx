import { LegalPage } from '@/components/legal';

export const metadata = { title: 'Disclaimer' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  return <LegalPage slug="disclaimer" previewRequested={(await searchParams).preview === '1'} />;
}
