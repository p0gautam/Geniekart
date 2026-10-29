import { LegalPage } from '@/components/legal';
export const metadata = { title: 'Terms and Conditions' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  return <LegalPage slug="terms" previewRequested={(await searchParams).preview === '1'} />;
}
