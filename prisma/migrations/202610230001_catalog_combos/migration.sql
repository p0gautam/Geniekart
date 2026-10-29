ALTER TABLE "Product"
  ADD COLUMN "productType" TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN "variants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "customisationOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "enquiryEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "includedProducts" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "packagingDetails" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD CONSTRAINT "Product_productType_check" CHECK ("productType" IN ('individual', 'combo'));
