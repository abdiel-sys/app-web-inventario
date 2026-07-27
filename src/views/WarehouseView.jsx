import { useEffect, useState } from 'react';
import { Warehouse, Droplets, AlertTriangle, Plus, Edit2, Loader2, X } from 'lucide-react';
import { warehouseApi, inventoryLogsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function RefillModal({ warehouse, onClose, onRefill }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(warehouse.empty_jugs > 0 ? Math.min(50, warehouse.empty_jugs) : 0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalErr('');
    const refillQty = Number(amount);
    if (isNaN(refillQty) || refillQty <= 0) {
      setModalErr('Please enter a valid refill amount greater than 0.');
      return;
    }
    if (refillQty > warehouse.empty_jugs) {
      setModalErr(`Cannot refill ${refillQty} jugs because only ${warehouse.empty_jugs} empty jugs are available in ${warehouse.location_name}.`);
      return;
    }

    setSaving(true);
    try {
      await onRefill({
        action_type: 'WATER_REFILL',
        full_jugs_change: refillQty,
        empty_jugs_change: -refillQty,
        damaged_jugs_change: 0,
        warehouse_id: warehouse.id,
        performed_by: user?.id || null,
        notes: notes || `Refilled ${refillQty} water jugs at ${warehouse.location_name}`,
      });
    } catch (err) {
      setModalErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Refill Water Jugs — {warehouse.location_name}</h3>
          <button id="close-refill-modal" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {modalErr && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{modalErr}</div>}

            <div className="card flex items-center justify-between" style={{ marginBottom: '1rem', background: 'var(--c-bg-surface)', padding: '0.75rem 1rem' }}>
              <div>
                <div className="text-xs text-muted">Available Empty Jugs</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-accent)' }}>
                  {warehouse.empty_jugs} empty
                </div>
              </div>
              <div>
                <div className="text-xs text-muted">Current Full Stock</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-primary)' }}>
                  {warehouse.full_jugs} full
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="refill-amount">Number of Jugs to Refill</label>
              <input
                id="refill-amount"
                type="number"
                min="1"
                max={warehouse.empty_jugs}
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                This will convert {amount || 0} empty jugs into {amount || 0} full water jugs.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="refill-notes">Notes (optional)</label>
              <textarea
                id="refill-notes"
                className="form-control"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional refill batch details..."
                style={{ resize: 'vertical', minHeight: '60px' }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              id="confirm-refill-btn"
              type="submit"
              className="btn btn-primary flex items-center gap-1"
              disabled={saving || warehouse.empty_jugs <= 0}
            >
              {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Droplets size={16} />}
              Refill {amount || 0} Jugs
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WarehouseView() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'edit'|'create', data }
  const [refillModal, setRefillModal] = useState(null); // warehouse data
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.getAll();
      setWarehouses(res.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = (w) => {
    setForm({
      location_name: w.location_name,
      full_jugs: w.full_jugs,
      empty_jugs: w.empty_jugs,
      damaged_jugs: w.damaged_jugs,
    });
    setModal({ mode: 'edit', data: w });
  };

  const openCreate = () => {
    setForm({ location_name: '', full_jugs: 0, empty_jugs: 0, damaged_jugs: 0 });
    setModal({ mode: 'create', data: null });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        full_jugs: Number(form.full_jugs),
        empty_jugs: Number(form.empty_jugs),
        damaged_jugs: Number(form.damaged_jugs),
      };
      if (modal.mode === 'edit') {
        await warehouseApi.update(modal.data.id, payload);
      } else {
        await warehouseApi.create(payload);
      }
      setModal(null);
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRefillSubmit = async (payload) => {
    await inventoryLogsApi.create(payload);
    setRefillModal(null);
    fetchData();
  };

  const main = warehouses[0];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Warehouse Stock</h2>
          <p className="page-subtitle">Manage central jug inventory across all warehouse locations.</p>
        </div>
        <button id="add-warehouse-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Location
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      ) : warehouses.length === 0 ? (
        <div className="empty-state">
          <Warehouse size={48} />
          <h3>No warehouse records</h3>
          <p>Add your first warehouse location to start tracking inventory.</p>
        </div>
      ) : (
        <>
          {/* Hero stat for primary warehouse */}
          {main && (
            <div
              className="card"
              style={{
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, var(--c-bg-card) 60%)',
                border: '1px solid rgba(6,182,212,0.18)',
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
                <div className="flex items-center gap-3">
                  <div className="kpi-icon cyan">
                    <Warehouse size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{main.location_name}</div>
                    <div className="text-muted">
                      Last updated: {main.updated_at ? new Date(main.updated_at).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id={`refill-warehouse-${main.id}`}
                    className="btn btn-primary btn-sm flex items-center gap-1"
                    onClick={() => setRefillModal(main)}
                    disabled={main.empty_jugs <= 0}
                    title={main.empty_jugs <= 0 ? 'No empty jugs available to refill' : 'Refill empty water jugs'}
                  >
                    <Droplets size={14} /> Refill Jugs
                  </button>
                  <button
                    id={`edit-warehouse-${main.id}`}
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEdit(main)}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'Full Jugs', value: main.full_jugs, icon: Droplets, color: 'var(--c-primary)', cls: 'cyan' },
                  { label: 'Empty Jugs', value: main.empty_jugs, icon: Droplets, color: 'var(--c-accent)', cls: 'sky' },
                  { label: 'Damaged Jugs', value: main.damaged_jugs, icon: AlertTriangle, color: 'var(--c-warning)', cls: 'amber' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      textAlign: 'center',
                      padding: '1.25rem',
                      background: 'var(--c-bg-surface)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--c-border)',
                    }}
                  >
                    <div className={`kpi-icon ${s.cls}`} style={{ margin: '0 auto 0.75rem', width: 40, height: 40 }}>
                      <s.icon size={18} />
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                      {s.value?.toLocaleString() ?? 0}
                    </div>
                    <div className="kpi-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional locations table */}
          {warehouses.length > 1 && (
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: '1rem' }}>All Locations</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Full Jugs</th>
                      <th>Empty Jugs</th>
                      <th>Damaged</th>
                      <th>Updated</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((w) => (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 600 }}>{w.location_name}</td>
                        <td style={{ color: 'var(--c-primary)', fontWeight: 700 }}>{w.full_jugs}</td>
                        <td style={{ color: 'var(--c-accent)' }}>{w.empty_jugs}</td>
                        <td style={{ color: 'var(--c-warning)' }}>{w.damaged_jugs}</td>
                        <td className="text-muted">{w.updated_at ? new Date(w.updated_at).toLocaleDateString() : '—'}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              id={`refill-wh-${w.id}`}
                              className="btn btn-secondary btn-xs flex items-center gap-1"
                              onClick={() => setRefillModal(w)}
                              disabled={w.empty_jugs <= 0}
                            >
                              <Droplets size={13} /> Refill
                            </button>
                            <button
                              id={`edit-wh-${w.id}`}
                              className="btn btn-ghost btn-icon"
                              onClick={() => openEdit(w)}
                            >
                              <Edit2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Refill Modal */}
      {refillModal && (
        <RefillModal
          warehouse={refillModal}
          onClose={() => setRefillModal(null)}
          onRefill={handleRefillSubmit}
        />
      )}

      {/* Edit/Create Modal */}
      {modal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={modal.mode === 'edit' ? 'Edit warehouse' : 'Add warehouse location'}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal.mode === 'edit' ? 'Edit Warehouse' : 'Add Location'}</h3>
              <button id="close-warehouse-modal" className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="wh-name">Location Name</label>
                  <input id="wh-name" className="form-control" value={form.location_name}
                    onChange={(e) => setForm({ ...form, location_name: e.target.value })} required />
                </div>
                <div className="two-col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="wh-full">Full Jugs</label>
                    <input id="wh-full" type="number" min="0" className="form-control" value={form.full_jugs}
                      onChange={(e) => setForm({ ...form, full_jugs: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="wh-empty">Empty Jugs</label>
                    <input id="wh-empty" type="number" min="0" className="form-control" value={form.empty_jugs}
                      onChange={(e) => setForm({ ...form, empty_jugs: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="wh-damaged">Damaged Jugs</label>
                  <input id="wh-damaged" type="number" min="0" className="form-control" value={form.damaged_jugs}
                    onChange={(e) => setForm({ ...form, damaged_jugs: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button id="save-warehouse-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
