import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { Logout } from '@/components/admin-session';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  const editorial = [
    'products',
    'packages',
    'categories',
    'collections',
    'pages',
    'sections',
    'navigation',
    'faqs',
    'testimonials',
    'portfolio',
    'media',
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="brand">
          Geniekart
        </Link>
        <nav>
          <Link href="/admin">Overview</Link>
          {user.role !== 'EDITOR' && <Link href="/admin/leads">Enquiries</Link>}
          {user.role !== 'SALES' &&
            editorial.map((r) => (
              <Link key={r} href={'/admin/' + r}>
                {r[0].toUpperCase() + r.slice(1)}
              </Link>
            ))}
          {user.role === 'SUPER_ADMIN' && (
            <>
              <Link href="/admin/settings">Global settings</Link>
              <Link href="/admin/users">Staff & roles</Link>
            </>
          )}
          <Link href="/" target="_blank">
            View website ↗
          </Link>
          <Link href="/?preview=1" target="_blank">
            Draft preview ↗
          </Link>
        </nav>
        <small>
          {user.name}
          <br />
          {user.role}
        </small>
        <Logout />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
