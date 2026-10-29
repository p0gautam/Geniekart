'use client';
import { useState } from 'react';
type User = {
  id?: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  password?: string;
};
export function AdminUsers({ initial }: { initial: User[] }) {
  const [users, setUsers] = useState(initial);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...user };
    if (!data.password) delete data.password;
    const r = await fetch('/api/admin/users/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (r.ok) {
      setUsers(await fetch('/api/admin/users').then((r) => r.json()));
      setUser(null);
      setMessage('User saved; existing sessions revoked.');
    } else setMessage((await r.json()).error);
  }
  return (
    <div className="admin-panel">
      {user ? (
        <form onSubmit={save}>
          <label>
            Name
            <input
              value={user.name}
              required
              onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
            />
          </label>
          <label>
            Role
            <select value={user.role} onChange={(e) => setUser({ ...user, role: e.target.value })}>
              {['SUPER_ADMIN', 'EDITOR', 'SALES'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Password {user.id ? '(leave blank to keep current)' : ''}
            <input
              type="password"
              autoComplete="new-password"
              required={!user.id}
              minLength={14}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={user.active}
              onChange={(e) => setUser({ ...user, active: e.target.checked })}
            />
            Active
          </label>
          <div className="admin-actions">
            <button className="button">Save user</button>
            <button type="button" className="text-button" onClick={() => setUser(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <button
            className="button"
            onClick={() => setUser({ name: '', email: '', role: 'EDITOR', active: true })}
          >
            Add staff member
          </button>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.active ? 'Active' : 'Disabled'}</td>
                    <td>
                      <button onClick={() => setUser(u)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
