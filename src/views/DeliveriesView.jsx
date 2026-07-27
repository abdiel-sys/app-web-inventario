import { useEffect, useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Loader2, X, ExternalLink, Lock } from 'lucide-react';
import { deliveriesApi, deliveryTripsApi, customersApi, vansApi } from '../services/api';

const DELIVERY_STATUSES = ['pending', 'delivered', 'failed', 'skipped'];

function DeliveryModal({ modal, onClose, onSave, customers, currentTripId, tripDeliveriesCount }) {
  const init = modal.data
    ? {
        trip_id: modal.data.trip_id,
        customer_id: modal.data.customer_id,
        stop_order: modal.data.stop_order,
        status: modal.data.status,
        full_jugs_delivered: modal.data.full_jugs_delivered || 0,
        empty_jugs_collected: modal.data.empty_jugs_collected || 0,
        damaged_jugs_collected: modal.data.damaged_jugs_collected || 0,
        notes: modal.data.notes || '',
      }
    : {
        trip_id: currentTripId,
        customer_id: customers.length > 0 ? customers[0].id : '',
        stop_order: tripDeliveriesCount + 1,
        status: 'delivered',
        full_jugs_delivered: 0,
        empty_jugs_collected: 0,
        damaged_jugs_collected: 0,
        notes: '',
      };

  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);

  const num = (key) => (e) => setForm({ ...form, [key]: Number(e.target.value) || 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3 className="modal-title">{modal.mode === 'edit' ? 'Edit Delivery Stop' : 'New Customer Delivery'}</h3>
          <button id="close-delivery-modal" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="delivery-customer">Customer</label>
              <select
                id="delivery-customer"
                className="form-control"
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                required
              >
                <option value="">— Select Customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.address}) — Held Empties: {c.empty_jugs_held || 0}
                  </option>
                ))}
              </select>
            </div>

            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="delivery-stop">Stop Order #</label>
                <input
                  id="delivery-stop"
                  type="number"
                  min="1"
                  className="form-control"
                  value={form.stop_order}
                  onChange={num('stop_order')}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="delivery-status">Status</label>
                <select
                  id="delivery-status"
                  className="form-control"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {DELIVERY_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--c-text-muted)', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
              JUG EXCHANGE AT STOP
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="del-fd">Full Delivered</label>
                <input
                  id="del-fd"
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.full_jugs_delivered}
                  onChange={num('full_jugs_delivered')}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="del-ec">Empty Collected</label>
                <input
                  id="del-ec"
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.empty_jugs_collected}
                  onChange={num('empty_jugs_collected')}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="del-dc">Damaged Collected</label>
                <input
                  id="del-dc"
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.damaged_jugs_collected}
                  onChange={num('damaged_jugs_collected')}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="delivery-notes">Notes / Observations</label>
              <textarea
                id="delivery-notes"
                className="form-control"
                rows="2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Left at reception, customer requested 5 full jugs next trip..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-delivery-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Save Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeliveriesView() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vans, setVans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [tRes, cRes, vRes] = await Promise.allSettled([
        deliveryTripsApi.getAll(),
        customersApi.getAll(),
        vansApi.getAll(),
      ]);

      const fetchedTrips = tRes.status === 'fulfilled' ? (tRes.value.data ?? []) : [];
      setTrips(fetchedTrips);
      setCustomers(cRes.status === 'fulfilled' ? (cRes.value.data ?? []) : []);
      setVans(vRes.status === 'fulfilled' ? (vRes.value.data ?? []) : []);

      const activeTripsList = fetchedTrips.filter((t) => t.status === 'in_progress');
      if (activeTripsList.length > 0) {
        setSelectedTripId((prev) => (activeTripsList.some((t) => t.id === prev) ? prev : activeTripsList[0].id));
      } else {
        setSelectedTripId('');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async (tripId) => {
    if (!tripId) {
      setDeliveries([]);
      return;
    }
    try {
      const res = await deliveriesApi.getByTripId(tripId);
      setDeliveries(res.data ?? []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      fetchDeliveries(selectedTripId);
    } else {
      setDeliveries([]);
    }
  }, [selectedTripId]);

  const handleSave = async (payload) => {
    try {
      if (modal.mode === 'edit') {
        await deliveriesApi.update(modal.data.id, payload);
      } else {
        await deliveriesApi.create(payload);
      }
      setModal(null);
      fetchDeliveries(selectedTripId);
      const tRes = await deliveryTripsApi.getAll();
      setTrips(tRes.data ?? []);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this delivery stop?')) return;
    try {
      await deliveriesApi.delete(id);
      fetchDeliveries(selectedTripId);
      const tRes = await deliveryTripsApi.getAll();
      setTrips(tRes.data ?? []);
    } catch (e) {
      setError(e.message);
    }
  };

  const inProgressTrips = trips.filter((t) => t.status === 'in_progress');
  const currentTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Customer Deliveries</h2>
          <p className="page-subtitle">Record full jug deliveries and collect empty/damaged jugs per stop.</p>
        </div>
        <button
          id="add-delivery-btn"
          className="btn btn-primary"
          onClick={() => setModal({ mode: 'create', data: null })}
          disabled={!selectedTripId || currentTrip?.status === 'completed'}
        >
          <Plus size={16} /> New Delivery Stop
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {currentTrip?.status === 'completed' && (
        <div className="alert alert-info flex items-center gap-2" style={{ marginBottom: '1rem' }}>
          <Lock size={16} />
          <span>This delivery trip is completed and locked from modifications.</span>
        </div>
      )}

      {/* Trip selector header card */}
      <div className="card flex items-center gap-4" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <label className="form-label" htmlFor="select-trip-filter">Select Active Delivery Trip (In Progress)</label>
          <select
            id="select-trip-filter"
            className="form-control"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
          >
            {inProgressTrips.length === 0 ? (
              <option value="">No in-progress trips available</option>
            ) : (
              inProgressTrips.map((t) => {
                const van = vans.find((v) => v.id === t.van_id);
                return (
                  <option key={t.id} value={t.id}>
                    Trip: {van?.license_plate ?? t.van_id.slice(0, 8)} — Driver: {t.driver_name || 'Driver'} ({t.status})
                  </option>
                );
              })
            )}
          </select>
        </div>

        {currentTrip && (
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '0.4rem 0.75rem', background: 'var(--c-bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-primary)' }}>{currentTrip.loaded_full_jugs}</div>
              <div className="text-xs text-muted">Loaded Full</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.4rem 0.75rem', background: 'var(--c-bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-accent)' }}>{currentTrip.returned_full_jugs || 0}</div>
              <div className="text-xs text-muted">Remaining Full</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.4rem 0.75rem', background: 'var(--c-bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-success)' }}>{currentTrip.returned_empty_jugs || 0}</div>
              <div className="text-xs text-muted">Total Empties on Van</div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="empty-state">
          <MapPin size={48} />
          <h3>No delivery stops recorded for this trip</h3>
          <p>Click "New Delivery Stop" to record a customer water jug exchange.</p>
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Stop</th>
                <th>Customer</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Full Delivered</th>
                <th style={{ textAlign: 'right' }}>Empty Collected</th>
                <th style={{ textAlign: 'right' }}>Damaged</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 700, color: 'var(--c-primary)' }}>#{d.stop_order}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span style={{ fontWeight: 600 }}>{d.customer_name}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.customer_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-icon"
                        style={{ padding: 2, height: 'auto', width: 'auto' }}
                        title="Open address in Google Maps"
                      >
                        <ExternalLink size={13} style={{ color: 'var(--c-primary)' }} />
                      </a>
                    </div>
                    <div className="text-xs text-muted">{d.customer_address}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${d.status}`}>{d.status}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-primary)' }}>
                    {d.full_jugs_delivered}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-accent)' }}>
                    {d.empty_jugs_collected}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-warning)' }}>
                    {d.damaged_jugs_collected}
                  </td>
                  <td className="text-sm text-muted" style={{ maxWidth: 200 }}>
                    {d.notes || '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {currentTrip?.status === 'completed' ? (
                      <span className="text-xs text-muted">Locked 🔒</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`edit-delivery-${d.id}`}
                          className="btn btn-ghost btn-icon"
                          onClick={() => setModal({ mode: 'edit', data: d })}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          id={`delete-delivery-${d.id}`}
                          className="btn btn-ghost btn-icon"
                          onClick={() => handleDelete(d.id)}
                          style={{ color: 'var(--c-danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <DeliveryModal
          modal={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          customers={customers}
          currentTripId={selectedTripId}
          tripDeliveriesCount={deliveries.length}
        />
      )}
    </div>
  );
}
