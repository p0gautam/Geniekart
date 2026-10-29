import Link from 'next/link';
import { db } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { AdminLeads } from '@/components/admin-leads';
export default async function Dashboard() {
  const user = await authorize();
  const [total, published, packages, categories] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: 'PUBLISHED' } }),
    db.giftPackage.count(),
    db.category.count(),
  ]);
  return (
    <>
      <div className="admin-top">
        <div>
          <span className="eyebrow">YOUR GIFTING BUSINESS</span>
          <h1>Overview</h1>
        </div>
        <Link className="button outline" href="/" target="_blank">
          View website ↗
        </Link>
      </div>
      <div className="admin-stats">
        {[
          ['Total products', total],
          ['Published products', published],
          ['Gift packages', packages],
          ['Categories', categories],
        ].map(([label, count]) => (
          <div className="stat" key={label}>
            <strong>{count}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {user.role !== 'EDITOR' && <AdminLeads overview />}
      <div className="admin-panel">
        <h2>Publishing checklist</h2>
        <p>
          Review products, image rights, specifications, company contact details and policies before
          launch.
        </p>
      </div>
    </>
  );
}
