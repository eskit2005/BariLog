import React, { useState, useEffect, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List as ListIcon, 
  Layers, 
  Building as BuildingIcon, 
  Home, 
  AlertCircle,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { 
  getApartments, 
  getFloors, 
  getOccupancyStats 
} from '../../services/api';
import CreateApartmentModal from '../../components/modals/CreateApartmentModal';
import AddFloorModal from '../../components/modals/AddFloorModal';
import CreateBuildingModal from '../../components/modals/CreateBuildingModal';
import UpdateOccupancyModal from '../../components/modals/UpdateOccupancyModal';
import UnitSlideOver from '../../components/apartment/UnitSlideOver';

export const ApartmentRegistry = () => {
  const { user } = useContext(AuthContext);
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const { 
    selectedBuildingId, 
    setSelectedBuildingId, 
    buildings, 
    setBuildings, 
    refreshBuildings 
  } = useOutletContext();

  const activeBuildingId = selectedBuildingId || buildings[0]?.id;

  const [apartments, setApartments] = useState([]);
  const [floors, setFloors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Elevation) or 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [floorFilter, setFloorFilter] = useState('ALL');

  // Modals & Drawer State
  const [isCreateAptOpen, setIsCreateAptOpen] = useState(false);
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isCreateBuildingOpen, setIsCreateBuildingOpen] = useState(false);
  const [isUpdateOccupancyOpen, setIsUpdateOccupancyOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = async () => {
    if (!activeBuildingId) {
      setLoading(false);
      setApartments([]);
      setFloors([]);
      setStats(null);
      return;
    }
    setLoading(true);
    try {
      const [aptList, floorList, statsData] = await Promise.all([
        getApartments({ buildingId: activeBuildingId }),
        getFloors(activeBuildingId),
        getOccupancyStats(activeBuildingId),
      ]);
      setApartments(aptList);
      setFloors(floorList);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load apartment registry data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBuildingId]);

  // Filter logic
  const filteredApartments = apartments.filter((apt) => {
    const matchesSearch =
      apt.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.currentResidentName && apt.currentResidentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (apt.ownerName && apt.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || apt.occupancyStatus === statusFilter;
    const matchesFloor = floorFilter === 'ALL' || apt.floorId === Number(floorFilter);

    return matchesSearch && matchesStatus && matchesFloor;
  });

  const handleTileClick = (apt) => {
    setSelectedApartment(apt);
    setIsDrawerOpen(true);
  };

  const handleOpenOccupancyModal = (apt) => {
    setSelectedApartment(apt);
    setIsUpdateOccupancyOpen(true);
  };

  const handleOccupancyUpdated = (updatedApt) => {
    setSelectedApartment(updatedApt);
    loadData();
  };

  if (buildings.length === 0 && !loading) {
    return (
      <div style={styles.emptyState}>
        <BuildingIcon size={48} color="var(--brand-primary)" />
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '16px' }}>
          Welcome to BariLog
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '8px 0 20px' }}>
          {isManager
            ? 'No residential buildings are registered yet. Set up your building and floors to start managing units and occupancy.'
            : 'No residential buildings are registered in the system yet. Please contact your building management or committee.'}
        </p>
        {isManager && (
          <button
            onClick={() => setIsCreateBuildingOpen(true)}
            style={styles.primaryBtn}
          >
            <Plus size={16} /> Register First Building
          </button>
        )}
        {isManager && (
          <CreateBuildingModal
            isOpen={isCreateBuildingOpen}
            onClose={() => setIsCreateBuildingOpen(false)}
            onCreated={async (b) => {
              if (refreshBuildings) {
                await refreshBuildings(b.id);
              } else {
                setBuildings([b]);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Page Header & Top Title */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            {isManager ? 'Apartment Registry & Occupancy' : 'Building Directory & Units'}
          </h1>
          <p style={styles.pageSubtitle}>
            {isManager
              ? 'Physical building elevation, floor wings, and real-time occupancy management.'
              : 'Building elevation, flat layout specifications, and community occupancy status.'}
          </p>
        </div>
        <div style={styles.headerActions}>
          {isManager ? (
            <>
              <button onClick={() => setIsCreateBuildingOpen(true)} style={styles.secondaryBtn}>
                <BuildingIcon size={15} /> New Building
              </button>
              <button onClick={() => setIsAddFloorOpen(true)} style={styles.secondaryBtn}>
                <Layers size={15} /> Add Floor
              </button>
              <button onClick={() => setIsCreateAptOpen(true)} style={styles.primaryBtn}>
                <Plus size={15} /> Register Apartment
              </button>
            </>
          ) : (
            <div style={styles.residentHeaderTag}>
              <ShieldCheck size={16} color="var(--brand-primary)" />
              <span>Resident Access: View & Emergency Directory</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Telemetry / KPI Summary Bar (Fintech / Blueprint pattern from DESIGN.md) */}
      {stats && (
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>TOTAL APARTMENTS</span>
            <div style={styles.kpiValue} className="tabular-nums">{stats.totalUnits}</div>
            <span style={styles.kpiSub}>Registered units</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>OCCUPANCY RATE</span>
            <div style={styles.kpiValue} className="tabular-nums">
              {stats.occupancyRatePercentage}%
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.min(stats.occupancyRatePercentage, 100)}%`,
                }}
              />
            </div>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>OWNER OCCUPIED</span>
            <div style={{ ...styles.kpiValue, color: 'var(--status-occupied-text)' }} className="tabular-nums">
              {stats.ownerOccupiedUnits}
            </div>
            <span style={styles.kpiSub}>Living in own unit</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>RENTED TO TENANTS</span>
            <div style={{ ...styles.kpiValue, color: 'var(--status-rented-text)' }} className="tabular-nums">
              {stats.rentedUnits}
            </div>
            <span style={styles.kpiSub}>Active leases</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>VACANT FLATS</span>
            <div style={{ ...styles.kpiValue, color: 'var(--status-vacant-text)' }} className="tabular-nums">
              {stats.vacantUnits}
            </div>
            <span style={styles.kpiSub}>Available / Empty</span>
          </div>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by flat code (e.g. 4A), owner, or resident..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="ALL">All Occupancy States</option>
            <option value="OWNER_OCCUPIED">Owner Occupied</option>
            <option value="RENTED">Rented</option>
            <option value="VACANT">Vacant</option>
          </select>

          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="ALL">All Floors</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                Floor {f.floorNumber} ({f.blockWing})
              </option>
            ))}
          </select>

          {/* View Mode Toggle: Grid Elevation vs Table */}
          <div style={styles.viewToggleGroup}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                ...styles.toggleBtn,
                ...(viewMode === 'grid' ? styles.toggleBtnActive : {}),
              }}
              title="Elevation Grid View"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                ...styles.toggleBtn,
                ...(viewMode === 'table' ? styles.toggleBtnActive : {}),
              }}
              title="List Table View"
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={styles.loadingBox}>Loading apartment registry data...</div>
      ) : filteredApartments.length === 0 ? (
        <div style={styles.emptyTable}>
          <AlertCircle size={32} color="var(--text-muted)" />
          <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {apartments.length === 0
              ? 'No apartments registered yet. Click "+ Register Apartment" to add your first unit.'
              : 'No apartment units found matching the selected filters.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Pattern A: Floor-Plan Elevation Grid View */
        <div style={styles.elevationStack}>
          {floors
            .slice()
            .sort((a, b) => b.floorNumber - a.floorNumber) // High floors on top like a building elevation
            .map((floor) => {
              const floorApts = filteredApartments.filter((a) => a.floorId === floor.id);
              if (floorApts.length === 0 && (searchQuery || statusFilter !== 'ALL')) {
                return null;
              }

              return (
                <div key={floor.id} style={styles.elevationFloorRow}>
                  {/* Floor Side Pill */}
                  <div style={styles.floorSideMarker}>
                    <div style={styles.floorNum} className="tabular-nums">L{floor.floorNumber}</div>
                    <div style={styles.floorWing}>{floor.blockWing}</div>
                  </div>

                  {/* Units Grid for this Floor */}
                  <div style={styles.floorUnitsGrid}>
                    {floorApts.length === 0 ? (
                      <div style={styles.noUnitsOnFloor}>No units registered on Floor {floor.floorNumber}</div>
                    ) : (
                      floorApts.map((apt) => {
                        const isVacant = apt.occupancyStatus === 'VACANT';
                        const isOwner = apt.occupancyStatus === 'OWNER_OCCUPIED';
                        const isRented = apt.occupancyStatus === 'RENTED';
                        const isMyUnit = Boolean(
                          user && 
                          (apt.currentResidentId === user.id || apt.ownerId === user.id)
                        );

                        let dotColor = '#15803D';
                        let pillText = 'Owner';
                        let pillClass = styles.pillOwner;

                        if (isRented) {
                          dotColor = '#0369A1';
                          pillText = 'Rented';
                          pillClass = styles.pillRented;
                        } else if (isVacant) {
                          dotColor = '#B91C1C';
                          pillText = 'Vacant';
                          pillClass = styles.pillVacant;
                        }

                        return (
                          <div
                            key={apt.id}
                            style={{
                              ...styles.unitTile,
                              ...(isMyUnit ? styles.myUnitTile : {}),
                            }}
                            onClick={() => handleTileClick(apt)}
                          >
                            <div style={styles.unitTileHeader}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={styles.unitCode}>{apt.unitNumber}</div>
                                {isMyUnit && <span style={styles.myUnitBadge}>YOU</span>}
                              </div>
                              <span style={{ ...styles.occupancyPill, ...pillClass }}>
                                <span style={{ ...styles.pillDot, backgroundColor: dotColor }} />
                                {pillText}
                              </span>
                            </div>

                            <div style={styles.unitSpecs}>
                              <span className="tabular-nums">{apt.sizeSqft} sqft</span> • <span>{apt.bhkType}</span>
                            </div>

                            <div style={styles.unitResident}>
                              {isVacant ? (
                                <span style={{ color: 'var(--text-muted)' }}>Empty Unit</span>
                              ) : isRented ? (
                                <span>Tenant: {apt.currentResidentName || 'Assigned'}</span>
                              ) : (
                                <span>Owner: {apt.ownerName || 'Resident'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        /* List Table View */
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>UNIT</th>
                <th style={styles.th}>FLOOR & WING</th>
                <th style={styles.th}>SPECIFICATIONS</th>
                <th style={styles.th}>PARKING / METER</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>OWNER</th>
                <th style={styles.th}>CURRENT OCCUPANT</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredApartments.map((apt) => (
                <tr key={apt.id} style={styles.tableRow} onClick={() => handleTileClick(apt)}>
                  <td style={{ ...styles.td, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {apt.unitNumber}
                  </td>
                  <td style={styles.td}>
                    Floor {apt.floorNumber} ({apt.blockWing})
                  </td>
                  <td style={styles.td}>
                    <span className="tabular-nums">{apt.sizeSqft} sqft</span> • {apt.bhkType}
                  </td>
                  <td style={styles.td}>
                    {apt.parkingSlotNumber || '—'} / {apt.utilityMeterNumber || '—'}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(apt.occupancyStatus === 'OWNER_OCCUPIED'
                          ? styles.pillOwner
                          : apt.occupancyStatus === 'RENTED'
                          ? styles.pillRented
                          : styles.pillVacant),
                      }}
                    >
                      {apt.occupancyStatus}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {apt.ownerName || '—'}
                  </td>
                  <td style={styles.td}>
                    {apt.currentResidentName || (apt.occupancyStatus === 'VACANT' ? 'Vacant' : '—')}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    {isManager ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenOccupancyModal(apt);
                        }}
                        style={styles.tableActionBtn}
                      >
                        Change Status
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTileClick(apt);
                        }}
                        style={styles.tableInspectBtn}
                      >
                        View Flat
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-Over Drawer for Selected Apartment */}
      <UnitSlideOver
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        apartment={selectedApartment}
        isManager={isManager}
        currentUserId={user?.id}
        onOpenUpdateOccupancy={(apt) => {
          setIsDrawerOpen(false);
          handleOpenOccupancyModal(apt);
        }}
        onApartmentDeleted={loadData}
      />

      {/* Modal: Create Building */}
      <CreateBuildingModal
        isOpen={isCreateBuildingOpen}
        onClose={() => setIsCreateBuildingOpen(false)}
        onCreated={async (b) => {
          if (refreshBuildings) {
            await refreshBuildings(b.id);
          } else {
            setBuildings((prev) => [...prev, b]);
            if (setSelectedBuildingId) setSelectedBuildingId(b.id);
          }
        }}
      />

      {/* Modal: Create Apartment */}
      <CreateApartmentModal
        isOpen={isCreateAptOpen}
        onClose={() => setIsCreateAptOpen(false)}
        buildingId={activeBuildingId}
        floors={floors}
        onApartmentCreated={loadData}
      />

      {/* Modal: Add Floor */}
      <AddFloorModal
        isOpen={isAddFloorOpen}
        onClose={() => setIsAddFloorOpen(false)}
        buildingId={activeBuildingId}
        onFloorAdded={loadData}
      />

      {/* Modal: Update Occupancy */}
      <UpdateOccupancyModal
        isOpen={isUpdateOccupancyOpen}
        onClose={() => setIsUpdateOccupancyOpen(false)}
        apartment={selectedApartment}
        onUpdated={handleOccupancyUpdated}
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 14px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-hairline)',
    color: 'var(--text-secondary)',
    borderRadius: '8px',
    fontWeight: 500,
    fontSize: '13px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '14px',
  },
  kpiCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-hairline)',
    borderRadius: '10px',
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'var(--text-muted)',
  },
  kpiValue: {
    fontSize: '26px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  kpiSub: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  progressBar: {
    height: '4px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '2px',
    marginTop: '6px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'var(--brand-primary)',
    borderRadius: '2px',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    backgroundColor: 'var(--bg-surface)',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border-hairline)',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    maxWidth: '440px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    color: 'var(--text-primary)',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filterSelect: {
    padding: '7px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-hairline)',
    backgroundColor: 'var(--bg-canvas)',
    color: 'var(--text-primary)',
    fontSize: '12.5px',
    fontWeight: 500,
    outline: 'none',
  },
  viewToggleGroup: {
    display: 'flex',
    border: '1px solid var(--border-hairline)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
  },
  toggleBtnActive: {
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--brand-primary)',
  },
  elevationStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  elevationFloorRow: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '16px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '10px',
    border: '1px solid var(--border-hairline)',
    padding: '14px 18px',
  },
  floorSideMarker: {
    width: '70px',
    borderRight: '1px solid var(--border-hairline)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingRight: '12px',
    flexShrink: 0,
  },
  floorNum: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  floorWing: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  floorUnitsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    flex: 1,
  },
  noUnitsOnFloor: {
    fontSize: '12.5px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    fontStyle: 'italic',
  },
  unitTile: {
    width: '180px',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    backgroundColor: 'var(--bg-canvas)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  unitTileHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitCode: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  occupancyPill: {
    fontSize: '10.5px',
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid transparent',
  },
  pillDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
  },
  pillOwner: {
    backgroundColor: 'var(--status-occupied-bg)',
    color: 'var(--status-occupied-text)',
    borderColor: 'var(--status-occupied-border)',
  },
  pillRented: {
    backgroundColor: 'var(--status-rented-bg)',
    color: 'var(--status-rented-text)',
    borderColor: 'var(--status-rented-border)',
  },
  pillVacant: {
    backgroundColor: 'var(--status-vacant-bg)',
    color: 'var(--status-vacant-text)',
    borderColor: 'var(--status-vacant-border)',
  },
  unitSpecs: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  unitResident: {
    fontSize: '11.5px',
    color: 'var(--text-primary)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tableCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-hairline)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  tableHeadRow: {
    backgroundColor: 'var(--bg-subtle)',
    borderBottom: '1px solid var(--border-hairline)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },
  tableRow: {
    borderBottom: '1px solid var(--border-hairline)',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  td: {
    padding: '13px 16px',
    color: 'var(--text-secondary)',
  },
  statusBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid transparent',
  },
  tableActionBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-hairline)',
    backgroundColor: 'var(--bg-surface)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  tableInspectBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-hairline)',
    backgroundColor: 'var(--bg-subtle)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--brand-primary)',
    cursor: 'pointer',
  },
  residentHeaderTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--brand-tint)',
    border: '1px solid #CCFBF1',
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--brand-primary)',
  },
  myUnitTile: {
    borderColor: 'var(--brand-primary)',
    boxShadow: '0 0 0 1px var(--brand-primary)',
    backgroundColor: '#F0FDFA',
  },
  myUnitBadge: {
    fontSize: '9.5px',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: '4px',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    letterSpacing: '0.04em',
  },
  emptyState: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    border: '1px solid var(--border-hairline)',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  emptyTable: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '10px',
    border: '1px solid var(--border-hairline)',
  },
};

export default ApartmentRegistry;
