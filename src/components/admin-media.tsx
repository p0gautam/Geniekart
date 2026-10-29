'use client';
import { useState } from 'react';
type Asset = { id: string; url: string; alt: string };
export function AdminMedia({ initial }: { initial: Asset[] }) {
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function reload() {
    setRows(await fetch('/api/admin/media').then((r) => r.json()));
  }
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    let count = 0;
    try {
      for (const file of data.getAll('file')) {
        const upload = new FormData();
        upload.set('file', file);
        upload.set('alt', String(data.get('alt') || ''));
        const r = await fetch('/api/admin/media/upload', { method: 'POST', body: upload });
        if (!r.ok) throw new Error((await r.json()).error);
        count++;
      }
      form.reset();
      setMessage(
        `${count} image(s) uploaded. Select them in the product/package editor and customize individual alt text below.`,
      );
    } catch (error) {
      setMessage(
        `${count} uploaded. ${error instanceof Error ? error.message : 'Upload failed. Please try again.'}`,
      );
    } finally {
      await reload();
      setBusy(false);
    }
  }
  async function manage(asset: Asset, action: string) {
    const r = await fetch('/api/admin/media/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: asset.id, alt: asset.alt, action }),
    });
    setMessage(r.ok ? 'Saved.' : 'Unable to update/delete. Referenced images cannot be deleted.');
    if (r.ok) await reload();
  }
  return (
    <>
      <div className="admin-panel">
        <h2>Upload an image</h2>
        <p>
          JPEG, PNG or WebP up to 8 MB. Images are optimized to WebP. Replace an image by uploading
          a new version and selecting it in the relevant record.
        </p>
        <form onSubmit={upload}>
          <label>
            Image
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />
          </label>
          <label>
            Alt text
            <input name="alt" required maxLength={500} />
          </label>
          <button className="button" disabled={busy}>
            {busy ? 'Uploading…' : 'Upload image'}
          </button>
        </form>
        {message && <p role="status">{message}</p>}
      </div>
      <div className="admin-media">
        {rows.map((a, i) => (
          <article key={a.id}>
            <img src={a.url} alt={a.alt} loading="lazy" />
            <label>
              Alt text
              <input
                value={a.alt}
                onChange={(e) =>
                  setRows(rows.map((r, j) => (j === i ? { ...r, alt: e.target.value } : r)))
                }
              />
            </label>
            <div className="admin-actions">
              <button className="text-button" onClick={() => manage(a, 'update')}>
                Save alt
              </button>
              <button
                className="text-button"
                onClick={async () => {
                  await navigator.clipboard.writeText(a.url);
                  setMessage('Image URL copied.');
                }}
              >
                Copy URL
              </button>
              <button className="text-button" onClick={() => manage(a, 'delete')}>
                Delete unused
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
