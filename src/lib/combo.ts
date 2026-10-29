import { z } from 'zod';
import { includedProductSchema } from './validation';
export type IncludedProduct = z.infer<typeof includedProductSchema>;
export function comboContents(value: unknown): IncludedProduct[] {
  const result = z.array(includedProductSchema).safeParse(value);
  return result.success ? result.data : [];
}
