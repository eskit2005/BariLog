import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { updateOccupancy } from '../../services/api';
import { modalStyles } from './CreateBuildingModal';

export const UpdateOccupancyModal = ({ isOpen, onClose, apartment, onUpdated }) => {
  const [newStatus, setNewStatus] = useState(apartment?.occupancyStatus || 'VACANT');
  const [newResidentId, setNewResidentId] = useState('');
  const [notes, setNotes] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !apartment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        newStatus,
        newResidentId: newResidentId ? Number(newResidentId) : null,
        notes: notes.trim(),
        effectiveDate,
      };
      const updated = await updateOccupancy(apartment.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update occupancy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>
              Update Occupancy: Flat {apartment.unitNumber}
            </h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Current Status</label>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {apartment.occupancyStatus}
            </div>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>New Occupancy State</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={modalStyles.input}
            >
              <option value="VACANT">VACANT (Empty Unit)</option>
              <option value="OWNER_OCCUPIED">OWNER_OCCUPIED (Owner Lives Here)</option>
              <option value="RENTED">RENTED (Occupied by Tenant)</option>
            </select>
          </div>

          {newStatus === 'RENTED' && (
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Tenant User ID (Registered in BariLog)</label>
              <input
                type="number"
                placeholder="e.g. 4"
                value={newResidentId}
                onChange={(e) => setNewResidentId(e.target.value)}
                style={modalStyles.input}
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Enter the registered User ID of the new tenant.
              </span>
            </div>
          )}

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Effective Transition Date</label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Audit Reason / Notes</label>
            <textarea
              rows="3"
              placeholder="e.g. Move-in under lease agreement #2026-11. Deposit cleared."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...modalStyles.input, resize: 'vertical' }}
            />
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
              {loading ? 'Saving...' : 'Confirm Transition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateOccupancyModal;
