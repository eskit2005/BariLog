import React, { useState, useEffect } from 'react';
import { X, Home, UserCheck, ShieldCheck } from 'lucide-react';
import { createApartment, getUsers } from '../../services/api';
import { modalStyles } from './CreateBuildingModal';

export const CreateApartmentModal = ({ isOpen, onClose, buildingId, floors = [], onApartmentCreated }) => {
  const [formData, setFormData] = useState({
    floorId: '',
    unitNumber: '',
    sizeSqft: 1400,
    netCarpetSqft: '',
    bhkType: '3 BHK',
    numberOfBedrooms: 3,
    numberOfBathrooms: 3,
    numberOfBalconies: 2,
    parkingSlotNumber: '',
    utilityMeterNumber: '',
    occupancyStatus: 'VACANT',
    ownerId: null,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    currentResidentId: null,
  });
  const [users, setUsers] = useState([]);
  const [selectedOwnerUserId, setSelectedOwnerUserId] = useState('');
  const [selectedTenantUserId, setSelectedTenantUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (floors.length > 0 && !formData.floorId) {
      setFormData((prev) => ({ ...prev, floorId: floors[0].id }));
    }
  }, [floors]);

  useEffect(() => {
    if (isOpen) {
      getUsers()
        .then((data) => setUsers(Array.isArray(data) ? data : []))
        .catch((err) => console.warn('Could not load users list', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOwnerUserSelect = (userIdStr) => {
    setSelectedOwnerUserId(userIdStr);
    if (!userIdStr) {
      setFormData((prev) => ({
        ...prev,
        ownerId: null,
      }));
      return;
    }
    const matched = users.find((u) => String(u.id) === String(userIdStr));
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        ownerId: matched.id,
        ownerName: matched.name || prev.ownerName,
        ownerEmail: matched.email || prev.ownerEmail,
        ownerPhone: matched.phoneNumber || prev.ownerPhone,
      }));
    }
  };

  const handleTenantUserSelect = (userIdStr) => {
    setSelectedTenantUserId(userIdStr);
    setFormData((prev) => ({
      ...prev,
      currentResidentId: userIdStr ? Number(userIdStr) : null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId) {
      setError('No building selected. Please select or register a building first.');
      return;
    }
    const resolvedFloorId = formData.floorId || floors[0]?.id;
    if (!resolvedFloorId) {
      setError('Please add at least one floor before registering apartments.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        buildingId: Number(buildingId),
        floorId: Number(resolvedFloorId),
        sizeSqft: Number(formData.sizeSqft),
        netCarpetSqft: formData.netCarpetSqft ? Number(formData.netCarpetSqft) : null,
        ownerId: formData.ownerId ? Number(formData.ownerId) : null,
        currentResidentId: formData.currentResidentId ? Number(formData.currentResidentId) : null,
      };
      const created = await createApartment(payload);
      onApartmentCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create apartment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Register New Apartment Unit</h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {/* Row 1: Floor & Unit Number */}
          <div style={gridRow}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Target Floor</label>
              {floors.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: 'var(--status-vacant-text)', padding: '8px 0' }}>
                  No floors added yet. Please click "Add Floor" first.
                </div>
              ) : (
                <select
                  required
                  value={formData.floorId || floors[0]?.id}
                  onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                  style={modalStyles.input}
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      Floor {f.floorNumber} ({f.blockWing})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Unit Number / Flat Code</label>
              <input
                type="text"
                required
                placeholder="e.g. 4A, 102, PH-01"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          {/* Row 2: Sqft & BHK */}
          <div style={gridRow}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Gross Area (sqft) *Used for billing</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="1450.00"
                value={formData.sizeSqft}
                onChange={(e) => setFormData({ ...formData, sizeSqft: e.target.value })}
                style={modalStyles.input}
              />
            </div>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>BHK Layout</label>
              <select
                value={formData.bhkType}
                onChange={(e) => setFormData({ ...formData, bhkType: e.target.value })}
                style={modalStyles.input}
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="Studio">Studio</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Duplex">Duplex</option>
              </select>
            </div>
          </div>

          {/* Row 3: Parking & Utility Meter */}
          <div style={gridRow}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Parking Slot ID</label>
              <input
                type="text"
                placeholder="e.g. B1-P14"
                value={formData.parkingSlotNumber}
                onChange={(e) => setFormData({ ...formData, parkingSlotNumber: e.target.value })}
                style={modalStyles.input}
              />
            </div>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Electricity / Utility Meter No.</label>
              <input
                type="text"
                placeholder="e.g. DESCO-449102"
                value={formData.utilityMeterNumber}
                onChange={(e) => setFormData({ ...formData, utilityMeterNumber: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          {/* Row 4: Initial Occupancy Status */}
          <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px solid var(--border-hairline)' }}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Initial Occupancy Status</label>
              <select
                value={formData.occupancyStatus}
                onChange={(e) => setFormData({ ...formData, occupancyStatus: e.target.value })}
                style={modalStyles.input}
              >
                <option value="VACANT">VACANT (Empty Unit)</option>
                <option value="OWNER_OCCUPIED">OWNER_OCCUPIED (Owner Lives in Apartment)</option>
                <option value="RENTED">RENTED (Occupied by Tenant)</option>
              </select>
            </div>

            {formData.occupancyStatus === 'OWNER_OCCUPIED' && (
              <div style={noticeBoxStyle}>
                <ShieldCheck size={16} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Owner-Occupied:</strong> The owner will be directly associated with this apartment and recorded as the active resident residing inside the unit and appearing in the building Resident Directory.
                </div>
              </div>
            )}

            {formData.occupancyStatus === 'RENTED' && (
              <div style={{ ...modalStyles.formGroup, marginTop: '8px' }}>
                <label style={modalStyles.label}>Select Tenant (Registered User)</label>
                <select
                  value={selectedTenantUserId}
                  onChange={(e) => handleTenantUserSelect(e.target.value)}
                  style={modalStyles.input}
                >
                  <option value="">-- Choose Tenant User (or enter ID below) --</option>
                  {users
                    .filter((u) => u.role !== 'MANAGER' && u.role !== 'ADMIN')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        #{u.id} {u.name} ({u.role || 'RESIDENT'}) {u.email ? `· ${u.email}` : ''}
                      </option>
                    ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Or manual Tenant User ID:</span>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    style={{ ...modalStyles.input, width: '120px', padding: '4px 8px' }}
                    value={formData.currentResidentId || ''}
                    onChange={(e) => setFormData({ ...formData, currentResidentId: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Owner Information */}
          <div style={{ marginTop: '6px', paddingTop: '12px', borderTop: '1px solid var(--border-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Unit Ownership Details
              </span>
              {formData.ownerId && (
                <span style={{ fontSize: '11.5px', color: 'var(--status-occupied-text)', backgroundColor: 'var(--status-occupied-bg)', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                  Linked Account #{formData.ownerId}
                </span>
              )}
            </div>

            {users.length > 0 && (
              <div style={{ ...modalStyles.formGroup, marginBottom: '12px' }}>
                <label style={modalStyles.label}>Link Registered Account (Optional)</label>
                <select
                  value={selectedOwnerUserId}
                  onChange={(e) => handleOwnerUserSelect(e.target.value)}
                  style={modalStyles.input}
                >
                  <option value="">-- Enter owner manually or pick registered user --</option>
                  {users
                    .filter((u) => u.role !== 'MANAGER' && u.role !== 'ADMIN')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        #{u.id} {u.name} ({u.role || 'RESIDENT'}) {u.email ? `· ${u.email}` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div style={gridRow}>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Owner Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rafiqul Islam"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Owner Phone Number</label>
                <input
                  type="text"
                  placeholder="+8801711223344"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={{ ...modalStyles.formGroup, marginTop: '8px' }}>
              <label style={modalStyles.label}>Owner Email Address</label>
              <input
                type="email"
                placeholder="e.g. rafiqul@example.com"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button
              type="submit"
              disabled={loading || floors.length === 0}
              style={modalStyles.submitBtn}
            >
              {loading ? 'Registering...' : 'Register Apartment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const gridRow = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const noticeBoxStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  padding: '10px 12px',
  backgroundColor: 'var(--status-occupied-bg)',
  border: '1px solid var(--status-occupied-border)',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginTop: '8px',
  lineHeight: 1.45,
};

export default CreateApartmentModal;
