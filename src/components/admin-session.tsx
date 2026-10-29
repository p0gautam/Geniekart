'use client';
/* eslint-disable @next/next/no-location-assign-relative-destination -- Full reload clears authenticated RSC caches when the session changes. */
import { useState } from 'react';
export function Logout() {
  return (
    <button
      className="text-button"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        location.assign('/admin/login');
      }}
    >
      Sign out
    </button>
  );
}
export function Login() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage('');
        const form = new FormData(e.currentTarget);
        try {
          const r = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(form)),
          });
          const data = await r.json();
          if (r.ok) location.assign('/admin');
          else setMessage(data.error);
        } catch {
          setMessage('Unable to sign in. Please try again.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input type="email" name="email" required autoComplete="username" />
      </label>
      <label>
        Password
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      <button className="button full" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {message && (
        <p className="error" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
