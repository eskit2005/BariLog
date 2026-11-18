import React, { useState } from 'react';
import { X, LogOut, CheckCircle2, AlertTriangle, ClipboardCheck, Key } from 'lucide-react';
import { processMoveOut } from '../../services/api';
import { modalStyles } from '../../components/modals/CreateBuildingModal';

export const MoveOutModal = ({ isOpen, resident, onClose, onMovedOut }) => {
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [scheduleInspection, setScheduleInspection] = useState(true);
  const [inspectorName, setInspectorName] = useState('');
  const [conditionReport, setConditionReport] = useState('Standard move-out inspection completed. Unit in good condition. All keys collected.');
  const [keysReturned, setKeysReturned] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !resident) return null;

  const currentUnit = resident.currentApartment || {
    unitNumber: resident.unitNumber,
    buildingName: resident.buildingName,
    floorNumber: resident.floorNumber,
  };

  const activeAgreement = resident.activeAgreement || (resident.activeAgreementId ? {
    agreementNumber: resident.activeAgreementNumber,
    rentAmount: resident.rentAmount,
  } : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        effectiveDate,
        notes: notes || 'Resident move-out completed. Unit restored to Vacant.',
        scheduleInspection,
        inspectorName: inspectorName || undefined,
        conditionReport: scheduleInspection ? conditionReport : undefined,
        keysReturned: scheduleInspection ? keysReturned : undefined,
      };

      const updatedProfile = await processMoveOut(resident.id, payload);
      onMovedOut(updatedProfile);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete move-out process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={20} color="var(--status-vacant-text)" />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Execute Move-Out Lifecycle</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Vacating Unit <strong>{currentUnit?.unitNumber}</strong> ({currentUnit?.buildingName})
              </div>
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {/* Unit Summary Card */}
          <div style={styles.summaryCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Occupant: {resident.name}
              </span>
              <span style={styles.badge}>
                {resident.classification || 'Resident'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Assigned Flat: <strong>{currentUnit?.unitNumber}</strong> • {currentUnit?.buildingName} (Floor {currentUnit?.floorNumber})
            </div>
            {activeAgreement && (
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: 4 }}>
                Active Agreement: <strong>{activeAgreement.agreementNumber}</strong> • Rent: BDT {Number(activeAgreement.rentAmount).toLocaleString()}/mo
              </div>
            )}
          </div>

          <div style={styles.warningBox}>
            <AlertTriangle size={18} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
              <strong>Lifecycle Action:</strong> Submitting move-out will automatically update unit <strong>{currentUnit?.unitNumber}</strong> to <strong>VACANT</strong>.
              Historical tenancy and allocation logs will be preserved in the archive for permanent audit records.
            </div>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Effective Move-out Date *</label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Move-out Reason / Administrative Notes</label>
            <input
              type="text"
              placeholder="e.g. Lease expired; relocated to new area."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          {/* Inspection Section */}
          <div style={styles.inspectionSection}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={scheduleInspection}
                onChange={(e) => setScheduleInspection(e.target.checked)}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ClipboardCheck size={16} color="var(--brand-primary)" />
                Record Move-Out Inspection and Condition Report
              </span>
            </label>

            {scheduleInspection && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={modalStyles.formGroup}>
                  <label style={modalStyles.label}>Inspecting Officer / Building Staff</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineer Faruk (Estate Manager)"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    style={modalStyles.input}
                  />
                </div>

                <div style={modalStyles.formGroup}>
                  <label style={modalStyles.label}>Apartment Handover Condition Report</label>
                  <textarea
                    rows={2}
                    value={conditionReport}
                    onChange={(e) => setConditionReport(e.target.value)}
                    style={{ ...modalStyles.input, resize: 'vertical' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={keysReturned}
                    onChange={(e) => setKeysReturned(e.target.checked)}
                  />
                  <Key size={14} color="var(--brand-primary)" />
                  <span>Physical apartment keys and access cards returned to management desk</span>
                </label>
              </div>
            )}
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...modalStyles.submitBtn,
                backgroundColor: 'var(--status-vacant-text)',
              }}
            >
              {loading ? 'Processing Move-Out...' : 'Confirm Move-Out & Vacate Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  summaryCard: {
    padding: '12px 14px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: 'var(--brand-tint)',
    color: 'var(--brand-primary)',
    border: '1px solid var(--border-hairline)',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: 'var(--status-pending-bg)',
    border: '1px solid var(--status-pending-border)',
    borderRadius: '8px',
  },
  inspectionSection: {
    padding: '12px 14px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
  },
};

export default MoveOutModal;
