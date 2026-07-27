import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import WarehouseView from './views/WarehouseView';
import VansView from './views/VansView';
import DeliveryTripsView from './views/DeliveryTripsView';
import DeliveriesView from './views/DeliveriesView';
import CustomersView from './views/CustomersView';
import InventoryLogsView from './views/InventoryLogsView';
import UsersView from './views/UsersView';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './index.css';

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  warehouse: 'Warehouse Stock',
  vans: 'Delivery Vans',
  trips: 'Delivery Trips',
  deliveries: 'Customer Deliveries',
  customers: 'Customers',
  logs: 'Inventory Logs',
  users: 'Users',
};

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p>Loading AquaStock…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Role-based navigation guard
  const navigateTo = (view) => {
    const role = user?.role;
    const restricted = {
      users: ['admin'],
      logs: ['admin', 'warehouse'],
      warehouse: ['admin', 'warehouse'],
    };
    if (restricted[view] && !restricted[view].includes(role)) {
      return; // silently block
    }
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':   return <DashboardView onNavigate={navigateTo} />;
      case 'warehouse':   return <WarehouseView />;
      case 'vans':        return <VansView />;
      case 'trips':       return <DeliveryTripsView />;
      case 'deliveries':  return <DeliveriesView />;
      case 'customers':   return <CustomersView />;
      case 'logs':        return <InventoryLogsView />;
      case 'users':       return <UsersView />;
      default:            return <DashboardView onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        onNavigate={navigateTo}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          activeView={VIEW_LABELS[activeView] ?? activeView}
        />
        <main id="main-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
