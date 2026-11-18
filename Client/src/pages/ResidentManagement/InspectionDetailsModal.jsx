import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Key, AlertCircle } from 'lucide-react';
import { updateInspectionStatus } from '../../services/api';
import { modalStyles } from '../../components/modals/CreateBuildingModal';

export const InspectionDetailsModal = ({ isOpen, inspection, onClose, onUpdated }) => {
  const [status, setStatus] = useState(inspection?.status || 'COMPLETED');
  const [conditionReport, setConditionReport] = useState(inspection?.conditionReport || '');
  const [notes, setNotes] = useState(inspection?.notes || '');
  const [keysHandedOver, setKeysHandedOver] = useState(inspection?.keysHandedOver || false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !inspection) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        status,
        conditionReport,
        notes,
        keysHandedOver,
      };

      const updated = await updateInspectionStatus(inspection.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update inspection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, maxWidth: '560px' }}>
        <div style={modalStyles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: inspection.inspectionType === 'MOVE_IN' ? 'var(--brand-tint)' : 'var(--status-pending-bg)',
                  color: inspection.inspectionType === 'MOVE_IN' ? 'var(--brand-primary)' : 'var(--accent-amber)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                {inspection.inspectionType === 'MOVE_IN' ? 'MOVE-IN INSPECTION' : 'MOVE-OUT INSPECTION'}
              </span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, marginTop: '4px' }}>
              Unit {inspection.unitNumber} ({inspection.buildingName})
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Resident: <strong>{inspection.residentName}</strong> • Scheduled: {inspection.scheduledDate} at {inspection.scheduledTime || '10:00 AM'}
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Update Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={modalStyles.input}
            >
              <option value="SCHEDULED">SCHEDULED (Pending)</option>
              <option value="COMPLETED">COMPLETED (Inspected & Verified)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Condition Findings & Checklist Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Living room wall paint intact. Kitchen sink plumbing verified. Meter reading logged at 15420 kWh. No damage detected."
              value={conditionReport}
              onChange={(e) => setConditionReport(e.target.value)}
              style={{ ...modalStyles.input, resize: 'vertical' }}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Administrative Remarks</label>
            <input
              type="text"
              placeholder="e.g. Conducted by Manager Habib in presence of resident."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={keysHandedOver}
              onChange={(e) => setKeysHandedOver(e.target.checked)}
            />
            <Key size={14} color="var(--brand-primary)" />
            <span>Keys & security access tags confirmed handed over</span>
          </label>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
              {loading ? 'Saving...' : 'Save Inspection Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InspectionDetailsModal;
