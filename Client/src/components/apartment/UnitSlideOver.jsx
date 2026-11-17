import React, { useState, useEffect } from 'react';
import { 
  X, 
  Home, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Car, 
  Gauge, 
  Clock, 
  ArrowRight, 
  Edit3,
  Trash2
} from 'lucide-react';
import { getOccupancyHistory, deleteApartment } from '../../services/api';

export const UnitSlideOver = ({ isOpen, onClose, apartment, onOpenUpdateOccupancy, onApartmentDeleted }) => {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (apartment?.id && isOpen) {
      setDeleteError('');
      setLoadingHistory(true);
      getOccupancyHistory(apartment.id)
        .then((res) => setHistory(res))
        .catch((err) => console.error('Failed to load history', err))
        .finally(() => setLoadingHistory(false));
    }
  }, [apartment?.id, isOpen]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete Flat ${apartment.unitNumber}? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteApartment(apartment.id);
      if (onApartmentDeleted) {
        onApartmentDeleted(apartment.id);
      }
      onClose();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete apartment. Ensure it is vacant.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !apartment) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OWNER_OCCUPIED':
        return { label: 'Owner Occupied', bg: 'var(--status-occupied-bg)', color: 'var(--status-occupied-text)', border: 'var(--status-occupied-border)' };
      case 'RENTED':
        return { label: 'Rented to Tenant', bg: 'var(--status-rented-bg)', color: 'var(--status-rented-text)', border: 'var(--status-rented-border)' };
      case 'VACANT':
      default:
        return { label: 'Vacant Unit', bg: 'var(--status-vacant-bg)', color: 'var(--status-vacant-text)', border: 'var(--status-vacant-border)' };
    }
  };

  const badge = getStatusBadge(apartment.occupancyStatus);

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={styles.unitTitle}>Flat {apartment.unitNumber}</h2>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: badge.bg,
                  color: badge.color,
                  borderColor: badge.border,
                }}
              >
                {badge.label}
              </span>
            </div>
            <p style={styles.subtitle}>
              Floor {apartment.floorNumber} • {apartment.blockWing} • {apartment.buildingName}
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        {/* Content Body */}
        <div style={styles.body}>
          {/* Action Callout */}
          <div style={styles.actionCard}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Manage Unit Occupancy</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Move in a tenant, register owner, or vacate unit.
              </div>
            </div>
            <button
              onClick={() => onOpenUpdateOccupancy(apartment)}
              style={styles.actionBtn}
            >
              <Edit3 size={14} />
              <span>Change Status</span>
            </button>
          </div>

          {/* Section: Specifications */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Physical Specifications</div>
            <div style={styles.specsGrid}>
              <div style={styles.specBox}>
                <span style={styles.specLabel}>Gross Area</span>
                <span style={styles.specValue} className="tabular-nums">{apartment.sizeSqft} sqft</span>
              </div>
              <div style={styles.specBox}>
                <span style={styles.specLabel}>Layout</span>
                <span style={styles.specValue}>{apartment.bhkType}</span>
              </div>
              <div style={styles.specBox}>
                <span style={styles.specLabel}>Rooms</span>
                <span style={styles.specValue}>
                  {apartment.numberOfBedrooms} Bed • {apartment.numberOfBathrooms} Bath • {apartment.numberOfBalconies} Balcony
                </span>
              </div>
              <div style={styles.specBox}>
                <span style={styles.specLabel}>Parking Bay</span>
                <span style={styles.specValue}>
                  <Car size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {apartment.parkingSlotNumber || 'None'}
                </span>
              </div>
              <div style={styles.specBox}>
                <span style={styles.specLabel}>Utility Meter</span>
                <span style={styles.specValue}>
                  <Gauge size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {apartment.utilityMeterNumber || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Ownership Details */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Ownership Record</div>
            <div style={styles.infoCard}>
              <div style={styles.infoRow}>
                <User size={15} color="var(--brand-primary)" />
                <span style={styles.infoBold}>{apartment.ownerName || 'Unregistered Owner'}</span>
                {apartment.ownerId && <span style={styles.verifiedTag}>Linked Account</span>}
              </div>
              {apartment.ownerPhone && (
                <div style={styles.infoRow}>
                  <Phone size={14} color="var(--text-muted)" />
                  <span>{apartment.ownerPhone}</span>
                </div>
              )}
              {apartment.ownerEmail && (
                <div style={styles.infoRow}>
                  <Mail size={14} color="var(--text-muted)" />
                  <span>{apartment.ownerEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Active Resident / Occupant */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Active Occupant</div>
            {apartment.currentResidentName ? (
              <div style={styles.infoCard}>
                <div style={styles.infoRow}>
                  <User size={15} color="var(--status-rented-text)" />
                  <span style={styles.infoBold}>{apartment.currentResidentName}</span>
                </div>
                {apartment.currentResidentPhone && (
                  <div style={styles.infoRow}>
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{apartment.currentResidentPhone}</span>
                  </div>
                )}
                {apartment.currentResidentEmail && (
                  <div style={styles.infoRow}>
                    <Mail size={14} color="var(--text-muted)" />
                    <span>{apartment.currentResidentEmail}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.emptyNotice}>
                No active occupant residing in this flat. (Unit is {apartment.occupancyStatus}).
              </div>
            )}
          </div>

          {/* Section: Occupancy Audit History (Pattern F from DESIGN.md) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
              Occupancy Audit Trail
            </div>

            {loadingHistory ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 0' }}>
                Loading transition history...
              </div>
            ) : history.length === 0 ? (
              <div style={styles.emptyNotice}>No recorded transitions for this flat.</div>
            ) : (
              <div style={styles.timeline}>
                {history.map((item, idx) => (
                  <div key={item.id} style={styles.timelineItem}>
                    <div style={styles.timelineDot} />
                    {idx < history.length - 1 && <div style={styles.timelineLine} />}
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.statusTransition}>
                          {item.fromStatus} <ArrowRight size={12} style={{ display: 'inline', margin: '0 4px' }} /> {item.toStatus}
                        </span>
                        <span style={styles.timelineDate} className="tabular-nums">
                          {item.effectiveDate}
                        </span>
                      </div>
                      {item.reasonOrNotes && (
                        <div style={styles.timelineNotes}>{item.reasonOrNotes}</div>
                      )}
                      <div style={styles.timelineAuthor}>
                        Logged by: {item.changedByUserName || 'System'}
                        {item.newResidentName && ` • Resident: ${item.newResidentName}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Danger Zone (Unit Removal) */}
          <div style={styles.dangerSection}>
            {deleteError && <div style={styles.deleteError}>{deleteError}</div>}
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={styles.deleteBtn}
            >
              <Trash2 size={14} />
              <span>{deleting ? 'Removing Unit...' : 'Delete Apartment Unit'}</span>
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Only vacant units can be removed from registry.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    zIndex: 900,
    display: 'flex',
    justifyContent: 'flex-end',
    backdropFilter: 'blur(2px)',
  },
  drawer: {
    width: '100%',
    maxWidth: '440px',
    height: '100vh',
    backgroundColor: 'var(--bg-surface)',
    boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid var(--border-hairline)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-surface)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  unitTitle: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '12.5px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid transparent',
  },
  closeBtn: {
    color: 'var(--text-secondary)',
    padding: '4px',
  },
  body: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  actionCard: {
    padding: '14px 16px',
    borderRadius: '10px',
    backgroundColor: 'var(--brand-tint)',
    border: '1px solid #CCFBF1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '6px',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  specBox: {
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border-hairline)',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  specLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  specValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  infoCard: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    backgroundColor: 'var(--bg-surface)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '13px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoBold: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  verifiedTag: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--brand-primary)',
    backgroundColor: 'var(--brand-tint)',
    padding: '2px 6px',
    borderRadius: '10px',
    border: '1px solid #CCFBF1',
  },
  emptyNotice: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    padding: '8px 0',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  timelineItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  timelineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--brand-primary)',
    marginTop: '6px',
    flexShrink: 0,
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: '3.5px',
    top: '14px',
    bottom: '-14px',
    width: '1px',
    backgroundColor: 'var(--border-strong)',
  },
  timelineContent: {
    flex: 1,
    fontSize: '12.5px',
  },
  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '3px',
  },
  statusTransition: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  timelineDate: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  timelineNotes: {
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  timelineAuthor: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  dangerSection: {
    marginTop: '10px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-hairline)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px 14px',
    borderRadius: '6px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FEE2E2',
    fontWeight: 600,
    fontSize: '12.5px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  deleteError: {
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    fontSize: '12px',
    border: '1px solid #FCA5A5',
  },
};

export default UnitSlideOver;
