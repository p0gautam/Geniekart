'use client';
import { useState } from 'react';
import { configs, sectionFields, Field } from '@/lib/editor-config';
type Row = Record<string, unknown>;
type Sources = Record<string, Row[]>;
function Fields({
  fields,
  value,
  onChange,
  sources,
}: {
  fields: Field[];
  value: Row;
  onChange: (next: Row) => void;
  sources: Sources;
}) {
  return (
    <>
      {fields.map((field) => {
        const val = value[field.key];
        const change = (v: unknown) => onChange({ ...value, [field.key]: v });
        if (field.type === 'checkbox')
          return (
            <label className="check" key={field.key}>
              <input
                type="checkbox"
                checked={Boolean(val)}
                onChange={(e) => change(e.target.checked)}
              />
              {field.label}
            </label>
          );
        if (field.type === 'media' || field.type === 'multi') {
          const rows = sources[field.type === 'media' ? 'media' : field.source!] || [];
          const ids = Array.isArray(val) ? (val as string[]) : [];
          return (
            <fieldset key={field.key} className="admin-panel">
              <legend>{field.label}</legend>
              <div style={{ maxHeight: 240, overflow: 'auto' }}>
                {rows.map((row) => (
                  <label className="check" key={String(row.id)}>
                    <input
                      type="checkbox"
                      checked={ids.includes(String(row.id))}
                      onChange={(e) =>
                        change(
                          e.target.checked
                            ? [...ids, String(row.id)]
                            : ids.filter((x) => x !== row.id),
                        )
                      }
                    />
                    {field.type === 'media' && (
                      <img
                        src={String(row.url)}
                        alt=""
                        style={{ width: 48, height: 48, objectFit: 'cover' }}
                      />
                    )}
                    {String(row.name || row.alt || row.id)}{' '}
                    {ids.includes(String(row.id)) && (
                      <span>#{ids.indexOf(String(row.id)) + 1}</span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        }
        if (field.type === 'repeater') {
          const rows = (Array.isArray(val) ? val : []) as Row[];
          return (
            <fieldset key={field.key} className="admin-panel">
              <legend>{field.label}</legend>
              {rows.map((row, i) => (
                <div className="admin-panel" key={i}>
                  <Fields
                    fields={field.fields || []}
                    value={row}
                    sources={sources}
                    onChange={(v) => change(rows.map((r, j) => (i === j ? v : r)))}
                  />
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => change(rows.filter((_, j) => i !== j))}
                  >
                    Remove row
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="button lavender"
                onClick={() => change([...rows, empty(field.fields || [])])}
              >
                Add row
              </button>
            </fieldset>
          );
        }
        return (
          <label key={field.key}>
            {field.label}
            {field.type === 'textarea' ? (
              <textarea value={String(val ?? '')} onChange={(e) => change(e.target.value)} />
            ) : field.type === 'select' ? (
              <select value={String(val ?? '')} onChange={(e) => change(e.target.value || null)}>
                <option value="">Select…</option>
                {field.options?.map((x) => (
                  <option key={x}>{x}</option>
                ))}
                {field.source &&
                  (sources[field.source] || []).map((x) => (
                    <option key={String(x.id)} value={String(x.id)}>
                      {String(x.name || x.title || x.label || x.alt || x.slug || x.id)}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                required={field.required}
                type={field.type === 'number' ? 'number' : 'text'}
                step={field.key === 'price' ? '0.01' : '1'}
                value={
                  field.type === 'list'
                    ? Array.isArray(val)
                      ? val.join(', ')
                      : String(val ?? '')
                    : String(val ?? '')
                }
                onChange={(e) =>
                  change(
                    field.type === 'number'
                      ? e.target.value === ''
                        ? null
                        : Number(e.target.value)
                      : field.type === 'list'
                        ? e.target.value.split(',').map((s) => s.trim())
                        : e.target.value,
                  )
                }
              />
            )}
          </label>
        );
      })}
    </>
  );
}
function empty(fields: Field[]): Row {
  return Object.fromEntries(
    fields.map((f) => [
      f.key,
      f.type === 'checkbox'
        ? f.key === 'enquiryEnabled'
        : ['media', 'multi', 'repeater', 'list'].includes(f.type || '')
          ? []
          : f.key === 'status'
            ? 'DRAFT'
            : f.key === 'position'
              ? 0
              : f.key === 'quantity'
                ? 1
                : f.type === 'number'
                  ? null
                  : f.type === 'select'
                    ? f.options?.[0] || null
                    : '',
    ]),
  );
}
function normalize(resource: string, row: Row): Row {
  if (resource === 'settings') return row.data as Row;
  return {
    ...row,
    price: row.price === null ? null : row.price !== undefined ? Number(row.price) : undefined,
    mediaIds: Array.isArray(row.images) ? (row.images as Row[]).map((x) => x.mediaId) : [],
    collectionIds: Array.isArray(row.collections)
      ? (row.collections as Row[]).map((x) => x.collectionId)
      : [],
  };
}
export function AdminEditor({
  resource,
  initialRows,
  sources,
}: {
  resource: string;
  initialRows: Row[];
  sources: Sources;
}) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<Row | null>(
    resource === 'settings' ? normalize(resource, rows[0] || {}) : null,
  );
  const [id, setId] = useState<string | undefined>(resource === 'settings' ? 'global' : undefined);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const fields = configs[resource] || [];
  function edit(row: Row) {
    setId(String(row.id));
    setEditing(normalize(resource, row));
    setMessage('');
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const data = { ...editing };
      for (const f of fields) {
        if (f.type === 'list') data[f.key] = (data[f.key] as string[]).filter(Boolean);
      }
      const r = await fetch('/api/admin/' + resource, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      const updated = await fetch('/api/admin/' + resource).then((r) => r.json());
      setRows(updated);
      setMessage('Saved successfully.');
      if (resource !== 'settings') setEditing(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  }
  if (editing)
    return (
      <div className="admin-panel admin-edit">
        <div className="admin-top">
          <h2>
            {id ? 'Edit' : 'Create'} {resource}
          </h2>
          {resource !== 'settings' && (
            <button className="text-button" onClick={() => setEditing(null)}>
              ← Back to list
            </button>
          )}
        </div>
        <form onSubmit={save}>
          <Fields fields={fields} value={editing} onChange={setEditing} sources={sources} />
          {resource === 'sections' && (
            <>
              <h3>Draft content</h3>
              <Fields
                fields={sectionFields}
                value={(editing.draft || empty(sectionFields)) as Row}
                onChange={(draft) => setEditing({ ...editing, draft })}
                sources={sources}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(editing.publish)}
                  onChange={(e) => setEditing({ ...editing, publish: e.target.checked })}
                />
                Publish this version now (otherwise save draft only)
              </label>
            </>
          )}
          <div className="admin-actions">
            <button className="button" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            {id && ['products', 'packages'].includes(resource) && (
              <a
                className="button outline"
                href={`/${resource}/${editing.slug}?preview=1`}
                target="_blank"
                rel="noreferrer"
              >
                Preview ↗
              </a>
            )}
            {resource === 'sections' && (
              <a className="button outline" href="/?preview=1" target="_blank" rel="noreferrer">
                Preview homepage ↗
              </a>
            )}
          </div>
          {message && <p role="status">{message}</p>}
        </form>
      </div>
    );
  const filtered = rows.filter(
    (r) =>
      JSON.stringify([r.name, r.title, r.question, r.label, r.slug, r.sku])
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status || r.status === status),
  );
  return (
    <div className="admin-panel">
      <div className="admin-tools">
        <input
          aria-label="Search records"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button
          className="button"
          onClick={() => {
            setId(undefined);
            setEditing({
              ...empty(fields),
              ...(resource === 'sections' ? { draft: empty(sectionFields), publish: false } : {}),
            });
            setMessage('');
          }}
        >
          Add {resource === 'products' ? 'product' : 'new'}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status / type</th>
              <th>Order</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={String(row.id)}>
                <td>
                  {String(row.name || row.title || row.question || row.label || row.kind || row.id)}
                  <small style={{ display: 'block', color: '#999' }}>
                    {String(row.slug || '')}
                  </small>
                </td>
                <td>
                  <span className="status">
                    {String(row.status || row.kind || row.location || '—')}
                  </span>
                </td>
                <td>{String(row.position ?? '—')}</td>
                <td>
                  <button onClick={() => edit(row)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p>No records match.</p>}
      </div>
    </div>
  );
}
