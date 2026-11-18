import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Receipt, Wrench, Shield, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export const Overview = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const modules = [
    {
      title: isManager ? 'Apartment Registry & Occupancy' : 'Building Directory & Units',
      feature: 'Feature 01 (Active)',
      desc: isManager
        ? 'Physical building elevation, floor wings, unit specs (sqft, BHK), and real-time occupancy status (Vacant / Owner / Rented).'
        : 'View building elevation layout, flat numbers, physical specifications, and authorized community directory.',
      icon: Building2,
      path: '/apartments',
      ready: true,
    },
    {
      title: 'Resident & Tenancy Management',
      feature: 'Feature 02 (Active)',
      desc: isManager
        ? 'Resident profiles, Owner vs. Tenant classifications, apartment allocations, tenancy agreements, and move-in/move-out lifecycle.'
        : 'View assigned apartment profile, lease agreements, move-in inspections, and emergency contact details.',
      icon: Users,
      path: '/residents',
      ready: true,
    },
    {
      title: 'Finance & Automated Billing',
      feature: 'Features 05–08',
      desc: 'Area-based monthly service charge generation, online payment records, expense tracking, and resident transparency dashboard.',
      icon: Receipt,
      path: '/finance',
      ready: false,
    },
    {
      title: 'Maintenance & SLA Telemetry',
      feature: 'Features 09–13',
      desc: 'Complaint ticketing with photos, priority SLA timers, recurring preventive maintenance, and vendor quotations.',
      icon: Wrench,
      path: '/maintenance',
      ready: false,
    },
    {
      title: 'Gate Security & Visitor PINs',
      feature: 'Features 14–17',
      desc: 'Pre-approved visitor gate check-in, parcel shelf register, and building-wide emergency/incident broadcast.',
      icon: Shield,
      path: '/security',
      ready: false,
    },
  ];

  return (
    <div style={styles.container}>
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <span style={styles.badge}>
            {isManager ? 'MANAGEMENT CONSOLE' : 'RESIDENT PORTAL'}
          </span>
          <h1 style={styles.bannerTitle}>
            {isManager ? 'BariLog Operations Platform' : `Welcome, ${user?.name || 'Resident'}`}
          </h1>
          <p style={styles.bannerSubtitle}>
            {isManager
              ? 'A centralized system for 50–100 apartment communities, replacing WhatsApp complaints and spreadsheet records.'
              : 'Your building operations portal. Inspect floor directories, check shared facilities, and keep track of community notices.'}
          </p>
        </div>
        <button onClick={() => navigate('/apartments')} style={styles.bannerBtn}>
          <span>{isManager ? 'Open Apartment Registry' : 'View Building Directory'}</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Module Grid */}
      <div style={styles.grid}>
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              style={{
                ...styles.card,
                ...(m.ready ? styles.cardActive : styles.cardDisabled),
              }}
              onClick={() => m.ready && navigate(m.path)}
            >
              <div style={styles.cardHeader}>
                <div style={styles.iconBox}>
                  <Icon size={22} color={m.ready ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                </div>
                <span
                  style={{
                    ...styles.featureTag,
                    color: m.ready ? 'var(--brand-primary)' : 'var(--text-muted)',
                    backgroundColor: m.ready ? 'var(--brand-tint)' : 'var(--bg-subtle)',
                  }}
                >
                  {m.feature}
                </span>
              </div>
              <h3 style={styles.cardTitle}>{m.title}</h3>
              <p style={styles.cardDesc}>{m.desc}</p>
              <div style={styles.cardFooter}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: m.ready ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                  {m.ready ? 'Launch Module →' : 'In Next Release'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  banner: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px 36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--brand-primary)',
  },
  bannerTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginTop: '6px',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
  },
  bannerSubtitle: {
    fontSize: '13.5px',
    color: '#94A3B8',
    marginTop: '6px',
    maxWidth: '560px',
  },
  bannerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13.5px',
    whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-hairline)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'all 0.15s ease',
  },
  cardActive: {
    cursor: 'pointer',
    borderColor: 'var(--border-hairline)',
  },
  cardDisabled: {
    opacity: 0.85,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTag: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '12px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  cardDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    flex: 1,
  },
  cardFooter: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border-hairline)',
  },
};

export default Overview;
