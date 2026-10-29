'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  enquiryStatuses,
  type Enquiry,
  type EnquiryList,
  type EnquiryStatus,
} from '@/lib/enquiry-types';
const emptyFilters = { search: '', status: '', occasion: '', from: '', to: '' };
const time = (value: string) => new Date(value).toLocaleString();
export function AdminLeads({ overview = false }: { overview?: boolean }) {
  const [filters, setFilters] = useState(emptyFilters),
    [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1),
    [version, setVersion] = useState(0);
  const [data, setData] = useState<EnquiryList | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [id, setId] = useState(''),
    [lead, setLead] = useState<Enquiry | null>(null);
  const [status, setStatus] = useState<EnquiryStatus>('New');
  const [note, setNote] = useState(''),
    [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''),
    [updated, setUpdated] = useState('');
  const operation = useRef(''),
    dirty = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    let active = true,
      fetching = false;
    async function refresh() {
      if (fetching || busy) return;
      fetching = true;
      try {
        const query = id
          ? new URLSearchParams({ id })
          : new URLSearchParams({ ...applied, page: String(page) });
        const response = await fetch('/api/admin/leads?' + query, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || 'Unable to load enquiries.');
        if (!active) return;
        if (id) {
          setLead(result);
          if (!dirty.current) setStatus(result.status);
        } else {
          setData(result);
          if (page > 1 && !result.rows.length) setPage(Math.max(1, Math.ceil(result.total / 20)));
        }
        setError('');
        setUpdated(new Date().toLocaleTimeString());
      } catch (e) {
        if (active && !controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Unable to load enquiries.');
      } finally {
        if (active) setLoading(false);
        fetching = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 15000),
      reconnect = () => void refresh();
    window.addEventListener('online', reconnect);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('online', reconnect);
    };
  }, [applied, page, version, id, busy]);
  async function save() {
    if (!lead || busy) return;
    setBusy(true);
    setMessage('');
    operation.current ||= crypto.randomUUID();
    try {
      const r = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          operationId: operation.current,
          data: { status, note },
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || 'Unable to save.');
      setLead(result);
      setNote('');
      setStatus(result.status);
      dirty.current = false;
      operation.current = '';
      setMessage('Changes saved to Supabase.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  function open(item: Enquiry) {
    setLead(null);
    setId(item.id);
    setStatus(item.status);
    setNote('');
    setMessage('');
    operation.current = '';
    dirty.current = false;
  }
  const refreshBar = (
    <div className="admin-tools">
      <button className="button outline" onClick={() => setVersion((v) => v + 1)} disabled={busy}>
        Refresh
      </button>
      <small>
        Refreshes every 15 seconds{updated ? ` · Last checked ${updated}` : ''}. Date filters use
        UTC.
      </small>
    </div>
  );
  const feedback = (
    <>
      {loading && <p role="status">Loading enquiries…</p>}
      {error && (
        <p role="alert" className="error">
          {error} <button onClick={() => setVersion((v) => v + 1)}>Retry</button>
        </p>
      )}
    </>
  );
  if (id)
    return (
      <div className="admin-panel">
        <button
          className="text-button"
          onClick={() => {
            setId('');
            setLead(null);
            setMessage('');
          }}
        >
          ← All enquiries
        </button>
        {refreshBar}
        {feedback}
        {lead && (
          <>
            <h2>{lead.company}</h2>
            <div className="lead-details">
              <div>
                <p>
                  <strong>{lead.name}</strong>
                  <br />
                  <a href={'mailto:' + lead.email}>{lead.email}</a>
                  <br />
                  <a href={'tel:' + lead.phone}>{lead.phone}</a>
                </p>
                <dl className="spec-list">
                  {Object.entries({
                    Quantity: lead.quantity,
                    City: lead.city,
                    Budget: lead.budget,
                    Occasion: lead.occasion,
                    'Selected combo': lead.selected_combo_name,
                    'Combo ID': lead.selected_combo_id,
                    Source: lead.source_page,
                    Submitted: time(lead.created_at),
                    Updated: time(lead.updated_at),
                    Consent: lead.consent ? 'Yes' : 'No',
                    'Consent recorded': time(lead.consent_at),
                    'Submission ID': lead.submission_id,
                    ...(lead.legacy_status ? { 'Original legacy status': lead.legacy_status } : {}),
                  }).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
                <h3>Requirements</h3>
                <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {lead.message || 'No additional requirements.'}
                </p>
                <h3>Attribution</h3>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(lead.utm, null, 2)}</pre>
                <p>
                  Email notification:{' '}
                  {lead.notification?.sent_at
                    ? 'Sent'
                    : lead.notification?.last_error || 'Pending / not configured'}
                </p>
              </div>
              <div>
                <label>
                  Enquiry status
                  <select
                    value={status}
                    disabled={busy}
                    onChange={(e) => {
                      setStatus(e.target.value as EnquiryStatus);
                      dirty.current = true;
                      operation.current = '';
                    }}
                  >
                    {enquiryStatuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Internal follow-up note
                  <textarea
                    maxLength={5000}
                    value={note}
                    disabled={busy}
                    onChange={(e) => {
                      setNote(e.target.value);
                      operation.current = '';
                    }}
                  />
                </label>
                <button className="button" onClick={() => void save()} disabled={busy}>
                  {busy ? 'Saving…' : 'Save enquiry'}
                </button>
                {message && <p role="status">{message}</p>}
                <h3 style={{ marginTop: 30 }}>Activity & follow-up history</h3>
                {lead.activity?.map((a) => (
                  <div className="admin-panel" key={a.id}>
                    <strong>
                      {a.kind === 'received'
                        ? 'Enquiry received'
                        : a.kind === 'status_changed'
                          ? `${a.previous_status} → ${a.new_status}`
                          : a.kind === 'note_added'
                            ? 'Internal note'
                            : 'Imported enquiry'}
                    </strong>
                    {a.note && (
                      <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.note}</p>
                    )}
                    {a.kind === 'received' && (
                      <p>
                        {a.source_page} · {a.selected_combo_name || 'General enquiry'}
                      </p>
                    )}
                    <small>
                      {a.actor_name || 'Website'} · {time(a.created_at)}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  return (
    <div className="admin-panel">
      {overview && <h2>Enquiries</h2>}
      {refreshBar}
      {feedback}
      {!overview && (
        <form
          className="admin-tools"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setApplied({ ...filters });
          }}
        >
          <input
            aria-label="Search enquiries"
            placeholder="Name, company, email or phone"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            aria-label="Filter status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            {enquiryStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Filter occasion"
            value={filters.occasion}
            onChange={(e) => setFilters({ ...filters, occasion: e.target.value })}
          >
            <option value="">All occasions</option>
            {data?.occasions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <label>
            From (UTC)
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </label>
          <label>
            To (UTC)
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </label>
          <button className="button">Apply filters</button>
          <button
            type="button"
            onClick={() => {
              setFilters(emptyFilters);
              setApplied(emptyFilters);
              setPage(1);
            }}
          >
            Clear
          </button>
          <a href="/api/admin/leads/export" download>
            Export all CSV
          </a>
        </form>
      )}
      {data && (
        <>
          <p>
            Counts{' '}
            {overview ? 'cover all enquiries' : 'reflect all active filters, across all pages'}.
          </p>
          <div className="admin-stats">
            {Object.entries({ Total: data.total, ...data.counts }).map(([label, count]) => (
              <div className="stat" key={label}>
                <strong>{count}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    'Date / time',
                    'Contact / company',
                    'Email / phone',
                    'Combo',
                    'Quantity',
                    'Occasion',
                    'Status',
                    'Source',
                    '',
                  ].map((s, i) => (
                    <th key={i}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(overview ? data.rows.slice(0, 5) : data.rows).map((l) => (
                  <tr key={l.id}>
                    <td>{time(l.created_at)}</td>
                    <td>
                      {l.name}
                      <small style={{ display: 'block' }}>{l.company}</small>
                    </td>
                    <td>
                      {l.email}
                      <br />
                      {l.phone}
                    </td>
                    <td>{l.selected_combo_name || 'General'}</td>
                    <td>{l.quantity}</td>
                    <td>{l.occasion || '—'}</td>
                    <td>
                      <span className="status">{l.status}</span>
                    </td>
                    <td style={{ overflowWrap: 'anywhere', maxWidth: 180 }}>{l.source_page}</td>
                    <td>
                      <button onClick={() => open(l)}>View enquiry</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.rows.length && <p>No enquiries match these filters.</p>}
          {!overview && (
            <div className="admin-tools">
              <button disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>
                Page {page} of {Math.max(1, Math.ceil(data.total / 20))}
              </span>
              <button
                disabled={page * 20 >= data.total || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      {overview ? (
        <Link href="/admin/leads">Manage all enquiries →</Link>
      ) : (
        <>
          <button
            className="text-button"
            onClick={async () => {
              try {
                const r = await fetch('/api/admin/notifications', { method: 'POST' });
                const result = await r.json();
                setMessage(result.message || result.error);
              } catch {
                setMessage('Unable to process notifications. Retry later.');
              }
            }}
          >
            Retry pending email notifications
          </button>
          {message && <p role="status">{message}</p>}
        </>
      )}
    </div>
  );
}
