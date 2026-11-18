import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Users,
  Building2,
  FileText,
  ClipboardList,
  Search,
  Filter,
  Plus,
  LogOut,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  ArrowRight,
  Eye,
  Trash2,
  Key,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import {
  getResidents,
  getTenancyAgreements,
  getInspections,
  terminateTenancyAgreement,
  getApartments,
  getApartmentTenancyHistory,
  getOccupancyHistory,
} from '../../services/api';
import CreateResidentModal from './CreateResidentModal';
import AllocateApartmentModal from './AllocateApartmentModal';
import MoveOutModal from './MoveOutModal';
import ScheduleInspectionModal from './ScheduleInspectionModal';
import InspectionDetailsModal from './InspectionDetailsModal';
import ResidentProfileModal from './ResidentProfileModal';

export const ResidentManagementView = () => {
  const { user } = useContext(AuthContext);
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  // Navigation tab: 'residents' | 'agreements' | 'inspections' | 'history'
  const [activeTab, setActiveTab] = useState('residents');

  // Data states
  const [residents, setResidents] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter states for Residents
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('ALL'); // ALL, OWNER, TENANT
  const [allocationFilter, setAllocationFilter] = useState('ALL'); // ALL, ALLOCATED, UNALLOCATED

  // Filter states for Agreements & Inspections
  const [agreementStatusFilter, setAgreementStatusFilter] = useState('ALL');
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState('ALL');

  // History inspection lookup state
  const [historyApartmentId, setHistoryApartmentId] = useState('');
  const [apartmentHistoryAgreements, setApartmentHistoryAgreements] = useState([]);
  const [apartmentHistoryTransitions, setApartmentHistoryTransitions] = useState([]);
  const [loadingApartmentHistory, setLoadingApartmentHistory] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInspectionDetailsOpen, setIsInspectionDetailsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Selected entities for modals
  const [selectedResident, setSelectedResident] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resData, agData, insData, aptData] = await Promise.all([
        getResidents(),
        getTenancyAgreements(),
        getInspections(),
        getApartments(),
      ]);

      setResidents(resData || []);
      setAgreements(agData || []);
      setInspections(insData || []);
      setApartments(aptData || []);

      if (aptData && aptData.length > 0 && !historyApartmentId) {
        setHistoryApartmentId(String(aptData[0].id));
        loadApartmentHistory(aptData[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load resident and tenancy records');
    } finally {
      setLoading(false);
    }
  };

  const loadApartmentHistory = async (aptId) => {
    if (!aptId) return;
    setLoadingApartmentHistory(true);
    try {
      const [agList, histList] = await Promise.all([
        getApartmentTenancyHistory(aptId),
        getOccupancyHistory(aptId),
      ]);
      setApartmentHistoryAgreements(agList || []);
      setApartmentHistoryTransitions(histList || []);
    } catch {
      setApartmentHistoryAgreements([]);
      setApartmentHistoryTransitions([]);
    } finally {
      setLoadingApartmentHistory(false);
    }
  };

  const handleApartmentHistoryChange = (e) => {
    const id = e.target.value;
    setHistoryApartmentId(id);
    loadApartmentHistory(id);
  };

  const handleTerminateAgreement = async (agreementId) => {
    const reason = window.prompt('Specify reason for agreement termination / early archiving:');
    if (reason === null) return;

    try {
      await terminateTenancyAgreement(agreementId, reason);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to terminate agreement');
    }
  };

  // Filtered residents calculation
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      // Classification filter
      if (classificationFilter !== 'ALL') {
        const isOwner = r.classification === 'Owner' || (r.residentType && r.residentType.includes('OWNER'));
        if (classificationFilter === 'OWNER' && !isOwner) return false;
        if (classificationFilter === 'TENANT' && isOwner) return false;
      }

      // Allocation filter
      if (allocationFilter === 'ALLOCATED' && !r.currentApartment) return false;
      if (allocationFilter === 'UNALLOCATED' && r.currentApartment) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = r.name?.toLowerCase().includes(q);
        const emailMatch = r.email?.toLowerCase().includes(q);
        const phoneMatch = r.phoneNumber?.toLowerCase().includes(q);
        const nidMatch = r.nidPassportNumber?.toLowerCase().includes(q);
        const unitMatch = r.currentApartment?.unitNumber?.toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || nidMatch || unitMatch;
      }

      return true;
    });
  }, [residents, classificationFilter, allocationFilter, searchQuery]);

  // Filtered agreements calculation
  const filteredAgreements = useMemo(() => {
    return agreements.filter((ag) => {
      if (agreementStatusFilter === 'ALL') return true;
      if (agreementStatusFilter === 'ARCHIVED') return ag.isArchived;
      return ag.status === agreementStatusFilter;
    });
  }, [agreements, agreementStatusFilter]);

  // Filtered inspections calculation
  const filteredInspections = useMemo(() => {
    return inspections.filter((ins) => {
      if (inspectionTypeFilter === 'ALL') return true;
      return ins.inspectionType === inspectionTypeFilter || ins.status === inspectionTypeFilter;
    });
  }, [inspections, inspectionTypeFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalResidents = residents.length;
    const ownersCount = residents.filter(
      (r) => r.classification === 'Owner' || (r.residentType && r.residentType.includes('OWNER'))
    ).length;
    const tenantsCount = totalResidents - ownersCount;
    const activeAgreementsCount = agreements.filter(
      (a) => a.status === 'ACTIVE' && !a.isArchived
    ).length;
    const scheduledInspectionsCount = inspections.filter(
      (i) => i.status === 'SCHEDULED'
    ).length;

    return {
      totalResidents,
      ownersCount,
      tenantsCount,
      activeAgreementsCount,
      scheduledInspectionsCount,
    };
  }, [residents, agreements, inspections]);

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.moduleTag}>FEATURE 02</span>
            <span style={styles.roleTag}>
              {isManager ? 'MANAGEMENT CONSOLE' : 'RESIDENT VIEW'}
            </span>
          </div>
          <h1 style={styles.title}>Resident & Tenancy Management</h1>
          <p style={styles.subtitle}>
            Centralized register for resident profiles, apartment allocations, tenancy agreements, and move-in/move-out lifecycle tracking.
          </p>
        </div>

        {isManager && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsScheduleModalOpen(true)} style={styles.secondaryBtn}>
              <ClipboardList size={16} />
              <span>Schedule Inspection</span>
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} style={styles.primaryBtn}>
              <Plus size={16} />
              <span>Register Resident</span>
            </button>
          </div>
        )}
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Metrics Ribbon */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Total Registered Residents</span>
          <span style={styles.metricValue}>{stats.totalResidents}</span>
          <span style={styles.metricSub}>All verified accounts</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Resident Owners</span>
          <span style={{ ...styles.metricValue, color: 'var(--status-occupied-text)' }}>
            {stats.ownersCount}
          </span>
          <span style={styles.metricSub}>Direct apartment title holders</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Active Tenants</span>
          <span style={{ ...styles.metricValue, color: 'var(--status-rented-text)' }}>
            {stats.tenantsCount}
          </span>
          <span style={styles.metricSub}>Contractual leaseholders</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Active Tenancy Leases</span>
          <span style={styles.metricValue}>{stats.activeAgreementsCount}</span>
          <span style={styles.metricSub}>Non-archived active agreements</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Pending Inspections</span>
          <span style={{ ...styles.metricValue, color: 'var(--accent-amber)' }}>
            {stats.scheduledInspectionsCount}
          </span>
          <span style={styles.metricSub}>Scheduled move-in / move-out</span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab('residents')}
          style={{ ...styles.tab, ...(activeTab === 'residents' ? styles.tabActive : {}) }}
        >
          <Users size={16} />
          <span>Resident Profiles & Allocations</span>
          <span style={styles.tabCount}>{residents.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('agreements')}
          style={{ ...styles.tab, ...(activeTab === 'agreements' ? styles.tabActive : {}) }}
        >
          <FileText size={16} />
          <span>Tenancy Agreements</span>
          <span style={styles.tabCount}>{agreements.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('inspections')}
          style={{ ...styles.tab, ...(activeTab === 'inspections' ? styles.tabActive : {}) }}
        >
          <ClipboardList size={16} />
          <span>Move-In & Move-Out Inspections</span>
          <span style={styles.tabCount}>{inspections.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{ ...styles.tab, ...(activeTab === 'history' ? styles.tabActive : {}) }}
        >
          <Clock size={16} />
          <span>Historical Tenancies & Traceability</span>
        </button>
      </div>

      {/* TAB 1: Residents Directory */}
      {activeTab === 'residents' && (
        <div style={styles.tabContent}>
          {/* Controls Bar */}
          <div style={styles.filterBar}>
            <div style={styles.searchBox}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search residents by name, email, phone, NID, or apartment unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="ALL">All Classifications</option>
                <option value="OWNER">Owners Only</option>
                <option value="TENANT">Tenants Only</option>
              </select>

              <select
                value={allocationFilter}
                onChange={(e) => setAllocationFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="ALL">All Allocation States</option>
                <option value="ALLOCATED">Assigned to Flat</option>
                <option value="UNALLOCATED">Unassigned / Pending</option>
              </select>
            </div>
          </div>

          {/* Residents Table */}
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Resident Name</th>
                  <th style={styles.th}>Classification</th>
                  <th style={styles.th}>Allocated Unit</th>
                  <th style={styles.th}>Contact Info</th>
                  <th style={styles.th}>Emergency Contact</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyTd}>Loading resident directory...</td>
                  </tr>
                ) : filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyTd}>
                      No resident records match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredResidents.map((r) => {
                    const isOwner = r.classification === 'Owner' || (r.residentType && r.residentType.includes('OWNER'));
                    const unit = r.currentApartment;

                    return (
                      <tr key={r.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={styles.tableAvatar}>
                              {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {r.name}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                {r.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.pill,
                              backgroundColor: isOwner ? 'var(--status-occupied-bg)' : 'var(--status-rented-bg)',
                              color: isOwner ? 'var(--status-occupied-text)' : 'var(--status-rented-text)',
                              borderColor: isOwner ? 'var(--status-occupied-border)' : 'var(--status-rented-border)',
                            }}
                          >
                            {isOwner ? 'Owner' : 'Tenant'}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {unit ? (
                            <div>
                              <span style={styles.unitPill}>
                                <Building2 size={12} style={{ marginRight: 3 }} />
                                Unit {unit.unitNumber}
                              </span>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {unit.buildingName} • Fl {unit.floorNumber}
                              </div>
                            </div>
                          ) : (
                            <span style={styles.unassignedPill}>Unassigned</span>
                          )}
                        </td>

                        <td style={styles.td}>
                          <div style={{ fontSize: '12.5px' }}>{r.phoneNumber || '—'}</div>
                          {r.nidPassportNumber && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              NID: {r.nidPassportNumber}
                            </div>
                          )}
                        </td>

                        <td style={styles.td}>
                          {r.emergencyContactName ? (
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 500 }}>
                                {r.emergencyContactName} ({r.emergencyContactRelationship || 'Emergency'})
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                {r.emergencyContactPhone}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not configured</span>
                          )}
                        </td>

                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedResident(r);
                                setIsProfileModalOpen(true);
                              }}
                              style={styles.actionBtn}
                              title="View Resident Profile"
                            >
                              <Eye size={14} />
                              <span>Profile</span>
                            </button>

                            {isManager && (
                              <>
                                {unit ? (
                                  <button
                                    onClick={() => {
                                      setSelectedResident(r);
                                      setIsMoveOutModalOpen(true);
                                    }}
                                    style={styles.moveOutActionBtn}
                                    title="Process Move-Out"
                                  >
                                    <LogOut size={14} />
                                    <span>Move Out</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedResident(r);
                                      setIsAllocateModalOpen(true);
                                    }}
                                    style={styles.allocateActionBtn}
                                    title="Allocate Apartment"
                                  >
                                    <Building2 size={14} />
                                    <span>Allocate</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Tenancy Agreements */}
      {activeTab === 'agreements' && (
        <div style={styles.tabContent}>
          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Contractual Lease Records & Active Tenancies
            </div>

            <select
              value={agreementStatusFilter}
              onChange={(e) => setAgreementStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">All Agreement Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="TERMINATED">TERMINATED</option>
              <option value="ARCHIVED">ARCHIVED ONLY</option>
            </select>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Agreement Ref #</th>
                  <th style={styles.th}>Unit & Building</th>
                  <th style={styles.th}>Tenant Resident</th>
                  <th style={styles.th}>Lease Duration</th>
                  <th style={styles.th}>Monthly Rent</th>
                  <th style={styles.th}>Status</th>
                  {isManager && <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAgreements.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 7 : 6} style={styles.emptyTd}>
                      No tenancy agreements recorded.
                    </td>
                  </tr>
                ) : (
                  filteredAgreements.map((ag) => {
                    const isArchived = ag.isArchived || ag.status === 'TERMINATED' || ag.status === 'EXPIRED';

                    return (
                      <tr key={ag.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ag.agreementNumber}
                          </div>
                          {ag.paymentFrequency && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Schedule: {ag.paymentFrequency}
                            </div>
                          )}
                        </td>

                        <td style={styles.td}>
                          <span style={styles.unitPill}>
                            Unit {ag.unitNumber}
                          </span>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {ag.buildingName}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div style={{ fontWeight: 500 }}>{ag.residentName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ag.residentPhone}</div>
                        </td>

                        <td style={styles.td}>
                          <div style={{ fontSize: '12.5px' }}>
                            {ag.startDate} to {ag.endDate}
                          </div>
                          {ag.depositAmount > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Deposit: BDT {Number(ag.depositAmount).toLocaleString()}
                            </div>
                          )}
                        </td>

                        <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 600 }}>
                          BDT {Number(ag.rentAmount).toLocaleString()}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.pill,
                              backgroundColor: ag.status === 'ACTIVE' ? 'var(--status-occupied-bg)' : ag.status === 'UPCOMING' ? 'var(--brand-tint)' : 'var(--bg-subtle)',
                              color: ag.status === 'ACTIVE' ? 'var(--status-occupied-text)' : ag.status === 'UPCOMING' ? 'var(--brand-primary)' : 'var(--text-muted)',
                              borderColor: ag.status === 'ACTIVE' ? 'var(--status-occupied-border)' : 'var(--border-hairline)',
                            }}
                          >
                            {ag.status} {ag.isArchived ? '(Archived)' : ''}
                          </span>
                        </td>

                        {isManager && (
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            {!ag.isArchived && ag.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleTerminateAgreement(ag.id)}
                                style={styles.terminateActionBtn}
                                title="Terminate & Archive Agreement Early"
                              >
                                Terminate
                              </button>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Archived</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Move-In & Move-Out Inspections */}
      {activeTab === 'inspections' && (
        <div style={styles.tabContent}>
          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Unit Condition Verifications & Key Handover Logs
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={inspectionTypeFilter}
                onChange={(e) => setInspectionTypeFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="ALL">All Inspections</option>
                <option value="MOVE_IN">Move-In Only</option>
                <option value="MOVE_OUT">Move-Out Only</option>
                <option value="SCHEDULED">Scheduled / Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {isManager && (
                <button onClick={() => setIsScheduleModalOpen(true)} style={styles.primaryBtnSmall}>
                  <Plus size={14} />
                  <span>New Inspection</span>
                </button>
              )}
            </div>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Apartment Unit</th>
                  <th style={styles.th}>Resident</th>
                  <th style={styles.th}>Schedule Date & Time</th>
                  <th style={styles.th}>Inspector</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Key Handover</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={styles.emptyTd}>No inspection logs recorded.</td>
                  </tr>
                ) : (
                  filteredInspections.map((ins) => {
                    const isMoveIn = ins.inspectionType === 'MOVE_IN';

                    return (
                      <tr key={ins.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.pill,
                              backgroundColor: isMoveIn ? 'var(--brand-tint)' : 'var(--status-pending-bg)',
                              color: isMoveIn ? 'var(--brand-primary)' : 'var(--accent-amber)',
                              borderColor: isMoveIn ? 'var(--brand-primary)' : 'var(--accent-amber)',
                            }}
                          >
                            {isMoveIn ? 'MOVE-IN' : 'MOVE-OUT'}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span style={styles.unitPill}>Unit {ins.unitNumber}</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ins.buildingName}</div>
                        </td>

                        <td style={styles.td}>
                          <div style={{ fontWeight: 500 }}>{ins.residentName}</div>
                        </td>

                        <td style={styles.td}>
                          <div style={{ fontSize: '12.5px' }}>{ins.scheduledDate}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ins.scheduledTime || '10:00 AM'}</div>
                        </td>

                        <td style={styles.td}>
                          <div style={{ fontSize: '12.5px' }}>{ins.inspectorName || '—'}</div>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.pill,
                              backgroundColor: ins.status === 'COMPLETED' ? 'var(--status-occupied-bg)' : ins.status === 'SCHEDULED' ? 'var(--status-pending-bg)' : 'var(--bg-subtle)',
                              color: ins.status === 'COMPLETED' ? 'var(--status-occupied-text)' : ins.status === 'SCHEDULED' ? 'var(--accent-amber)' : 'var(--text-muted)',
                            }}
                          >
                            {ins.status}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {ins.keysHandedOver ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--status-occupied-text)', fontSize: '12px' }}>
                              <CheckCircle2 size={14} /> Confirmed
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending</span>
                          )}
                        </td>

                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedInspection(ins);
                              setIsInspectionDetailsOpen(true);
                            }}
                            style={styles.actionBtn}
                          >
                            <ClipboardList size={14} />
                            <span>{ins.status === 'SCHEDULED' ? 'Complete' : 'Findings'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Historical Records & Traceability */}
      {activeTab === 'history' && (
        <div style={styles.tabContent}>
          <div style={styles.historySelectorCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--brand-primary)" />
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Inspect Unit Occupancy & Historical Tenancies Ledger
              </label>
            </div>
            <select
              value={historyApartmentId}
              onChange={handleApartmentHistoryChange}
              style={styles.apartmentSelect}
            >
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  Unit {apt.unitNumber} ({apt.buildingName}) — Currently {apt.occupancyStatus}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.historyColumns}>
            {/* Historical Agreements */}
            <div style={styles.historyColCard}>
              <div style={styles.historyColHeader}>
                <FileText size={16} color="var(--brand-primary)" />
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
                  Tenancy Agreements Archive ({apartmentHistoryAgreements.length})
                </span>
              </div>

              {loadingApartmentHistory ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
              ) : apartmentHistoryAgreements.length === 0 ? (
                <div style={styles.emptyNotice}>No previous tenancy agreements recorded for this unit.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {apartmentHistoryAgreements.map((ag) => (
                    <div key={ag.id} style={styles.historyItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{ag.agreementNumber}</span>
                        <span style={styles.archivedTag}>{ag.status} {ag.isArchived ? '(Archived)' : ''}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Tenant: <strong>{ag.residentName}</strong> ({ag.residentPhone})
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Lease: {ag.startDate} to {ag.endDate} • Rent: BDT {Number(ag.rentAmount).toLocaleString()}/mo
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Occupancy Transitions Audit Log */}
            <div style={styles.historyColCard}>
              <div style={styles.historyColHeader}>
                <Clock size={16} color="var(--brand-primary)" />
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
                  Occupancy State Transitions & Audit Trail ({apartmentHistoryTransitions.length})
                </span>
              </div>

              {loadingApartmentHistory ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
              ) : apartmentHistoryTransitions.length === 0 ? (
                <div style={styles.emptyNotice}>No occupancy transitions on record for this unit.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {apartmentHistoryTransitions.map((t) => (
                    <div key={t.id} style={styles.historyItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {t.fromStatus} → {t.toStatus}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{t.effectiveDate}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Transition authorized by: <strong>{t.changedByName || 'Manager'}</strong>
                      </div>
                      {t.reasonOrNotes && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                          Reason: {t.reasonOrNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateResidentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => loadAllData()}
      />

      <AllocateApartmentModal
        isOpen={isAllocateModalOpen}
        resident={selectedResident}
        onClose={() => {
          setIsAllocateModalOpen(false);
          setSelectedResident(null);
        }}
        onAllocated={() => loadAllData()}
      />

      <MoveOutModal
        isOpen={isMoveOutModalOpen}
        resident={selectedResident}
        onClose={() => {
          setIsMoveOutModalOpen(false);
          setSelectedResident(null);
        }}
        onMovedOut={() => loadAllData()}
      />

      <ScheduleInspectionModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduled={() => loadAllData()}
      />

      <InspectionDetailsModal
        isOpen={isInspectionDetailsOpen}
        inspection={selectedInspection}
        onClose={() => {
          setIsInspectionDetailsOpen(false);
          setSelectedInspection(null);
        }}
        onUpdated={() => loadAllData()}
      />

      <ResidentProfileModal
        isOpen={isProfileModalOpen}
        resident={selectedResident}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedResident(null);
        }}
        onAllocate={(res) => {
          setIsProfileModalOpen(false);
          setSelectedResident(res);
          setIsAllocateModalOpen(true);
        }}
        onMoveOut={(res) => {
          setIsProfileModalOpen(false);
          setSelectedResident(res);
          setIsMoveOutModalOpen(true);
        }}
        onScheduleInspection={(res) => {
          setIsProfileModalOpen(false);
          setIsScheduleModalOpen(true);
        }}
      />
    </div>
  );
};

const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '1440px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  moduleTag: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'var(--brand-tint)',
    color: 'var(--brand-primary)',
    border: '1px solid var(--border-hairline)',
  },
  roleTag: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-hairline)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13.5px',
    color: 'var(--text-secondary)',
    margin: 0,
    maxWidth: '750px',
  },
  primaryBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '13px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
  },
  secondaryBtn: {
    padding: '10px 16px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-hairline)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: '13px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  primaryBtnSmall: {
    padding: '8px 14px',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '12.5px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    border: 'none',
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: 'var(--status-vacant-bg)',
    color: 'var(--status-vacant-text)',
    border: '1px solid var(--status-vacant-border)',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '14px',
    marginBottom: '24px',
  },
  metricCard: {
    padding: '16px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '6px 0 2px 0',
    fontVariantNumeric: 'tabular-nums',
  },
  metricSub: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid var(--border-hairline)',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
  },
  tabActive: {
    color: 'var(--brand-primary)',
    fontWeight: 600,
    borderBottom: '2px solid var(--brand-primary)',
  },
  tabCount: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-secondary)',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: 'var(--bg-surface)',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    maxWidth: '520px',
  },
  searchInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-hairline)',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  tableCard: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  th: {
    padding: '12px 16px',
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '12px',
    borderBottom: '1px solid var(--border-hairline)',
  },
  tr: {
    borderBottom: '1px solid var(--border-hairline)',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle',
  },
  emptyTd: {
    padding: '36px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13.5px',
  },
  tableAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--brand-tint)',
    color: 'var(--brand-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '13px',
    border: '1px solid var(--border-hairline)',
  },
  pill: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid var(--border-hairline)',
    display: 'inline-block',
  },
  unitPill: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '6px',
    backgroundColor: 'var(--brand-tint)',
    color: 'var(--brand-primary)',
    border: '1px solid var(--border-hairline)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  unassignedPill: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  actionBtn: {
    padding: '5px 10px',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-hairline)',
    fontSize: '12px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-primary)',
  },
  allocateActionBtn: {
    padding: '5px 10px',
    borderRadius: '6px',
    backgroundColor: 'var(--brand-tint)',
    border: '1px solid var(--brand-primary)',
    fontSize: '12px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--brand-primary)',
  },
  moveOutActionBtn: {
    padding: '5px 10px',
    borderRadius: '6px',
    backgroundColor: 'var(--status-vacant-bg)',
    border: '1px solid var(--status-vacant-border)',
    fontSize: '12px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--status-vacant-text)',
  },
  terminateActionBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border-hairline)',
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--status-vacant-text)',
  },
  historySelectorCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
  },
  apartmentSelect: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border-hairline)',
    fontSize: '13px',
    color: 'var(--text-primary)',
    minWidth: '320px',
    outline: 'none',
  },
  historyColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  historyColCard: {
    padding: '18px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
  },
  historyColHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
    borderBottom: '1px solid var(--border-hairline)',
    paddingBottom: '8px',
  },
  historyItem: {
    padding: '12px 14px',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border-hairline)',
  },
  archivedTag: {
    fontSize: '10.5px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-canvas)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-hairline)',
  },
  emptyNotice: {
    padding: '24px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
};

export default ResidentManagementView;
