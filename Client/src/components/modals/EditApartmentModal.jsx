import React, { useState, useEffect } from 'react';
import { X, Edit3, ShieldCheck } from 'lucide-react';
import { updateApartment, getUsers } from '../../services/api';
import { modalStyles } from './CreateBuildingModal';

export const EditApartmentModal = ({ isOpen, onClose, apartment, onApartmentUpdated }) => {
  const [formData, setFormData] = useState({
    sizeSqft: 1400,
    netCarpetSqft: '',
    bhkType: '3 BHK',
    numberOfBedrooms: 3,
    numberOfBathrooms: 3,
    numberOfBalconies: 2,
    parkingSlotNumber: '',
    utilityMeterNumber: '',
    ownerId: null,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
  });
  const [users, setUsers] = useState([]);
  const [selectedOwnerUserId, setSelectedOwnerUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (apartment && isOpen) {
      setFormData({
        sizeSqft: apartment.sizeSqft || 1400,
        netCarpetSqft: apartment.netCarpetSqft || '',
        bhkType: apartment.bhkType || '3 BHK',
        numberOfBedrooms: apartment.numberOfBedrooms || 1,
        numberOfBathrooms: apartment.numberOfBathrooms || 1,
        numberOfBalconies: apartment.numberOfBalconies || 0,
        parkingSlotNumber: apartment.parkingSlotNumber || '',
        utilityMeterNumber: apartment.utilityMeterNumber || '',
        ownerId: apartment.ownerId || null,
        ownerName: apartment.ownerName || '',
        ownerPhone: apartment.ownerPhone || '',
        ownerEmail: apartment.ownerEmail || '',
      });
      setSelectedOwnerUserId(apartment.ownerId ? String(apartment.ownerId) : '');
    }
  }, [apartment, isOpen]);

  useEffect(() => {
    if (isOpen) {
      getUsers()
        .then((data) => setUsers(Array.isArray(data) ? data : []))
        .catch((err) => console.warn('Could not load users list', err));
    }
  }, [isOpen]);

  if (!isOpen || !apartment) return null;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        buildingId: apartment.buildingId,
        floorId: apartment.floorId,
        unitNumber: apartment.unitNumber,
        sizeSqft: Number(formData.sizeSqft),
        netCarpetSqft: formData.netCarpetSqft ? Number(formData.netCarpetSqft) : null,
        ownerId: formData.ownerId ? Number(formData.ownerId) : null,
      };
      const updated = await updateApartment(apartment.id, payload);
      if (onApartmentUpdated) onApartmentUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update apartment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>
              Edit Unit & Ownership: Flat {apartment.unitNumber}
            </h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {/* Row 1: Area & Layout */}
          <div style={gridRow}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Gross Area (sqft)</label>
              <input
                type="number"
                step="0.01"
                required
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

          {/* Row 2: Parking & Meter */}
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

          {/* Section: Ownership */}
          <div style={{ marginTop: '6px', paddingTop: '12px', borderTop: '1px solid var(--border-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Ownership Record & Profile
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

            {apartment.occupancyStatus === 'OWNER_OCCUPIED' && (
              <div style={noticeBoxStyle}>
                <ShieldCheck size={16} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Active Occupant Sync:</strong> Because this apartment is marked <em>OWNER_OCCUPIED</em>, updates to the owner will automatically sync to the active resident staying in this flat and appear in the Resident Directory.
                </div>
              </div>
            )}
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
              {loading ? 'Saving Changes...' : 'Save Unit Details'}
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

export default EditApartmentModal;
