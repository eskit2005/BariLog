import React from 'react';
import { Calendar, DollarSign, FileText } from 'lucide-react';

export const TenancyDetailsForm = ({ values, onChange, disabled = false }) => {
  const handleChange = (field, val) => {
    onChange({
      ...values,
      [field]: val,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.gridRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <Calendar size={13} style={{ marginRight: 4 }} />
            Commencement Date *
          </label>
          <input
            type="date"
            required
            disabled={disabled}
            value={values.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            <Calendar size={13} style={{ marginRight: 4 }} />
            Expiry Date *
          </label>
          <input
            type="date"
            required
            disabled={disabled}
            value={values.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.gridRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <DollarSign size={13} style={{ marginRight: 4 }} />
            Monthly Rental Amount (BDT / month) *
          </label>
          <input
            type="number"
            min="0"
            step="500"
            required
            disabled={disabled}
            placeholder="e.g. 35000"
            value={values.rentAmount || ''}
            onChange={(e) => handleChange('rentAmount', e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            <DollarSign size={13} style={{ marginRight: 4 }} />
            Security Deposit Amount (BDT)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            disabled={disabled}
            placeholder="e.g. 70000"
            value={values.depositAmount || ''}
            onChange={(e) => handleChange('depositAmount', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.gridRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Payment Schedule</label>
          <select
            disabled={disabled}
            value={values.paymentFrequency || 'MONTHLY'}
            onChange={(e) => handleChange('paymentFrequency', e.target.value)}
            style={styles.select}
          >
            <option value="MONTHLY">Monthly (by 5th of each month)</option>
            <option value="QUARTERLY">Quarterly (every 3 months)</option>
            <option value="BI_ANNUAL">Bi-Annual (every 6 months)</option>
            <option value="ANNUAL">Annual (full year upfront)</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Custom Agreement Reference #</label>
          <input
            type="text"
            disabled={disabled}
            placeholder="Auto-generated if left blank"
            value={values.agreementNumber || ''}
            onChange={(e) => handleChange('agreementNumber', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>
          <FileText size={13} style={{ marginRight: 4 }} />
          Rental Terms & Contractual Clauses
        </label>
        <textarea
          rows={3}
          disabled={disabled}
          placeholder="e.g., 2 months advance deposit. Notice period 60 days. Water and generator service charge payable by tenant."
          value={values.terms || ''}
          onChange={(e) => handleChange('terms', e.target.value)}
          style={{ ...styles.input, resize: 'vertical' }}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Administrative Notes / Remarks</label>
        <input
          type="text"
          disabled={disabled}
          placeholder="e.g., Verified bank statement and company ID badge."
          value={values.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          style={styles.input}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '14px',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '8px',
    border: '1px solid var(--border-hairline)',
  },
  gridRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-hairline)',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  select: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-hairline)',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
};

export default TenancyDetailsForm;
