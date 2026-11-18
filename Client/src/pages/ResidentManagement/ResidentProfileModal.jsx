import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  FileText,
  Phone,
  Mail,
  Shield,
  Heart,
  Briefcase,
  Calendar,
  AlertCircle,
  Plus,
  Clock,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { getResidentHistory } from '../../services/api';

export const ResidentProfileModal = ({
  isOpen,
  resident,
  onClose,
  onAllocate,
  onMoveOut,
  onScheduleInspection,
}) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'history'
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && resident) {
      loadHistory();
    }
  }, [isOpen, resident]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getResidentHistory(resident.id);
      setHistoryData(data || []);
    } catch {
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !resident) return null;

  const currentUnit = resident.currentApartment || (resident.apartmentId ? {
    id: resident.apartmentId,
    unitNumber: resident.unitNumber,
    buildingName: resident.buildingName,
    floorNumber: resident.floorNumber,
    bhkType: resident.bhkType,
    sizeSqft: resident.sizeSqft,
    occupancyStatus: resident.occupancyStatus,
  } : null);

  const activeAgreement = resident.activeAgreement || (resident.activeAgreementId ? {
    id: resident.activeAgreementId,
    agreementNumber: resident.activeAgreementNumber,
    rentAmount: resident.rentAmount,
    depositAmount: resident.depositAmount,
    startDate: resident.tenancyStartDate,
    endDate: resident.tenancyEndDate,
    status: resident.tenancyStatus,
  } : null);

  const isOwner = resident.classification === 'Owner' || (resident.residentType && resident.residentType.includes('OWNER'));
  const emergencyName = resident.emergencyContact?.name || resident.emergencyContactName;
  const emergencyPhone = resident.emergencyContact?.phone || resident.emergencyContactPhone;
  const agreementsList = Array.isArray(historyData) ? historyData : (historyData?.tenancyAgreements || []);

  return (
    <div style={styles.overlay}>
      <div style={styles.drawer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              ...styles.avatar,
              backgroundColor: isOwner ? 'var(--status-occupied-bg)' : 'var(--status-rented-bg)',
              color: isOwner ? 'var(--status-occupied-text)' : 'var(--status-rented-text)',
            }}>
              {resident.name ? resident.name.slice(0, 2).toUpperCase() : 'RE'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {resident.name}
                </h2>
                <span
                  style={{
                    ...styles.badge,
                    backgroundColor: isOwner ? 'var(--status-occupied-bg)' : 'var(--status-rented-bg)',
                    color: isOwner ? 'var(--status-occupied-text)' : 'var(--status-rented-text)',
                  }}
                >
                  {isOwner ? 'Owner Resident' : 'Tenant'}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {resident.email} • {resident.phoneNumber || 'No phone'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabBar}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{ ...styles.tabBtn, ...(activeTab === 'profile' ? styles.tabBtnActive : {}) }}
          >
            Profile & Unit
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{ ...styles.tabBtn, ...(activeTab === 'history' ? styles.tabBtnActive : {}) }}
          >
            Tenancy History & Archive ({agreementsList.length})
          </button>
        </div>

        {/* Body content */}
        <div style={styles.body}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Current Apartment Card */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={16} color="var(--brand-primary)" />
                    <span style={styles.cardTitle}>Assigned Apartment Unit</span>
                  </div>
                  {currentUnit ? (
                    <button
                      onClick={() => onMoveOut && onMoveOut(resident)}
                      style={styles.moveOutBtn}
                    >
                      <LogOut size={13} style={{ marginRight: 4 }} />
                      Process Move-Out
                    </button>
                  ) : (
                    <button
                      onClick={() => onAllocate && onAllocate(resident)}
                      style={styles.allocateBtn}
                    >
                      <Plus size={13} style={{ marginRight: 4 }} />
                      Allocate Unit
                    </button>
                  )}
                </div>

                {currentUnit ? (
                  <div style={styles.unitDetails}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={styles.unitNumber}>Unit {currentUnit.unitNumber}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {currentUnit.buildingName} • Floor {currentUnit.floorNumber}
                      </span>
                    </div>

                    <div style={styles.specGrid}>
                      <div style={styles.specItem}>
                        <span style={styles.specLabel}>Layout</span>
                        <span style={styles.specValue}>{currentUnit.bhkType || '—'}</span>
                      </div>
                      <div style={styles.specItem}>
                        <span style={styles.specLabel}>Gross Area</span>
                        <span style={styles.specValue}>{currentUnit.sizeSqft ? `${currentUnit.sizeSqft} sqft` : '—'}</span>
                      </div>
                      <div style={styles.specItem}>
                        <span style={styles.specLabel}>Occupancy</span>
                        <span style={{ ...styles.specValue, color: isOwner ? 'var(--status-occupied-text)' : 'var(--status-rented-text)' }}>
                          {currentUnit.occupancyStatus || (isOwner ? 'OWNER_OCCUPIED' : 'RENTED')}
                        </span>
                      </div>
                      <div style={styles.specItem}>
                        <span style={styles.specLabel}>Role</span>
                        <span style={styles.specValue}>{isOwner ? 'Owner' : 'Tenant'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.emptyUnitNotice}>
                    <AlertCircle size={18} color="var(--text-muted)" />
                    <div>
                      <strong>No apartment currently allocated.</strong> This resident does not currently reside in an active flat.
                    </div>
                  </div>
                )}
              </div>

              {/* Active Tenancy Agreement Card (if Tenant) */}
              {!isOwner && activeAgreement && (
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} color="var(--brand-primary)" />
                      <span style={styles.cardTitle}>Active Tenancy Agreement</span>
                    </div>
                    <span style={styles.activeTag}>{activeAgreement.status}</span>
                  </div>

                  <div style={styles.specGrid}>
                    <div style={styles.specItem}>
                      <span style={styles.specLabel}>Agreement Reference</span>
                      <span style={styles.specValue}>{activeAgreement.agreementNumber}</span>
                    </div>
                    <div style={styles.specItem}>
                      <span style={styles.specLabel}>Monthly Rent</span>
                      <span style={styles.specValue}>BDT {Number(activeAgreement.rentAmount).toLocaleString()}/mo</span>
                    </div>
                    <div style={styles.specItem}>
                      <span style={styles.specLabel}>Security Deposit</span>
                      <span style={styles.specValue}>BDT {Number(activeAgreement.depositAmount || 0).toLocaleString()}</span>
                    </div>
                    <div style={styles.specItem}>
                      <span style={styles.specLabel}>Lease Duration</span>
                      <span style={styles.specValue}>
                        {activeAgreement.startDate} to {activeAgreement.endDate}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Profile Specs */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} color="var(--brand-primary)" />
                    <span style={styles.cardTitle}>Resident Profile Attributes</span>
                  </div>
                </div>

                <div style={styles.specGrid}>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>NID / Passport #</span>
                    <span style={styles.specValue}>{resident.nidPassportNumber || '—'}</span>
                  </div>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Blood Group</span>
                    <span style={styles.specValue}>{resident.bloodGroup || '—'}</span>
                  </div>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Occupation</span>
                    <span style={styles.specValue}>{resident.occupation || '—'}</span>
                  </div>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Classification</span>
                    <span style={styles.specValue}>{resident.classification || (isOwner ? 'Owner' : 'Tenant')}</span>
                  </div>
                </div>
              </div>

              {/* Shared Emergency Contact Details (Integrated with R4 model) */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Heart size={16} color="var(--brand-primary)" />
                    <span style={styles.cardTitle}>Emergency Contact Information</span>
                  </div>
                </div>

                <div style={styles.specGrid}>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Contact Person</span>
                    <span style={styles.specValue}>{emergencyName || 'None recorded'}</span>
                  </div>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Emergency Phone</span>
                    <span style={styles.specValue}>{emergencyPhone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Historical Tenancy Agreements */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} color="var(--brand-primary)" />
                    <span style={styles.cardTitle}>Tenancy Agreements (Active & Historical Archive)</span>
                  </div>
                </div>

                {loadingHistory ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
                ) : agreementsList.length === 0 ? (
                  <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No tenancy agreements recorded for this resident.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {agreementsList.map((ag) => (
                      <div key={ag.id} style={styles.historyRow}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                            {ag.agreementNumber} {ag.unitNumber ? `• Unit ${ag.unitNumber}` : ''} {ag.buildingName ? `(${ag.buildingName})` : ''}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {ag.startDate} to {ag.endDate} • Rent: BDT {Number(ag.rentAmount).toLocaleString()}/mo • Deposit: BDT {Number(ag.depositAmount || 0).toLocaleString()}
                          </div>
                          {ag.notes && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                              {ag.notes}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: ag.isArchived ? 'var(--bg-subtle)' : 'var(--brand-tint)',
                            color: ag.isArchived ? 'var(--text-muted)' : 'var(--brand-primary)',
                          }}
                        >
                          {ag.status} {ag.isArchived ? '(Archived)' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  drawer: {
    width: '560px',
    maxWidth: '100vw',
    height: '100vh',
    backgroundColor: 'var(--bg-surface)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
    animation: 'slideInRight 0.2s ease-out',
  },
  header: {
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-hairline)',
    backgroundColor: 'var(--bg-surface)',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '15px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    padding: '8px 24px 0',
    borderBottom: '1px solid var(--border-hairline)',
    backgroundColor: 'var(--bg-surface)',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    color: 'var(--brand-primary)',
    borderBottomColor: 'var(--brand-primary)',
    fontWeight: 600,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    border: '1px solid var(--border-hairline)',
    borderRadius: '10px',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  unitDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  unitNumber: {
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  specGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  specItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  specLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
  },
  specValue: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  activeTag: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'var(--status-occupied-bg)',
    color: 'var(--status-occupied-text)',
  },
  emptyUnitNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '8px',
    fontSize: '12.5px',
    color: 'var(--text-secondary)',
  },
  allocateBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: 'var(--brand-primary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  moveOutBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--status-vacant-text)',
    backgroundColor: 'var(--status-vacant-bg)',
    border: '1px solid var(--status-vacant-text)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  historyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '8px',
  },
};

export default ResidentProfileModal;
