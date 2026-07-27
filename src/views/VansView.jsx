import { useEffect, useState } from 'react';
import { Truck, Plus, Edit2, Trash2, Loader2, X, Search } from 'lucide-react';
import { vansApi, usersApi } from '../services/api';

const STATUS_OPTIONS = ['available', 'on_route', 'maintenance'];

function VanModal({ modal, onClose, onSave, drivers }) {
  const [form, setForm] = useState(
    modal.data
      ? {
          license_plate: modal.data.license_plate,
          model: modal.data.model || '',
          max_jug_capacity: modal.data.max_jug_capacity,
          status: modal.data.status,
          current_driver_id: modal.data.current_driver_id || '',
        }
      : { license_plate: '', model: '', max_jug_capacity: 100, status: 'available', current_driver_id: '' }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        max_jug_capacity: Number(form.max_jug_capacity),
        current_driver_id: form.current_driver_id || null,
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{modal.mode === 'edit' ? 'Edit Van' : 'Add Van'}</h3>
          <button id="close-van-modal" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="van-plate">License Plate</label>
                <input id="van-plate" className="form-control" value={form.license_plate}
                  onChange={(e) => setForm({ ...form, license_plate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="van-model">Model</label>
                <input id="van-model" className="form-control" value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="van-capacity">Max Jug Capacity</label>
                <input id="van-capacity" type="number" min="1" className="form-control" value={form.max_jug_capacity}
                  onChange={(e) => setForm({ ...form, max_jug_capacity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="van-status">Status</label>
                <select id="van-status" className="form-control" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="van-driver">Assigned Driver (optional)</label>
              <select id="van-driver" className="form-control" value={form.current_driver_id}
                onChange={(e) => setForm({ ...form, current_driver_id: e.target.value })}>
                <option value="">— Unassigned —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-van-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VansView() {
  const [vans, setVans] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, uRes] = await Promise.allSettled([vansApi.getAll(), usersApi.getAll()]);
      setVans(vRes.status === 'fulfilled' ? (vRes.value.data ?? []) : []);
      const users = uRes.status === 'fulfilled' ? (uRes.value.data ?? []) : [];
      setDrivers(users.filter((u) => u.role === 'driver' || u.role === 'admin'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (payload) => {
    if (modal.mode === 'edit') {
      await vansApi.update(modal.data.id, payload);
    } else {
      await vansApi.create(payload);
    }
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this van? This action cannot be undone.')) return;
    try {
      await vansApi.delete(id);
      fetchData();
    } catch (e) {
      setError(e.message);
    }
  };

  const filtered = vans.filter(
    (v) =>
      v.license_plate?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Delivery Vans</h2>
          <p className="page-subtitle">Manage your fleet of water jug delivery vehicles.</p>
        </div>
        <button id="add-van-btn" className="btn btn-primary" onClick={() => setModal({ mode: 'create', data: null })}>
          <Plus size={16} /> Add Van
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Search */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
        <div className="search-bar">
          <Search size={15} />
          <input
            id="vans-search"
            type="search"
            className="form-control"
            placeholder="Search by plate or model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Truck size={48} />
          <h3>No vans found</h3>
          <p>{search ? 'Try a different search.' : 'Add your first delivery van above.'}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>License Plate</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Driver</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((van) => {
                  const driver = drivers.find((d) => d.id === van.current_driver_id);
                  return (
                    <tr key={van.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Truck size={15} style={{ color: 'var(--c-text-muted)' }} />
                          <span className="font-mono" style={{ fontWeight: 600 }}>{van.license_plate}</span>
                        </div>
                      </td>
                      <td className="text-muted">{van.model || '—'}</td>
                      <td>{van.max_jug_capacity} jugs</td>
                      <td><span className={`badge badge-${van.status}`}>{van.status}</span></td>
                      <td>{driver ? driver.full_name : <span className="text-muted">—</span>}</td>
                      <td className="text-muted">{van.created_at ? new Date(van.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button id={`edit-van-${van.id}`} className="btn btn-ghost btn-icon"
                            onClick={() => setModal({ mode: 'edit', data: van })}>
                            <Edit2 size={15} />
                          </button>
                          <button id={`delete-van-${van.id}`} className="btn btn-ghost btn-icon"
                            onClick={() => handleDelete(van.id)}
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
        <VanModal
          modal={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          drivers={drivers}
        />
      )}
    </div>
  );
}
