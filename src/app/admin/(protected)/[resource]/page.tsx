import { notFound } from 'next/navigation';
import { authorize } from '@/lib/auth';
import { listResource, editorResources } from '@/lib/admin';
import { db } from '@/lib/db';
import { AdminEditor } from '@/components/admin-editor';
import { AdminLeads } from '@/components/admin-leads';
import { AdminMedia } from '@/components/admin-media';
import { AdminUsers } from '@/components/admin-users';
export default async function Page({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (![...editorResources, 'leads', 'settings', 'users'].includes(resource)) notFound();
  const user = await authorize();
  if (
    (resource === 'leads' && user.role === 'EDITOR') ||
    (['settings', 'users'].includes(resource) && user.role !== 'SUPER_ADMIN') ||
    (editorResources.includes(resource) && user.role === 'SALES')
  )
    return (
      <div className="admin-panel">
        <h1>Access restricted</h1>
        <p>Your role does not have permission to manage this section.</p>
      </div>
    );
  if (resource === 'leads')
    return (
      <>
        <div className="admin-top">
          <div>
            <span className="eyebrow">GENIEKART ADMIN</span>
            <h1>Enquiries</h1>
          </div>
        </div>
        <AdminLeads />
      </>
    );
  const rows = JSON.parse(JSON.stringify(await listResource(resource)));
  const [categories, collections, media, products, pages, navigation] =
    user.role !== 'SALES'
      ? await Promise.all([
          db.category.findMany(),
          db.collection.findMany(),
          db.mediaAsset.findMany(),
          db.product.findMany({ select: { id: true, name: true } }),
          db.page.findMany(),
          db.navigationItem.findMany(),
        ])
      : [[], [], [], [], [], []];
  const sources = JSON.parse(
    JSON.stringify({ categories, collections, media, products, pages, navigation }),
  );
  return (
    <>
      <div className="admin-top">
        <div>
          <span className="eyebrow">GENIEKART ADMIN</span>
          <h1>{resource === 'sections' ? 'Page content' : resource}</h1>
        </div>
      </div>
      {resource === 'media' ? (
        <AdminMedia initial={rows} />
      ) : resource === 'users' ? (
        <AdminUsers initial={rows} />
      ) : (
        <AdminEditor resource={resource} initialRows={rows} sources={sources} />
      )}
    </>
  );
}
