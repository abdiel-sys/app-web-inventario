import { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, Loader2, X, Search, MapPin, Phone, ExternalLink } from 'lucide-react';
import { customersApi } from '../services/api';
import MapPicker from '../components/MapPicker';

function CustomerModal({ modal, onClose, onSave }) {
  const init = modal.data
    ? {
        name: modal.data.name,
        address: modal.data.address,
        phone: modal.data.phone || '',
        latitude: modal.data.latitude || '',
        longitude: modal.data.longitude || '',
        empty_jugs_held: modal.data.empty_jugs_held || 0,
      }
    : { name: '', address: '', phone: '', latitude: '', longitude: '', empty_jugs_held: 0 };

  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        empty_jugs_held: Number(form.empty_jugs_held),
        latitude: form.latitude !== '' ? Number(form.latitude) : null,
        longitude: form.longitude !== '' ? Number(form.longitude) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h3 className="modal-title">{modal.mode === 'edit' ? 'Edit Customer' : 'Add Customer'}</h3>
          <button id="close-customer-modal" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-name">Full Name</label>
              <input id="cust-name" className="form-control" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
            </div>
            <div className="form-group">
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <label className="form-label" htmlFor="cust-address" style={{ marginBottom: 0 }}>Address</label>
                {form.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--c-primary)', textDecoration: 'none' }}
                  >
                    <ExternalLink size={12} /> Search on Google Maps
                  </a>
                )}
              </div>
              <textarea id="cust-address" className="form-control" rows={2} value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} required autoComplete="street-address"
                style={{ resize: 'vertical', minHeight: '64px' }} />
            </div>

            {/* Interactive Map Pin Picker */}
            <MapPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={({ lat, lng, address }) => {
                setForm((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  ...(address ? { address } : {}),
                }));
              }}
            />

            <div className="form-group">
              <label className="form-label" htmlFor="cust-phone">Phone</label>
              <input id="cust-phone" type="tel" className="form-control" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
            </div>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="cust-lat">Latitude (GPS)</label>
                <input id="cust-lat" type="number" step="any" className="form-control" value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="e.g. 17.9892" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cust-lng">Longitude (GPS)</label>
                <input id="cust-lng" type="number" step="any" className="form-control" value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="e.g. -92.9281" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-customer-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersView() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await customersApi.getAll();
      setCustomers(res.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (payload) => {
    if (modal.mode === 'edit') {
      await customersApi.update(modal.data.id, payload);
    } else {
      await customersApi.create(payload);
    }
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    try {
      await customersApi.delete(id);
      fetchData();
    } catch (e) {
      setError(e.message);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers</h2>
          <p className="page-subtitle">Manage delivery destinations and empty jug balances.</p>
        </div>
        <button id="add-customer-btn" className="btn btn-primary"
          onClick={() => setModal({ mode: 'create', data: null })}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
        <div className="search-bar">
          <Search size={15} />
          <input id="customers-search" type="search" className="form-control"
            placeholder="Search by name, address, or phone…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No customers found</h3>
          <p>{search ? 'Try a different search.' : 'Add your first customer above.'}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Coords</th>
                  <th>Empty Jugs Held</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const mapUrl = c.latitude && c.longitude
                    ? `https://www.google.com/maps?q=${c.latitude},${c.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`;
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-1 text-sm"
                          style={{ maxWidth: 220, textDecoration: 'none', color: 'var(--c-primary)' }}
                          title="Open address in Google Maps"
                        >
                          <MapPin size={13} style={{ color: 'var(--c-primary)', flexShrink: 0, marginTop: 2 }} />
                          <span style={{ wordBreak: 'break-word' }}>{c.address}</span>
                          <ExternalLink size={12} style={{ flexShrink: 0, marginTop: 3, opacity: 0.7 }} />
                        </a>
                      </td>
                      <td>
                        {c.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone size={13} style={{ color: 'var(--c-text-muted)' }} />
                            <span className="text-sm">{c.phone}</span>
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {c.latitude && c.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono flex items-center gap-1"
                            style={{ color: 'var(--c-primary)', textDecoration: 'none' }}
                            title="View GPS location on Google Maps"
                          >
                            {Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}
                            <ExternalLink size={11} />
                          </a>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: c.empty_jugs_held > 0 ? 'var(--c-warning)' : 'var(--c-text-muted)',
                        }}>
                          {c.empty_jugs_held ?? 0}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button id={`edit-customer-${c.id}`} className="btn btn-ghost btn-icon"
                            onClick={() => setModal({ mode: 'edit', data: c })}>
                            <Edit2 size={15} />
                          </button>
                          <button id={`delete-customer-${c.id}`} className="btn btn-ghost btn-icon"
                            onClick={() => handleDelete(c.id)}
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
        <CustomerModal modal={modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
