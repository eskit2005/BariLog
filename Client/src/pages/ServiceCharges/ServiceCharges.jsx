import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Receipt, Plus, Trash2, Play } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import {
  getBuildings,
  getChargeRules,
  createChargeRule,
  setChargeRuleActive,
  deleteChargeRule,
  generateServiceCharges,
  getServiceCharges,
  getMyServiceCharges,
} from '../../services/api';

const CURRENCY = '৳';

const RULE_TYPES = [
  { value: 'FIXED', label: 'Fixed fee per flat', hint: 'The same amount is charged to every flat.' },
  { value: 'PER_SQFT', label: 'Per square foot', hint: 'Rate multiplied by each flat\u2019s gross area.' },
  { value: 'SHARED_UTILITY', label: 'Shared utility split', hint: 'A total bill divided between flats by size.' },
];

const emptyForm = { name: '', ruleType: 'FIXED', amount: '', applyToVacant: true };

const STATUS_STYLES = {
  PENDING: { backgroundColor: '#FEF3C7', color: '#92400E' },
  PAID: { backgroundColor: '#D1FAE5', color: '#065F46' },
  CANCELLED: { backgroundColor: '#E2E8F0', color: '#475569' },
};

const money = (value) =>
  `${CURRENCY} ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (isoDate) => {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const typeLabel = (value) => RULE_TYPES.find((t) => t.value === value)?.label || value;

const amountLabel = (type) => {
  if (type === 'PER_SQFT') return `Rate per sq ft (${CURRENCY})`;
  if (type === 'SHARED_UTILITY') return `Total bill to split (${CURRENCY})`;
  return `Amount per flat (${CURRENCY})`;
};

const ruleAmountText = (rule) => {
  if (rule.ruleType === 'PER_SQFT') return `${money(rule.amount)} / sq ft`;
  if (rule.ruleType === 'SHARED_UTILITY') return `${money(rule.amount)} total`;
  return `${money(rule.amount)} / flat`;
};

const StatusBadge = ({ status }) => (
  <span style={{ ...styles.badge, ...(STATUS_STYLES[status] || STATUS_STYLES.CANCELLED) }}>{status}</span>
);

const Breakdown = ({ items }) => (
  <div>
    {(items || []).map((item, i) => (
      <div key={i} style={styles.itemLine}>
        {item.ruleName}: <span className="tabular-nums" style={styles.num}>{money(item.amount)}</span>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Manager / Admin view                                                */
/* ------------------------------------------------------------------ */
function ManagerView() {
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [rules, setRules] = useState([]);
  const [charges, setCharges] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [genMonth, setGenMonth] = useState(currentMonth());
  const [filterMonth, setFilterMonth] = useState(currentMonth());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getBuildings()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setBuildings(list);
        if (list.length > 0) setBuildingId(String(list[0].id));
      })
      .catch((err) => setError(err.message || 'Could not load buildings'));
  }, []);

  const loadRules = useCallback(async () => {
    if (!buildingId) return;
    try {
      setRules(await getChargeRules(buildingId));
    } catch (err) {
      setError(err.message || 'Could not load charge rules');
    }
  }, [buildingId]);

  const loadCharges = useCallback(async () => {
    if (!buildingId) return;
    try {
      setCharges(await getServiceCharges(buildingId, filterMonth));
    } catch (err) {
      setError(err.message || 'Could not load charges');
    }
  }, [buildingId, filterMonth]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  useEffect(() => {
    loadCharges();
  }, [loadCharges]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!form.name.trim()) {
      setError('Please enter a rule name.');
      return;
    }
    if (form.amount === '' || Number.isNaN(Number(form.amount)) || Number(form.amount) < 0) {
      setError('Please enter a valid amount (zero or more).');
      return;
    }
    setBusy(true);
    try {
      await createChargeRule({
        buildingId: Number(buildingId),
        name: form.name.trim(),
        ruleType: form.ruleType,
        amount: Number(form.amount),
        applyToVacant: form.applyToVacant,
      });
      setForm(emptyForm);
      setSuccess('Charge rule added.');
      await loadRules();
    } catch (err) {
      setError(err.message || 'Could not add the rule.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (rule) => {
    clearMessages();
    try {
      await setChargeRuleActive(rule.id, !rule.active);
      await loadRules();
    } catch (err) {
      setError(err.message || 'Could not update the rule.');
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`Delete the rule "${rule.name}"? Bills already generated keep their own copy.`)) return;
    clearMessages();
    try {
      await deleteChargeRule(rule.id);
      await loadRules();
    } catch (err) {
      setError(err.message || 'Could not delete the rule.');
    }
  };

  const handleGenerate = async () => {
    clearMessages();
    if (!genMonth) {
      setError('Please choose a billing month.');
      return;
    }
    setBusy(true);
    try {
      const result = await generateServiceCharges(Number(buildingId), genMonth);
      setSuccess(
        `Generated ${result.generatedCount} bill(s) for ${formatMonth(result.billingMonth)}. ` +
          `Skipped ${result.skippedCount} (already billed or no applicable rule). ` +
          `Total billed: ${money(result.totalBilled)}.`
      );
      if (filterMonth === genMonth) {
        await loadCharges();
      } else {
        setFilterMonth(genMonth);
      }
    } catch (err) {
      setError(err.message || 'Could not generate charges.');
    } finally {
      setBusy(false);
    }
  };

  const totalShown = charges.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
  const selectedType = RULE_TYPES.find((t) => t.value === form.ruleType);

  if (buildings.length === 0 && !error) {
    return (
      <div style={styles.card}>
        <div style={styles.empty}>
          No buildings found yet. Register a building in Apartment Registry first, then come back here.
        </div>
      </div>
    );
  }

  return (
    <>
      {error && <div style={styles.errorBanner}>{error}</div>}
      {success && <div style={styles.successBanner}>{success}</div>}

      {/* Building picker */}
      <div style={styles.card}>
        <label style={styles.label}>Building</label>
        <select
          style={{ ...styles.input, minWidth: '260px' }}
          value={buildingId}
          onChange={(e) => {
            clearMessages();
            setBuildingId(e.target.value);
          }}
        >
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Charge rules */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Charge Rules</h2>
        <p style={styles.cardSub}>
          Rules are added together to make each flat&rsquo;s monthly bill. Turn a rule off to leave it out of future
          generations.
        </p>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rule</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Vacant flats</th>
                <th style={styles.th}>Active</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={6}>
                    <span style={styles.muted}>No charge rules yet. Add one below.</span>
                  </td>
                </tr>
              )}
              {rules.map((rule) => (
                <tr key={rule.id} style={rule.active ? undefined : { opacity: 0.55 }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{rule.name}</td>
                  <td style={styles.td}>{typeLabel(rule.ruleType)}</td>
                  <td style={styles.td} className="tabular-nums">
                    <span style={styles.num}>{ruleAmountText(rule)}</span>
                  </td>
                  <td style={styles.td}>{rule.applyToVacant ? 'Charged' : 'Not charged'}</td>
                  <td style={styles.td}>
                    <input type="checkbox" checked={!!rule.active} onChange={() => handleToggle(rule)} />
                  </td>
                  <td style={styles.td}>
                    <button style={styles.iconBtn} title="Delete rule" onClick={() => handleDelete(rule)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddRule} style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Rule name</label>
            <input
              style={styles.input}
              placeholder="e.g. Monthly maintenance"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Type</label>
            <select
              style={styles.input}
              value={form.ruleType}
              onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
            >
              {RULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>{amountLabel(form.ruleType)}</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={form.applyToVacant}
              onChange={(e) => setForm({ ...form, applyToVacant: e.target.checked })}
            />
            Charge vacant flats too
          </label>
          <button type="submit" style={styles.primaryBtn} disabled={busy || !buildingId}>
            <Plus size={15} /> Add rule
          </button>
        </form>
        {selectedType && <div style={styles.hint}>{selectedType.hint}</div>}
      </div>

      {/* Generate */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Generate Monthly Charges</h2>
        <p style={styles.cardSub}>
          Creates one bill per flat from the active rules. Running the same month again will not create duplicates.
        </p>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Billing month</label>
            <input type="month" style={styles.input} value={genMonth} onChange={(e) => setGenMonth(e.target.value)} />
          </div>
          <button style={styles.primaryBtn} onClick={handleGenerate} disabled={busy || !buildingId}>
            <Play size={15} /> {busy ? 'Working...' : 'Generate charges'}
          </button>
        </div>
      </div>

      {/* Ledger */}
      <div style={styles.card}>
        <div style={styles.ledgerHeader}>
          <div>
            <h2 style={styles.cardTitle}>Billing Ledger</h2>
            <p style={{ ...styles.cardSub, marginBottom: 0 }}>Clear the month to see every month.</p>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Month</label>
            <input type="month" style={styles.input} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Unit</th>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Breakdown</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {charges.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={5}>
                    <span style={styles.muted}>No bills for this selection yet.</span>
                  </td>
                </tr>
              )}
              {charges.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{c.unitNumber}</td>
                  <td style={styles.td}>{formatMonth(c.billingMonth)}</td>
                  <td style={styles.td}>
                    <Breakdown items={c.items} />
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }} className="tabular-nums">
                    <span style={styles.num}>{money(c.totalAmount)}</span>
                  </td>
                  <td style={styles.td}>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
            {charges.length > 0 && (
              <tfoot>
                <tr>
                  <td style={{ ...styles.td, fontWeight: 700 }} colSpan={3}>
                    Total ({charges.length} bills)
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                    <span style={styles.num}>{money(totalShown)}</span>
                  </td>
                  <td style={styles.td}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Resident view                                                       */
/* ------------------------------------------------------------------ */
function ResidentView() {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyServiceCharges()
      .then((data) => setCharges(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Could not load your charges.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={styles.card}>Loading your bills...</div>;
  }

  return (
    <>
      {error && <div style={styles.errorBanner}>{error}</div>}
      {charges.length === 0 && !error && (
        <div style={styles.card}>
          <div style={styles.empty}>You have no service charges yet.</div>
        </div>
      )}
      {charges.map((c) => (
        <div key={c.id} style={styles.card}>
          <div style={styles.ledgerHeader}>
            <div>
              <h2 style={styles.cardTitle}>
                {formatMonth(c.billingMonth)} &middot; Unit {c.unitNumber}
              </h2>
            </div>
            <StatusBadge status={c.status} />
          </div>
          <Breakdown items={c.items} />
          <div style={styles.residentTotal} className="tabular-nums">
            Total due: <span style={styles.num}>{money(c.totalAmount)}</span>
          </div>
        </div>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function ServiceCharges() {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || '');
  const isManager = role.includes('MANAGER') || role.includes('ADMIN');

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <Receipt size={20} />
        </div>
        <div>
          <h1 style={styles.title}>Service Charges</h1>
          <p style={styles.subtitle}>
            {isManager
              ? 'Configure charge rules and generate monthly bills for every flat.'
              : 'Your monthly service charges and how each one was calculated.'}
          </p>
        </div>
      </div>
      {isManager ? <ManagerView /> : <ResidentView />}
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'var(--brand-tint)',
    color: 'var(--brand-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13.5px',
    color: 'var(--text-secondary)',
  },
  card: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-hairline)',
    borderRadius: '12px',
    padding: '20px',
  },
  cardTitle: {
    margin: '0 0 4px',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  cardSub: {
    margin: '0 0 16px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  },
  input: {
    padding: '9px 12px',
    border: '1px solid var(--border-hairline)',
    borderRadius: '8px',
    fontSize: '13.5px',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  formRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: '14px',
    marginTop: '16px',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    paddingBottom: '10px',
  },
  hint: {
    marginTop: '10px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--brand-primary)',
    color: '#FFFFFF',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  iconBtn: {
    padding: '6px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '8px 12px',
  },
  td: {
    padding: '10px 12px',
    borderTop: '1px solid var(--border-hairline)',
    fontSize: '13.5px',
    color: 'var(--text-primary)',
    verticalAlign: 'top',
  },
  num: {
    fontVariantNumeric: 'tabular-nums',
  },
  itemLine: {
    fontSize: '12.5px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  muted: {
    color: 'var(--text-muted)',
  },
  badge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '999px',
  },
  ledgerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '14px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  residentTotal: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border-hairline)',
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  empty: {
    padding: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  errorBanner: {
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    fontSize: '13.5px',
  },
  successBanner: {
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    fontSize: '13.5px',
  },
};
