import { PublicLayout } from '@/components/layout';
import { settings } from '@/lib/data';
import Script from 'next/script';
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const s = await settings();
  return (
    <>
      <PublicLayout>{children}</PublicLayout>
      {(s.gaId || s.gtmId) && (
        <Script id="tracking-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());`}
        </Script>
      )}
      {s.gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${s.gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga"
            strategy="afterInteractive"
          >{`window.gtag('config','${s.gaId}',{send_page_view:false});`}</Script>
        </>
      )}
      {s.gtmId && (
        <Script
          id="gtm"
          strategy="afterInteractive"
        >{`window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id=${s.gtmId}';document.head.appendChild(s);`}</Script>
      )}
    </>
  );
}
