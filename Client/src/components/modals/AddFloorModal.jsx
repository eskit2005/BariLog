import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { addFloor } from '../../services/api';
import { modalStyles } from './CreateBuildingModal';

export const AddFloorModal = ({ isOpen, onClose, buildingId, onFloorAdded }) => {
  const [formData, setFormData] = useState({
    floorNumber: 1,
    blockWing: 'Main',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId) {
      setError('No building selected. Please select or register a building first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const floor = await addFloor(buildingId, formData);
      onFloorAdded(floor);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add floor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Add Floor to Building</h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Floor Number (0 for Ground)</label>
            <input
              type="number"
              required
              value={formData.floorNumber}
              onChange={(e) => setFormData({ ...formData, floorNumber: Number(e.target.value) })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Block / Wing</label>
            <input
              type="text"
              required
              placeholder="e.g. Main, East Wing, Tower 1"
              value={formData.blockWing}
              onChange={(e) => setFormData({ ...formData, blockWing: e.target.value })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Description / Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Standard residential 4-unit floor"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
              {loading ? 'Adding...' : 'Add Floor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFloorModal;
