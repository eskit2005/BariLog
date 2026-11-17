import React, { useState } from 'react';
import { X, Building } from 'lucide-react';
import { createBuilding } from '../../services/api';

export const CreateBuildingModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    totalFloors: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const created = await createBuilding(formData);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create building');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Register New Building / Tower</h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Building Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Green Valley Tower A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Address / Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Road 12, Banani, Dhaka"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Total Physical Floors</label>
            <input
              type="number"
              min="1"
              required
              value={formData.totalFloors}
              onChange={(e) => setFormData({ ...formData, totalFloors: Number(e.target.value) })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
              {loading ? 'Creating...' : 'Register Building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1)',
    border: '1px solid var(--border-hairline)',
    overflow: 'hidden',
  },
  header: {
    padding: '18px 24px',
    borderBottom: '1px solid var(--border-hairline)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    color: 'var(--text-secondary)',
    padding: '4px',
  },
  form: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    outline: 'none',
    fontSize: '13.5px',
  },
  footer: {
    marginTop: '8px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelBtn: {
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '13px',
  },
  submitBtn: {
    padding: '9px 18px',
    borderRadius: '8px',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '13px',
  },
  error: {
    margin: '16px 24px 0',
    padding: '10px 14px',
    backgroundColor: 'var(--status-vacant-bg)',
    color: 'var(--status-vacant-text)',
    border: '1px solid var(--status-vacant-border)',
    borderRadius: '8px',
    fontSize: '13px',
  },
};

export default CreateBuildingModal;
