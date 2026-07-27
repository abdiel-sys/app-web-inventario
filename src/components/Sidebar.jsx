import {
  LayoutDashboard,
  Warehouse,
  Truck,
  Users,
  Package,
  MapPin,
  FileText,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Operations',
    items: [
      { id: 'warehouse', label: 'Warehouse Stock', icon: Warehouse, roles: ['admin', 'warehouse'] },
      { id: 'vans', label: 'Delivery Vans', icon: Truck, roles: ['admin', 'driver'] },
      { id: 'trips', label: 'Delivery Trips', icon: Package, roles: ['admin', 'driver'] },
      { id: 'deliveries', label: 'Deliveries', icon: MapPin, roles: ['admin', 'driver'] },
      { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'driver', 'warehouse'] },
    ],
  },
  {
    group: 'Management',
    items: [
      { id: 'logs', label: 'Inventory Logs', icon: FileText, roles: ['admin', 'warehouse'] },
      { id: 'users', label: 'Users', icon: UserCog, roles: ['admin'] },
    ],
  },
];

export default function Sidebar({ activeView, onNavigate, collapsed, onToggleCollapse }) {
  const { user } = useAuth();

  const canSee = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Droplets size={20} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            AquaStock
            <span>Water Jug Inventory</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((group) => {
          const visibleItems = group.items.filter(canSee);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group}>
              <div className="sidebar-section-label">{group.group}</div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    aria-current={activeView === item.id ? 'page' : undefined}
                  >
                    <Icon className="nav-item-icon" size={18} />
                    {!collapsed && <span className="nav-item-label">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer toggle */}
      <div className="sidebar-footer">
        <button
          id="sidebar-collapse-btn"
          className="collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
