import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { Login } from '@/components/admin-session';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };
export default async function Page() {
  if (await currentUser()) redirect('/admin');
  return (
    <div className="login-page">
      <div className="login-panel">
        <Link className="brand" href="/">
          Geniekart
        </Link>
        <h1 style={{ marginTop: 30 }}>Welcome back.</h1>
        <p>Sign in to manage your gifting business.</p>
        <Login />
        <p style={{ fontSize: 10, marginTop: 24, marginBottom: 0 }}>
          Authorized staff only. Customers can enquire without an account.
        </p>
      </div>
    </div>
  );
}
