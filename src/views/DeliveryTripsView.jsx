import { useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2, Loader2, X, ChevronDown, ChevronRight, CheckCircle, Info } from 'lucide-react';
import { deliveryTripsApi, vansApi, usersApi, warehouseApi } from '../services/api';

const TRIP_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'];

function TripModal({ modal, onClose, onSave, vans, drivers, warehouses }) {
  const defaultWarehouseId = warehouses.length > 0 ? warehouses[0].id : '';

  const init = modal.data
    ? {
      van_id: modal.data.van_id,
      driver_id: modal.data.driver_id,
      warehouse_id: modal.data.warehouse_id || defaultWarehouseId,
      status: modal.data.status,
      loaded_full_jugs: modal.data.loaded_full_jugs,
      loaded_empty_jugs: modal.data.loaded_empty_jugs,
      returned_full_jugs: modal.data.returned_full_jugs || 0,
      returned_empty_jugs: modal.data.returned_empty_jugs || 0,
      returned_damaged_jugs: modal.data.returned_damaged_jugs || 0,
    }
    : {
      van_id: '',
      driver_id: '',
      warehouse_id: defaultWarehouseId,
      status: 'planned',
      loaded_full_jugs: 0,
      loaded_empty_jugs: 0,
      returned_full_jugs: 0,
      returned_empty_jugs: 0,
      returned_damaged_jugs: 0,
    };

  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);

  const isLocked = modal.mode === 'edit' && (modal.data.status === 'in_progress' || modal.data.status === 'completed');

  const num = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      [
        'loaded_full_jugs', 'loaded_empty_jugs', 'returned_full_jugs',
        'returned_empty_jugs', 'returned_damaged_jugs',
      ].forEach((k) => { payload[k] = Number(payload[k]); });
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 className="modal-title">{modal.mode === 'edit' ? 'Edit Trip' : 'New Delivery Trip'}</h3>
          <button id="close-trip-modal" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {isLocked && (
              <div className="alert alert-info flex items-center gap-2" style={{ marginBottom: '1rem', fontSize: '0.82rem' }}>
                <Info size={16} />
                <span>Water jug quantities for in-progress or completed trips are managed via customer deliveries.</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="trip-warehouse">Warehouse</label>
              <select
                id="trip-warehouse"
                className="form-control"
                value={form.warehouse_id}
                onChange={(e) => setForm({ ...form, warehouse_id: Number(e.target.value) || e.target.value })}
                required
              >
                <option value="">— Select Warehouse —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.location_name} (Full: {w.full_jugs}, Empty: {w.empty_jugs})
                  </option>
                ))}
              </select>
            </div>

            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="trip-van">Van</label>
                <select id="trip-van" className="form-control" value={form.van_id}
                  onChange={(e) => setForm({ ...form, van_id: e.target.value })} required>
                  <option value="">— Select Van —</option>
                  {vans.map((v) => <option key={v.id} value={v.id}>{v.license_plate} (Max: {v.max_jug_capacity})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-driver">Driver</label>
                <select id="trip-driver" className="form-control" value={form.driver_id}
                  onChange={(e) => setForm({ ...form, driver_id: e.target.value })} required>
                  <option value="">— Select Driver —</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="trip-status">Status</label>
              <select id="trip-status" className="form-control" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {TRIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--c-text-muted)', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
              LOADED ONTO VAN
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="trip-lf">Full Jugs Loaded</label>
                <input id="trip-lf" type="number" min="0" className="form-control" value={form.loaded_full_jugs} onChange={num('loaded_full_jugs')} disabled={isLocked} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-le">Empty Jugs Loaded</label>
                <input id="trip-le" type="number" min="0" className="form-control" value={form.loaded_empty_jugs} onChange={num('loaded_empty_jugs')} disabled={isLocked} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-trip-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeliveryTripsView() {
  const [trips, setTrips] = useState([]);
  const [vans, setVans] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, vRes, uRes, wRes] = await Promise.allSettled([
        deliveryTripsApi.getAll(),
        vansApi.getAll(),
        usersApi.getAll(),
        warehouseApi.getAll(),
      ]);
      setTrips(tRes.status === 'fulfilled' ? (tRes.value.data ?? []) : []);
      setVans(vRes.status === 'fulfilled' ? (vRes.value.data ?? []) : []);
      setWarehouses(wRes.status === 'fulfilled' ? (wRes.value.data ?? []) : []);
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
    try {
      if (modal.mode === 'edit') {
        await deliveryTripsApi.update(modal.data.id, payload);
      } else {
        await deliveryTripsApi.create(payload);
      }
      setModal(null);
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleFinishTrip = async (id) => {
    if (!confirm('Are you sure you want to finish this delivery trip? Warehouse stock will be updated with returned jugs.')) return;
    try {
      await deliveryTripsApi.complete(id);
      fetchData();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this delivery trip? Returned jugs will be reverted to the warehouse.')) return;
    try {
      await deliveryTripsApi.delete(id);
      fetchData();
    } catch (e) {
      setError(e.message);
    }
  };

  const getVan = (id) => vans.find((v) => v.id === id);
  const getDriver = (id) => drivers.find((d) => d.id === id);
  const getWarehouse = (id) => warehouses.find((w) => w.id === id);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Delivery Trips</h2>
          <p className="page-subtitle">Track active and planned van delivery routes.</p>
        </div>
        <button id="add-trip-btn" className="btn btn-primary"
          onClick={() => setModal({ mode: 'create', data: null })}>
          <Plus size={16} /> New Trip
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>No delivery trips</h3>
          <p>Create a trip to start dispatching vans.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {trips.map((trip) => {
            const van = getVan(trip.van_id);
            const driver = getDriver(trip.driver_id);
            const warehouse = getWarehouse(trip.warehouse_id);
            const isExpanded = expandedId === trip.id;
            return (
              <div key={trip.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Trip row header */}
                <div
                  className="flex items-center gap-3"
                  style={{ padding: '0.875rem 1rem', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                >
                  <div style={{ color: 'var(--c-text-muted)' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700 }}>
                        {van?.license_plate ?? trip.van_id?.slice(0, 8)}
                      </span>
                      <span className="text-muted">—</span>
                      <span className="text-sm">{driver?.full_name ?? 'Unknown driver'}</span>
                      <span className={`badge badge-${trip.status}`}>{trip.status}</span>
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                      Warehouse: <strong>{warehouse?.location_name ?? trip.warehouse_location_name ?? 'Main Warehouse'}</strong> · Loaded: {trip.loaded_full_jugs} full, {trip.loaded_empty_jugs} empty
                      {trip.started_at && (
                        <> · Started {new Date(trip.started_at).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                      <button
                        id={`finish-trip-${trip.id}`}
                        className="btn btn-sm btn-secondary flex items-center gap-1"
                        onClick={() => handleFinishTrip(trip.id)}
                        title="Finish Trip & return stock to warehouse"
                        style={{ color: 'var(--c-success)', borderColor: 'var(--c-success)' }}
                      >
                        <CheckCircle size={14} /> Finish
                      </button>
                    )}
                    <button id={`edit-trip-${trip.id}`} className="btn btn-ghost btn-icon"
                      onClick={() => setModal({ mode: 'edit', data: trip })}>
                      <Edit2 size={15} />
                    </button>
                    <button id={`delete-trip-${trip.id}`} className="btn btn-ghost btn-icon"
                      onClick={() => handleDelete(trip.id)}
                      style={{ color: 'var(--c-danger)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid var(--c-border)',
                    padding: '1rem',
                    background: 'var(--c-bg-surface)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem',
                  }}>
                    {[
                      { label: 'Loaded Full', val: trip.loaded_full_jugs, color: 'var(--c-primary)' },
                      { label: 'Loaded Empty', val: trip.loaded_empty_jugs, color: 'var(--c-accent)' },
                      { label: 'Returned Full', val: trip.returned_full_jugs, color: 'var(--c-primary)' },
                      { label: 'Returned Empty', val: trip.returned_empty_jugs, color: 'var(--c-accent)' },
                      { label: 'Returned Damaged', val: trip.returned_damaged_jugs, color: 'var(--c-warning)' },
                    ].map((s) => (
                      <div key={s.label} style={{
                        padding: '0.625rem',
                        background: 'var(--c-bg-card)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--c-border)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val ?? 0}</div>
                        <div className="text-xs text-muted">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <TripModal
          modal={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          vans={vans}
          drivers={drivers}
          warehouses={warehouses}
        />
      )}
    </div>
  );
}

