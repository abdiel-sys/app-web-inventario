import { useEffect, useState } from 'react';
import { UserCog, Plus, Edit2, Trash2, Loader2, X, Search } from 'lucide-react';
import { usersApi } from '../services/api';

const ROLES = ['admin', 'driver', 'warehouse'];

function UserModal({ modal, onClose, onSave }) {
  const init = modal.data
    ? {
        full_name: modal.data.full_name,
        email: modal.data.email,
        role: modal.data.role,
        phone: modal.data.phone || '',
        password: '',
      }
    : { full_name: '', email: '', role: 'driver', phone: '', password: '' };

  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{modal.mode === 'edit' ? 'Edit User' : 'Add User'}</h3>
          <button id="close-user-modal" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="user-name">Full Name</label>
              <input id="user-name" className="form-control" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required autoComplete="name" />
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="user-email">Email</label>
                <input id="user-email" type="email" className="form-control" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="user-phone">Phone</label>
                <input id="user-phone" type="tel" className="form-control" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
              </div>
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="user-role">Role</label>
                <select id="user-role" className="form-control" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="user-password">
                  {modal.mode === 'edit' ? 'New Password (leave blank to keep)' : 'Password'}
                </label>
                <input id="user-password" type="password" className="form-control" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  required={modal.mode === 'create'}
                  minLength={6}
                  placeholder="••••••••" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-user-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll();
      setUsers(res.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (payload) => {
    if (modal.mode === 'edit') {
      await usersApi.update(modal.data.id, payload);
    } else {
      await usersApi.create(payload);
    }
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await usersApi.delete(id);
      fetchData();
    } catch (e) {
      setError(e.message);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.includes(search.toLowerCase())
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">Manage staff accounts and role assignments. (Admin only)</p>
        </div>
        <button id="add-user-btn" className="btn btn-primary"
          onClick={() => setModal({ mode: 'create', data: null })}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
        <div className="search-bar">
          <Search size={15} />
          <input id="users-search" type="search" className="form-control"
            placeholder="Search by name, email, or role…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <UserCog size={48} />
          <h3>No users found</h3>
          <p>{search ? 'Try a different search.' : 'Add your first user above.'}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const initials = user.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.72rem' }}>
                            {initials}
                          </div>
                          <span style={{ fontWeight: 600 }}>{user.full_name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{user.email}</td>
                      <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                      <td className="text-muted">{user.phone || '—'}</td>
                      <td className="text-muted text-xs">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button id={`edit-user-${user.id}`} className="btn btn-ghost btn-icon"
                            onClick={() => setModal({ mode: 'edit', data: user })}>
                            <Edit2 size={15} />
                          </button>
                          <button id={`delete-user-${user.id}`} className="btn btn-ghost btn-icon"
                            onClick={() => handleDelete(user.id)}
                            style={{ color: 'var(--c-danger)' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <UserModal modal={modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
