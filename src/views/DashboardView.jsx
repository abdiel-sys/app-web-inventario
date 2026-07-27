import { useEffect, useState } from 'react';
import {
  Droplets,
  Warehouse,
  Truck,
  PackageCheck,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { warehouseApi, vansApi, deliveryTripsApi, customersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function KpiCard({ icon: Icon, iconClass, label, value, sub }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconClass}`}>
        <Icon size={20} />
      </div>
      <div className="kpi-value">{value ?? '—'}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="text-xs" style={{ color: 'var(--c-text-dim)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardView({ onNavigate }) {
  const { user } = useAuth();
  const [data, setData] = useState({
    warehouse: null,
    vans: [],
    trips: [],
    customers: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    Promise.allSettled([
      warehouseApi.getAll(),
      vansApi.getAll(),
      deliveryTripsApi.getAll(),
      customersApi.getAll(),
    ]).then(([wRes, vRes, tRes, cRes]) => {
      setData({
        warehouse: wRes.status === 'fulfilled' ? (wRes.value.data?.[0] ?? null) : null,
        vans: vRes.status === 'fulfilled' ? (vRes.value.data ?? []) : [],
        trips: tRes.status === 'fulfilled' ? (tRes.value.data ?? []) : [],
        customers: cRes.status === 'fulfilled' ? (cRes.value.data ?? []) : [],
        loading: false,
        error: null,
      });
    });
  }, []);

  const activeVans = data.vans.filter((v) => v.status === 'on_route').length;
  const activeTrips = data.trips.filter((t) => t.status === 'in_progress').length;
  const plannedTrips = data.trips.filter((t) => t.status === 'planned').length;
  const totalEmptyHeld = data.customers.reduce((sum, c) => sum + (c.empty_jugs_held || 0), 0);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.full_name}</strong>. Here's your inventory overview.
          </p>
        </div>
      </div>

      {data.loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-muted)' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 1rem' }} />
          <p>Loading dashboard data…</p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
            <KpiCard
              icon={Droplets}
              iconClass="cyan"
              label="Full Jugs (Warehouse)"
              value={data.warehouse?.full_jugs?.toLocaleString() ?? '—'}
              sub="Ready to deliver"
            />
            <KpiCard
              icon={Droplets}
              iconClass="sky"
              label="Empty Jugs (Warehouse)"
              value={data.warehouse?.empty_jugs?.toLocaleString() ?? '—'}
              sub="Awaiting refill"
            />
            <KpiCard
              icon={AlertTriangle}
              iconClass="amber"
              label="Damaged Jugs"
              value={data.warehouse?.damaged_jugs?.toLocaleString() ?? '—'}
              sub="Needs assessment"
            />
            <KpiCard
              icon={Truck}
              iconClass="green"
              label="Vans On Route"
              value={activeVans}
              sub={`${data.vans.length} total vans`}
            />
            <KpiCard
              icon={PackageCheck}
              iconClass="purple"
              label="Active Trips"
              value={activeTrips}
              sub={`${plannedTrips} planned`}
            />
            <KpiCard
              icon={Users}
              iconClass="sky"
              label="Customers"
              value={data.customers.length}
              sub={`${totalEmptyHeld} empty jugs held`}
            />
          </div>

          {/* Recent section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Warehouse summary */}
            <div className="card">
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <div className="kpi-icon cyan" style={{ width: 34, height: 34 }}>
                  <Warehouse size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Warehouse</div>
                  <div className="text-muted">{data.warehouse?.location_name ?? 'Main Warehouse'}</div>
                </div>
                <button
                  id="dash-go-warehouse"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onNavigate('warehouse')}
                  style={{ marginLeft: 'auto' }}
                >
                  View →
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                {[
                  { label: 'Full', value: data.warehouse?.full_jugs, color: 'var(--c-primary)' },
                  { label: 'Empty', value: data.warehouse?.empty_jugs, color: 'var(--c-accent)' },
                  { label: 'Damaged', value: data.warehouse?.damaged_jugs, color: 'var(--c-warning)' },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '0.5rem', background: 'var(--c-bg-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
                    <div className="text-xs text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trips summary */}
            <div className="card">
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <div className="kpi-icon green" style={{ width: 34, height: 34 }}>
                  <Activity size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Delivery Trips</div>
                  <div className="text-muted">Recent activity</div>
                </div>
                <button
                  id="dash-go-trips"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onNavigate('trips')}
                  style={{ marginLeft: 'auto' }}
                >
                  View →
                </button>
              </div>
              {data.trips.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <p>No delivery trips yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.trips.slice(0, 4).map((trip) => (
                    <div
                      key={trip.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--c-bg-surface)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div className="text-sm truncate" style={{ maxWidth: '160px' }}>
                        {trip.driver_name || 'Driver'} — {trip.van_plate || trip.van_id?.slice(0,8)}
                      </div>
                      <span className={`badge badge-${trip.status}`}>{trip.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Van fleet quick look */}
          {data.vans.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <div className="kpi-icon green" style={{ width: 34, height: 34 }}>
                  <Truck size={17} />
                </div>
                <div style={{ fontWeight: 700 }}>Fleet Overview</div>
                <button
                  id="dash-go-vans"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onNavigate('vans')}
                  style={{ marginLeft: 'auto' }}
                >
                  Manage Vans →
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {data.vans.map((van) => (
                  <div
                    key={van.id}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: 'var(--c-bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--c-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Truck size={13} style={{ color: 'var(--c-text-muted)' }} />
                    <span className="text-sm font-mono">{van.license_plate}</span>
                    <span className={`badge badge-${van.status}`}>{van.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
