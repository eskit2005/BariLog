import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ShieldCheck, User } from 'lucide-react';
import { updateOccupancy, getUsers } from '../../services/api';
import { modalStyles } from './CreateBuildingModal';

export const UpdateOccupancyModal = ({ isOpen, onClose, apartment, onUpdated }) => {
  const [newStatus, setNewStatus] = useState(apartment?.occupancyStatus || 'VACANT');
  const [newResidentId, setNewResidentId] = useState('');
  const [ownerId, setOwnerId] = useState(apartment?.ownerId || null);
  const [ownerName, setOwnerName] = useState(apartment?.ownerName || '');
  const [ownerPhone, setOwnerPhone] = useState(apartment?.ownerPhone || '');
  const [ownerEmail, setOwnerEmail] = useState(apartment?.ownerEmail || '');
  const [notes, setNotes] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (apartment && isOpen) {
      setNewStatus(apartment.occupancyStatus || 'VACANT');
      setOwnerId(apartment.ownerId || null);
      setOwnerName(apartment.ownerName || '');
      setOwnerPhone(apartment.ownerPhone || '');
      setOwnerEmail(apartment.ownerEmail || '');
      setNewResidentId('');
      setSelectedUserId('');
      setNotes('');
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

  const handleUserSelect = (userIdStr) => {
    setSelectedUserId(userIdStr);
    if (!userIdStr) {
      setNewResidentId('');
      return;
    }
    setNewResidentId(userIdStr);
    const matched = users.find((u) => String(u.id) === String(userIdStr));
    if (matched && newStatus === 'OWNER_OCCUPIED') {
      setOwnerId(matched.id);
      if (matched.name) setOwnerName(matched.name);
      if (matched.email) setOwnerEmail(matched.email);
      if (matched.phoneNumber) setOwnerPhone(matched.phoneNumber);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        newStatus,
        newResidentId: newResidentId ? Number(newResidentId) : null,
        ownerId: ownerId ? Number(ownerId) : null,
        ownerName: ownerName.trim() || null,
        ownerPhone: ownerPhone.trim() || null,
        ownerEmail: ownerEmail.trim() || null,
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
      <div style={{ ...modalStyles.card, maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
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
            <label style={modalStyles.label}>Current State</label>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {apartment.occupancyStatus}
              {apartment.currentResidentName && ` (Resident: ${apartment.currentResidentName})`}
            </div>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Target Occupancy State</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={modalStyles.input}
            >
              <option value="VACANT">VACANT (Empty Unit)</option>
              <option value="OWNER_OCCUPIED">OWNER_OCCUPIED (Owner Lives in Apartment)</option>
              <option value="RENTED">RENTED (Occupied by Tenant)</option>
            </select>
          </div>

          {newStatus === 'OWNER_OCCUPIED' && (
            <div style={{ padding: '12px', backgroundColor: 'var(--status-occupied-bg)', border: '1px solid var(--status-occupied-border)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={16} color="var(--brand-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Owner Resides in Flat
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                The owner is counted and stored as the active resident staying inside this flat, and will be displayed in the community Resident Directory.
              </p>

              {ownerName ? (
                <div style={{ fontSize: '12.5px', padding: '6px 10px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-hairline)' }}>
                  <strong>Registered Owner:</strong> {ownerName} {ownerPhone ? `• ${ownerPhone}` : ''} {ownerEmail ? `• ${ownerEmail}` : ''}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--status-vacant-text)', marginBottom: '8px' }}>
                  No owner profile is currently attached to this flat. Please select or enter the owner details below:
                </div>
              )}

              {users.length > 0 && (
                <div style={{ ...modalStyles.formGroup, marginTop: '10px' }}>
                  <label style={modalStyles.label}>Assign Registered Account as Owner-Resident</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    style={modalStyles.input}
                  >
                    <option value="">-- Use Existing Owner or Pick User --</option>
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
            </div>
          )}

          {newStatus === 'RENTED' && (
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Select Tenant (Registered User)</label>
              {users.length > 0 && (
                <select
                  value={selectedUserId}
                  onChange={(e) => handleUserSelect(e.target.value)}
                  style={{ ...modalStyles.input, marginBottom: '8px' }}
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
              )}
              <label style={{ ...modalStyles.label, fontSize: '12px', color: 'var(--text-muted)' }}>
                Or enter Tenant User ID manually:
              </label>
              <input
                type="number"
                placeholder="e.g. 4"
                value={newResidentId}
                onChange={(e) => setNewResidentId(e.target.value)}
                style={modalStyles.input}
              />
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
