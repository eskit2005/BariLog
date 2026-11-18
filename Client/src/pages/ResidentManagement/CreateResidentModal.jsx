import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Home, AlertCircle } from 'lucide-react';
import { createResident, getApartments, getBuildings } from '../../services/api';
import TenancyDetailsForm from './TenancyDetailsForm';
import { modalStyles } from '../../components/modals/CreateBuildingModal';

export const CreateResidentModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    residentType: 'TENANT',
    nidPassportNumber: '',
    bloodGroup: '',
    occupation: '',
    familyMembersCount: 1,
    permanentAddress: '',
    bio: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: 'Spouse',
    emergencyContactEmail: '',
    allocateNow: false,
    initialApartmentId: '',
  });

  const [tenancyData, setTenancyData] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    rentAmount: '30000',
    depositAmount: '60000',
    paymentFrequency: 'MONTHLY',
    terms: 'Standard 12-month lease with 2 months security deposit. Utility bills payable by occupant.',
    notes: 'Initial allocation on resident registration.',
  });

  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [vacantUnits, setVacantUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadBuildings();
    }
  }, [isOpen]);

  const loadBuildings = async () => {
    try {
      const data = await getBuildings();
      setBuildings(data || []);
      if (data && data.length > 0) {
        setSelectedBuildingId(String(data[0].id));
        loadVacantUnits(data[0].id);
      }
    } catch {
      // ignore
    }
  };

  const loadVacantUnits = async (buildingId) => {
    try {
      const units = await getApartments({ buildingId, status: 'VACANT' });
      setVacantUnits(units || []);
      if (units && units.length > 0) {
        setFormData((prev) => ({ ...prev, initialApartmentId: String(units[0].id) }));
      } else {
        setFormData((prev) => ({ ...prev, initialApartmentId: '' }));
      }
    } catch {
      setVacantUnits([]);
    }
  };

  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setSelectedBuildingId(bId);
    loadVacantUnits(bId);
  };

  if (!isOpen) return null;

  const isOwner = formData.residentType === 'OWNER';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        phoneNumber: formData.phoneNumber,
        residentType: formData.residentType,
        nidPassportNumber: formData.nidPassportNumber,
        bloodGroup: formData.bloodGroup,
        occupation: formData.occupation,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
      };

      if (formData.allocateNow && formData.initialApartmentId) {
        payload.initialApartmentId = Number(formData.initialApartmentId);
        if (!isOwner) {
          payload.startDate = tenancyData.startDate;
          payload.endDate = tenancyData.endDate;
          payload.rentAmount = Number(tenancyData.rentAmount) || 0;
          payload.depositAmount = Number(tenancyData.depositAmount) || 0;
          payload.paymentFrequency = tenancyData.paymentFrequency || 'MONTHLY';
          payload.terms = tenancyData.terms;
        }
      }

      const created = await createResident(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register resident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Register Resident Profile</h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {/* Classification Selection */}
          <div style={styles.classificationBox}>
            <span style={styles.sectionLabel}>Resident Classification *</span>
            <div style={styles.radioGroup}>
              <label
                style={{
                  ...styles.radioCard,
                  borderColor: formData.residentType === 'TENANT' ? 'var(--brand-primary)' : 'var(--border-hairline)',
                  backgroundColor: formData.residentType === 'TENANT' ? 'var(--brand-tint)' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="residentType"
                  value="TENANT"
                  checked={formData.residentType === 'TENANT'}
                  onChange={() => setFormData({ ...formData, residentType: 'TENANT' })}
                  style={{ display: 'none' }}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tenant</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Occupies flat on rental lease with tenancy agreement.
                </span>
              </label>

              <label
                style={{
                  ...styles.radioCard,
                  borderColor: formData.residentType === 'OWNER' ? 'var(--brand-primary)' : 'var(--border-hairline)',
                  backgroundColor: formData.residentType === 'OWNER' ? 'var(--brand-tint)' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="residentType"
                  value="OWNER"
                  checked={formData.residentType === 'OWNER'}
                  onChange={() => setFormData({ ...formData, residentType: 'OWNER' })}
                  style={{ display: 'none' }}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Owner</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Title owner of the flat. No tenancy contract required.
                </span>
              </label>
            </div>
          </div>

          {/* Personal Information */}
          <div style={styles.sectionHeading}>Personal Information</div>
          <div style={styles.grid2}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Ahmed"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={modalStyles.input}
              />
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Email Address *</label>
              <input
                type="email"
                required
                placeholder="sarah@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          <div style={styles.grid2}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Phone Number</label>
              <input
                type="text"
                placeholder="+8801700112233"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                style={modalStyles.input}
              />
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Account Password *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          <div style={styles.grid3}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>NID / Passport #</label>
              <input
                type="text"
                placeholder="1992019283719"
                value={formData.nidPassportNumber}
                onChange={(e) => setFormData({ ...formData, nidPassportNumber: e.target.value })}
                style={modalStyles.input}
              />
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                style={modalStyles.input}
              >
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Occupation</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={styles.sectionHeading}>Emergency Contact Details</div>
          <div style={styles.grid2}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Contact Person Name *</label>
              <input
                type="text"
                placeholder="e.g. Kamal Hossain"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                style={modalStyles.input}
              />
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Emergency Phone *</label>
              <input
                type="text"
                placeholder="+8801811223344"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          <div style={styles.grid2}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Relationship</label>
              <select
                value={formData.emergencyContactRelationship}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                style={modalStyles.input}
              >
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Friend">Friend / Colleague</option>
                <option value="Relative">Relative</option>
              </select>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Emergency Email</label>
              <input
                type="email"
                placeholder="contact@example.com"
                value={formData.emergencyContactEmail}
                onChange={(e) => setFormData({ ...formData, emergencyContactEmail: e.target.value })}
                style={modalStyles.input}
              />
            </div>
          </div>

          {/* Instant Apartment Allocation Option */}
          <div style={styles.allocationBox}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={formData.allocateNow}
                onChange={(e) => setFormData({ ...formData, allocateNow: e.target.checked })}
              />
              <span>Assign Apartment Unit Immediately</span>
            </label>

            {formData.allocateNow && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={styles.grid2}>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>Select Building</label>
                    <select
                      value={selectedBuildingId}
                      onChange={handleBuildingChange}
                      style={modalStyles.input}
                    >
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>Select Vacant Unit *</label>
                    <select
                      required={formData.allocateNow}
                      value={formData.initialApartmentId}
                      onChange={(e) => setFormData({ ...formData, initialApartmentId: e.target.value })}
                      style={modalStyles.input}
                    >
                      {vacantUnits.length === 0 ? (
                        <option value="">No vacant units in this building</option>
                      ) : (
                        vacantUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            Unit {u.unitNumber} ({u.bhkType}, Floor {u.floorNumber})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {isOwner ? (
                  <div style={styles.ownerNotice}>
                    <Shield size={16} color="var(--status-occupied-text)" />
                    <span>
                      <strong>Owner Allocation:</strong> As an Owner resident, unit occupancy will be set to <strong>OWNER_OCCUPIED</strong> and no rental agreement is required.
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Tenancy Agreement Specifications (Tenant)
                    </div>
                    <TenancyDetailsForm values={tenancyData} onChange={setTenancyData} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
              {loading ? 'Registering...' : 'Register Resident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  classificationBox: {
    padding: '12px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  radioGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  radioCard: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    transition: 'all 0.15s ease',
  },
  sectionHeading: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: '6px',
    borderBottom: '1px solid var(--border-hairline)',
    paddingBottom: '4px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
  },
  allocationBox: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px dashed var(--brand-primary)',
    backgroundColor: 'var(--brand-tint)',
    marginTop: '6px',
  },
  ownerNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '6px',
    backgroundColor: 'var(--status-occupied-bg)',
    color: 'var(--status-occupied-text)',
    fontSize: '12.5px',
    border: '1px solid var(--status-occupied-border)',
  },
};

export default CreateResidentModal;
