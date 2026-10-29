import { authorize, assertOrigin, apiError } from '@/lib/auth';
import { editorResources, listResource, saveResource } from '@/lib/admin';
import { Role } from '@prisma/client';
const roles = (r: string): Role[] =>
  r === 'leads'
    ? ['SUPER_ADMIN', 'SALES']
    : r === 'settings' || r === 'users'
      ? ['SUPER_ADMIN']
      : editorResources.includes(r)
        ? ['SUPER_ADMIN', 'EDITOR']
        : [];
export async function GET(_: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params;
    await authorize(roles(resource));
    return Response.json(await listResource(resource));
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    await assertOrigin(req);
    const { resource } = await params;
    const user = await authorize(roles(resource));
    const { id, data } = await req.json();
    return Response.json(
      await saveResource(resource, data, typeof id === 'string' ? id : undefined, user.id),
    );
  } catch (e) {
    return apiError(e);
  }
}
