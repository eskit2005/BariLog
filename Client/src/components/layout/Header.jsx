import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';

export const Header = ({ buildings = [], selectedBuildingId, onSelectBuilding, user }) => {
  const currentBuilding = buildings.find((b) => b.id === Number(selectedBuildingId)) || buildings[0];

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'MANAGER':
        return { backgroundColor: '#0D9488', color: '#FFFFFF' };
      case 'ADMIN':
        return { backgroundColor: '#4338CA', color: '#FFFFFF' };
      case 'STAFF':
        return { backgroundColor: '#0284C7', color: '#FFFFFF' };
      case 'SECURITY':
        return { backgroundColor: '#D97706', color: '#FFFFFF' };
      case 'RESIDENT':
      default:
        return { backgroundColor: '#475569', color: '#FFFFFF' };
    }
  };

  return (
    <header style={styles.header}>
      {/* Left: Building Context Switcher */}
      <div style={styles.left}>
        <div style={styles.buildingSelectorWrapper}>
          <Building2 size={18} color="var(--brand-primary)" />
          {buildings.length > 1 ? (
            <div style={styles.selectContainer}>
              <select
                value={selectedBuildingId || ''}
                onChange={(e) => onSelectBuilding && onSelectBuilding(Number(e.target.value))}
                style={styles.select}
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={styles.selectArrow} />
            </div>
          ) : (
            <span style={styles.buildingName}>
              {currentBuilding ? currentBuilding.name : 'No Building Configured'}
            </span>
          )}
        </div>

        {currentBuilding && (
          <span style={styles.buildingAddress}>
            {currentBuilding.address} • {currentBuilding.totalFloors} Floors
          </span>
        )}
      </div>

      {/* Right: Operational Status Pill */}
      <div style={styles.right}>
        <div style={styles.statusPill}>
          <span style={styles.statusDot}></span>
          <span>Operations Active</span>
        </div>
        <div style={{ ...styles.roleTag, ...getRoleBadgeStyle(user?.role) }}>
          {user?.role || 'RESIDENT'}
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    height: '60px',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-hairline)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  buildingSelectorWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border-hairline)',
  },
  selectContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    border: 'none',
    background: 'transparent',
    fontWeight: 600,
    fontSize: '13.5px',
    color: 'var(--text-primary)',
    paddingRight: '20px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
  },
  selectArrow: {
    position: 'absolute',
    right: 0,
    pointerEvents: 'none',
    color: 'var(--text-secondary)',
  },
  buildingName: {
    fontWeight: 600,
    fontSize: '13.5px',
    color: 'var(--text-primary)',
  },
  buildingAddress: {
    fontSize: '12.5px',
    color: 'var(--text-secondary)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '20px',
    backgroundColor: 'var(--status-occupied-bg)',
    color: 'var(--status-occupied-text)',
    border: '1px solid var(--status-occupied-border)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--status-occupied-text)',
  },
  roleTag: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    letterSpacing: '0.04em',
  },
};

export default Header;
