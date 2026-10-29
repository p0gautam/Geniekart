import { db } from '@/lib/db';
import { pageSections } from '@/lib/data';
import { currentUser } from '@/lib/auth';
import { LegalContent } from './legal-content';
export async function LegalPage({
  slug,
  previewRequested,
}: {
  slug: string;
  previewRequested: boolean;
}) {
  const preview = previewRequested && Boolean(await currentUser());
  const page = await db.page.findUnique({ where: { slug } });
  const sections = await pageSections(slug, preview);
  return (
    <div className="container prose legal-page">
      {preview && <div className="preview-banner">Admin content preview</div>}
      <h1>{page?.title || slug}</h1>
      {sections.length ? (
        sections.map((s) => (
          <section key={s.id}>
            {s.content.title && <h2>{s.content.title}</h2>}
            <LegalContent text={s.content.description || ''} />
          </section>
        ))
      ) : (
        <p>
          This policy is awaiting publication by Geniekart. Please contact the business for the
          applicable terms before sharing personal information.
        </p>
      )}
    </div>
  );
}
