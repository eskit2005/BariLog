import React, { useState, useEffect } from 'react';
import { X, Home } from 'lucide-react';
import { createApartment } from '../../services/api';
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
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (floors.length > 0 && !formData.floorId) {
      setFormData((prev) => ({ ...prev, floorId: floors[0].id }));
    }
  }, [floors]);

  if (!isOpen) return null;

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
      <div style={{ ...modalStyles.card, maxWidth: '640px' }}>
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

          {/* Section: Owner Information */}
          <div style={{ marginTop: '6px', paddingTop: '12px', borderTop: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Unit Ownership Details
            </div>
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

export default CreateApartmentModal;
