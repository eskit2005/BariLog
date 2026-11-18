import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users,
  FileText, 
  Home, 
  Receipt, 
  Wrench, 
  ShieldCheck, 
  BarChart3, 
  LogOut 
} from 'lucide-react';
import Logo from '../common/Logo';

export const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e?.preventDefault();
    try {
      if (onLogout) {
        await onLogout();
      }
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const navItems = [
    { label: 'Overview', to: '/', icon: Home, end: true },
    { label: 'Apartment Registry', to: '/apartments', icon: Building2 },
    { label: 'Resident & Tenancy', to: '/residents', icon: Users },
    { label: 'Documents & Repository', to: '/documents', icon: FileText },
    { label: 'Finance & Ledger', to: '/finance', icon: Receipt, badge: 'Soon' },
    { label: 'Maintenance & SLA', to: '/maintenance', icon: Wrench, badge: 'Soon' },
    { label: 'Gate & Visitors', to: '/security', icon: ShieldCheck, badge: 'Soon' },
    { label: 'Audit & Analytics', to: '/analytics', icon: BarChart3, badge: 'Soon' },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <Logo size={28} showWordmark={true} />
      </div>

      {/* Navigation Groups */}
      <div style={styles.navSection}>
        <div style={styles.sectionHeader}>OPERATIONAL MODULES</div>
        <nav style={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                })}
              >
                <Icon size={18} style={styles.navIcon} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span style={styles.badge}>{item.badge}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>{user?.name || 'User'}</div>
            <div style={styles.userRole}>{user?.role || 'Guest'}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '240px',
    height: '100vh',
    backgroundColor: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-hairline)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  brandContainer: {
    padding: '24px 20px',
    borderBottom: '1px solid var(--border-hairline)',
  },
  navSection: {
    padding: '20px 12px',
    flex: 1,
    overflowY: 'auto',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    padding: '0 12px 10px',
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '9px 12px',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '13.5px',
    fontWeight: 500,
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    backgroundColor: 'var(--brand-tint)',
    color: 'var(--brand-primary)',
    fontWeight: 600,
  },
  navIcon: {
    flexShrink: 0,
  },
  badge: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-muted)',
  },
  footer: {
    padding: '16px 16px',
    borderTop: '1px solid var(--border-hairline)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-canvas)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    overflow: 'hidden',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '13px',
    flexShrink: 0,
  },
  userDetails: {
    overflow: 'hidden',
    lineHeight: 1.2,
  },
  userName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--brand-primary)',
  },
  logoutBtn: {
    padding: '6px',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
};

export default Sidebar;
