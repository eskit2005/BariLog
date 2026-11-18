import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Calendar } from 'lucide-react';
import { scheduleInspection, getApartments, getResidents } from '../../services/api';
import { modalStyles } from '../../components/modals/CreateBuildingModal';

export const ScheduleInspectionModal = ({ isOpen, onClose, onScheduled, initialApartmentId, initialResidentId }) => {
  const [apartments, setApartments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [formData, setFormData] = useState({
    apartmentId: '',
    residentId: '',
    inspectionType: 'MOVE_IN',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '10:30 AM',
    inspectorName: '',
    notes: '',
    keysHandedOver: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [aptList, resList] = await Promise.all([
        getApartments(),
        getResidents(),
      ]);
      setApartments(aptList || []);
      setResidents(resList || []);

      const aptId = initialApartmentId || (aptList && aptList.length > 0 ? String(aptList[0].id) : '');
      const resId = initialResidentId || (resList && resList.length > 0 ? String(resList[0].id) : '');

      setFormData((prev) => ({
        ...prev,
        apartmentId: aptId,
        residentId: resId,
      }));
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.apartmentId || !formData.residentId) {
      setError('Please select an apartment and resident');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        apartmentId: Number(formData.apartmentId),
        residentId: Number(formData.residentId),
        inspectionType: formData.inspectionType,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        inspectorName: formData.inspectorName,
        notes: formData.notes,
        keysHandedOver: formData.keysHandedOver,
      };

      const scheduled = await scheduleInspection(payload);
      onScheduled(scheduled);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule inspection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, maxWidth: '540px' }}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Schedule Resident Inspection</h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Inspection Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                style={{
                  ...styles.typeCard,
                  borderColor: formData.inspectionType === 'MOVE_IN' ? 'var(--brand-primary)' : 'var(--border-hairline)',
                  backgroundColor: formData.inspectionType === 'MOVE_IN' ? 'var(--brand-tint)' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="inspectionType"
                  value="MOVE_IN"
                  checked={formData.inspectionType === 'MOVE_IN'}
                  onChange={() => setFormData({ ...formData, inspectionType: 'MOVE_IN' })}
                  style={{ display: 'none' }}
                />
                <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>Move-In Inspection</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pre-occupancy inventory & meter check</span>
              </label>

              <label
                style={{
                  ...styles.typeCard,
                  borderColor: formData.inspectionType === 'MOVE_OUT' ? 'var(--accent-amber)' : 'var(--border-hairline)',
                  backgroundColor: formData.inspectionType === 'MOVE_OUT' ? 'var(--status-pending-bg)' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="inspectionType"
                  value="MOVE_OUT"
                  checked={formData.inspectionType === 'MOVE_OUT'}
                  onChange={() => setFormData({ ...formData, inspectionType: 'MOVE_OUT' })}
                  style={{ display: 'none' }}
                />
                <span style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>Move-Out Inspection</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Vacating check, repairs & key handover</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Apartment Unit *</label>
              <select
                required
                value={formData.apartmentId}
                onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                style={modalStyles.input}
              >
                {apartments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.unitNumber} ({a.buildingName})
                  </option>
                ))}
              </select>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Resident *</label>
              <select
                required
                value={formData.residentId}
                onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                style={modalStyles.input}
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.classification})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Scheduled Date *</label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                style={modalStyles.input}
              />
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Scheduled Time</label>
              <input
                type="text"
                placeholder="e.g. 10:30 AM"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Designated Inspector / Officer</label>
            <input
              type="text"
              placeholder="e.g. Engineer Faruk"
              value={formData.inspectorName}
              onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Inspection Scope / Focus Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Verify kitchen gas line, sanitary fittings, electrical circuit board, and paint finish."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...modalStyles.input, resize: 'vertical' }}
            />
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
              {loading ? 'Scheduling...' : 'Schedule Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  typeCard: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    transition: 'all 0.15s ease',
  },
};

export default ScheduleInspectionModal;
