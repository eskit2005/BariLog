import React, { useState, useEffect } from 'react';
import { X, Building2, Shield, AlertTriangle } from 'lucide-react';
import { allocateApartment, getApartments, getBuildings } from '../../services/api';
import TenancyDetailsForm from './TenancyDetailsForm';
import { modalStyles } from '../../components/modals/CreateBuildingModal';

export const AllocateApartmentModal = ({ isOpen, resident, onClose, onAllocated }) => {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [vacantUnits, setVacantUnits] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [classification, setClassification] = useState('TENANT');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const [tenancyData, setTenancyData] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    rentAmount: '35000',
    depositAmount: '70000',
    paymentFrequency: 'MONTHLY',
    terms: '12-month lease. 2 months security deposit. Utility charges payable by tenant.',
    notes: 'New tenancy execution.',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && resident) {
      const isOwnerResident = resident.classification === 'Owner' || (resident.residentType && resident.residentType.includes('OWNER'));
      setClassification(isOwnerResident ? 'OWNER' : 'TENANT');
      loadBuildings();
    }
  }, [isOpen, resident]);

  const loadBuildings = async () => {
    try {
      const data = await getBuildings();
      setBuildings(data || []);
      if (data && data.length > 0) {
        setSelectedBuildingId(String(data[0].id));
        loadVacantUnits(data[0].id);
      }
    } catch {
      // ignore
    }
  };

  const loadVacantUnits = async (buildingId) => {
    try {
      const units = await getApartments({ buildingId, status: 'VACANT' });
      setVacantUnits(units || []);
      if (units && units.length > 0) {
        setSelectedApartmentId(String(units[0].id));
      } else {
        setSelectedApartmentId('');
      }
    } catch {
      setVacantUnits([]);
      setSelectedApartmentId('');
    }
  };

  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setSelectedBuildingId(bId);
    loadVacantUnits(bId);
  };

  if (!isOpen || !resident) return null;

  const isOwner = classification === 'OWNER';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApartmentId) {
      setError('Please select a vacant apartment unit.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        apartmentId: Number(selectedApartmentId),
        residentType: classification,
        effectiveDate,
        notes,
      };

      if (!isOwner) {
        payload.startDate = tenancyData.startDate;
        payload.endDate = tenancyData.endDate;
        payload.rentAmount = Number(tenancyData.rentAmount) || 0;
        payload.depositAmount = Number(tenancyData.depositAmount) || 0;
        payload.paymentFrequency = tenancyData.paymentFrequency;
        payload.agreementNumber = tenancyData.agreementNumber || undefined;
        payload.terms = tenancyData.terms;
      }

      const updatedProfile = await allocateApartment(resident.id, payload);
      onAllocated(updatedProfile);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to allocate apartment unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--brand-primary)" />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Allocate Apartment Unit</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Assigning unit to resident: <strong>{resident.name}</strong> ({resident.email})
              </div>
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {/* Classification Selection */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Allocation Type / Classification</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                style={{
                  ...styles.radioCard,
                  borderColor: !isOwner ? 'var(--brand-primary)' : 'var(--border-hairline)',
                  backgroundColor: !isOwner ? 'var(--brand-tint)' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="classification"
                  value="TENANT"
                  checked={!isOwner}
                  onChange={() => setClassification('TENANT')}
                  style={{ display: 'none' }}
                />
                <span style={{ fontWeight: 600 }}>Tenant Occupancy</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Creates a legal Tenancy Agreement with start/end dates and rent.
                </span>
              </label>

              <label
                style={{
                  ...styles.radioCard,
                  borderColor: isOwner ? 'var(--brand-primary)' : 'var(--border-hairline)',
                  backgroundColor: isOwner ? 'var(--brand-tint)' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="classification"
                  value="OWNER"
                  checked={isOwner}
                  onChange={() => setClassification('OWNER')}
                  style={{ display: 'none' }}
                />
                <span style={{ fontWeight: 600 }}>Owner Occupancy</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Flat owner residing in own unit. No tenancy agreement needed.
                </span>
              </label>
            </div>
          </div>

          {/* Unit selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Target Building *</label>
              <select
                value={selectedBuildingId}
                onChange={handleBuildingChange}
                style={modalStyles.input}
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Vacant Apartment Unit *</label>
              <select
                required
                value={selectedApartmentId}
                onChange={(e) => setSelectedApartmentId(e.target.value)}
                style={modalStyles.input}
              >
                {vacantUnits.length === 0 ? (
                  <option value="">No vacant units available</option>
                ) : (
                  vacantUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber} ({u.bhkType}, {u.sizeSqft} sqft, Floor {u.floorNumber})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Effective Handover / Transition Date</label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          {isOwner ? (
            <div style={styles.ownerNotice}>
              <Shield size={16} color="var(--status-occupied-text)" />
              <div>
                <strong>Direct Owner Residence:</strong> Unit status will be set to <strong>OWNER_OCCUPIED</strong>.
                An Owner is not treated as a Tenant and requires no rental contract.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Tenancy Agreement Contract Terms
              </div>
              <TenancyDetailsForm values={tenancyData} onChange={setTenancyData} />
            </div>
          )}

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Administrative Notes / Transition Reason</label>
            <input
              type="text"
              placeholder="e.g. Completed initial deposit and background check."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button
              type="submit"
              disabled={loading || !selectedApartmentId}
              style={{
                ...modalStyles.submitBtn,
                opacity: (!selectedApartmentId || loading) ? 0.6 : 1,
              }}
            >
              {loading ? 'Allocating Unit...' : 'Confirm Apartment Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  radioCard: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    transition: 'all 0.15s ease',
  },
  ownerNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--status-occupied-bg)',
    color: 'var(--status-occupied-text)',
    fontSize: '12.5px',
    border: '1px solid var(--status-occupied-border)',
  },
};

export default AllocateApartmentModal;
