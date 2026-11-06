'use client';

const bundledLogo = '/images/brand/geniekart-mark.webp';
const originalUpload = '/media/e47287a1-1809-458c-b411-f0f143652745.webp';

export function BrandLogo({ src }: { src?: string | null }) {
  // The original upload existed only on the development machine.
  const logo = !src || src === originalUpload ? bundledLogo : src;
  return (
    <img
      src={logo}
      alt=""
      onError={(event) => {
        if (event.currentTarget.getAttribute('src') !== bundledLogo) {
          event.currentTarget.src = bundledLogo;
        }
      }}
    />
  );
}
