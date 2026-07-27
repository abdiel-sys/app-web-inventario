import { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ sidebarCollapsed, activeView }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';

  return (
    <header className={`navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="navbar-left">
        <h1 className="navbar-title">{activeView}</h1>
      </div>

      <div className="navbar-right">
        <div className="dropdown" ref={dropRef}>
          <button
            id="user-menu-btn"
            className="user-pill"
            onClick={() => setDropdownOpen((o) => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="avatar">{initials}</div>
            <div>
              <div className="user-pill-name">{user?.full_name || 'User'}</div>
              <div className="user-pill-role">{roleLabel}</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--c-text-muted)' }} />
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-item" style={{ cursor: 'default', opacity: 0.7 }}>
                <User size={15} />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="dropdown-divider" />
              <button
                id="logout-btn"
                className="dropdown-item danger"
                role="menuitem"
                onClick={() => { setDropdownOpen(false); logout(); }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
