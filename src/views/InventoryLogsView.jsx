import { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, Loader2, X, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { inventoryLogsApi, usersApi, warehouseApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ACTION_TYPES = ['WATER_REFILL', 'REFILL_PURCHASE', 'SCRAP_DAMAGED', 'TRIP_DISPATCH', 'ADJUSTMENT', 'RETURN'];

function LogModal({ onClose, onSave, users, warehouses }) {
  const { user } = useAuth();
  const canChangePerformedBy = user?.role === 'admin' || user?.role === 'warehouse';

  const [form, setForm] = useState({
    action_type: ACTION_TYPES[0],
    warehouse_id: warehouses[0]?.id || '',
    full_jugs_change: 0,
    empty_jugs_change: 0,
    damaged_jugs_change: 0,
    performed_by: user?.id || '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : null,
        full_jugs_change: Number(form.full_jugs_change),
        empty_jugs_change: Number(form.empty_jugs_change),
        damaged_jugs_change: Number(form.damaged_jugs_change),
        performed_by: form.performed_by || user?.id || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Log Stock Movement</h3>
          <button id="close-log-modal" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="log-warehouse">Target Warehouse</label>
              <select
                id="log-warehouse"
                className="form-control"
                value={form.warehouse_id}
                onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                required
              >
                {warehouses.length === 0 ? (
                  <option value="">No warehouses available</option>
                ) : (
                  warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.location_name}</option>
                  ))
                )}
              </select>
            </div>

            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="log-action">Action Type</label>
                <select id="log-action" className="form-control" value={form.action_type}
                  onChange={(e) => setForm({ ...form, action_type: e.target.value })}>
                  {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="log-performed">Performed By</label>
                <select
                  id="log-performed"
                  className="form-control"
                  value={form.performed_by}
                  disabled={!canChangePerformedBy}
                  onChange={(e) => setForm({ ...form, performed_by: e.target.value })}
                >
                  <option value="">— Select User —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--c-text-muted)', marginBottom: '0.5rem' }}>
              JUG CHANGES (positive = added, negative = removed)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="log-full">Full Jugs</label>
                <input id="log-full" type="number" className="form-control" value={form.full_jugs_change}
                  onChange={(e) => setForm({ ...form, full_jugs_change: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="log-empty">Empty Jugs</label>
                <input id="log-empty" type="number" className="form-control" value={form.empty_jugs_change}
                  onChange={(e) => setForm({ ...form, empty_jugs_change: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="log-damaged">Damaged</label>
                <input id="log-damaged" type="number" className="form-control" value={form.damaged_jugs_change}
                  onChange={(e) => setForm({ ...form, damaged_jugs_change: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="log-notes">Notes</label>
              <textarea id="log-notes" className="form-control" rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional description…"
                style={{ resize: 'vertical', minHeight: '60px' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-log-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeCell({ value }) {
  if (!value || value === 0) return <span className="text-muted">0</span>;
  const isPos = value > 0;
  return (
    <div className="flex items-center gap-1">
      {isPos
        ? <ArrowUpCircle size={13} style={{ color: 'var(--c-success)' }} />
        : <ArrowDownCircle size={13} style={{ color: 'var(--c-danger)' }} />
      }
      <span style={{ color: isPos ? 'var(--c-success)' : 'var(--c-danger)', fontWeight: 600 }}>
        {isPos ? '+' : ''}{value}
      </span>
    </div>
  );
}

export default function InventoryLogsView() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, uRes, wRes] = await Promise.allSettled([
        inventoryLogsApi.getAll(),
        usersApi.getAll(),
        warehouseApi.getAll(),
      ]);
      const raw = lRes.status === 'fulfilled' ? (lRes.value.data ?? []) : [];
      setLogs([...raw].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setUsers(uRes.status === 'fulfilled' ? (uRes.value.data ?? []) : []);
      setWarehouses(wRes.status === 'fulfilled' ? (wRes.value.data ?? []) : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (payload) => {
    await inventoryLogsApi.create(payload);
    setModal(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this log entry?')) return;
    try {
      await inventoryLogsApi.delete(id);
      fetchData();
    } catch (e) {
      setError(e.message);
    }
  };

  const getUserName = (id) => users.find((u) => u.id === id)?.full_name ?? '—';

  const filtered = logs.filter(
    (l) =>
      l.action_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.warehouse_location_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.notes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Inventory Logs</h2>
          <p className="page-subtitle">Audit trail of all stock movements and adjustments.</p>
        </div>
        <button id="add-log-btn" className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Log Movement
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
        <div className="search-bar">
          <Search size={15} />
          <input id="logs-search" type="search" className="form-control"
            placeholder="Filter by action type, warehouse, or notes…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No log entries</h3>
          <p>{search ? 'No matches found.' : 'Log a stock movement to get started.'}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Warehouse</th>
                  <th>Action</th>
                  <th>Full Jugs</th>
                  <th>Empty Jugs</th>
                  <th>Damaged</th>
                  <th>Performed By</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-muted font-mono">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                    <td>
                      <span className="text-sm" style={{ fontWeight: 600 }}>
                        {log.warehouse_location_name || 'Main Warehouse'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background: 'var(--c-bg-surface)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: 'var(--c-accent)',
                      }}>
                        {log.action_type}
                      </span>
                    </td>
                    <td><ChangeCell value={log.full_jugs_change} /></td>
                    <td><ChangeCell value={log.empty_jugs_change} /></td>
                    <td><ChangeCell value={log.damaged_jugs_change} /></td>
                    <td className="text-sm">{getUserName(log.performed_by)}</td>
                    <td>
                      <span className="text-sm text-muted" style={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.notes || '—'}
                      </span>
                    </td>
                    <td>
                      <button id={`delete-log-${log.id}`} className="btn btn-ghost btn-icon"
                        onClick={() => handleDelete(log.id)}
                        style={{ color: 'var(--c-danger)' }}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && <LogModal onClose={() => setModal(false)} onSave={handleSave} users={users} warehouses={warehouses} />}
    </div>
  );
}
