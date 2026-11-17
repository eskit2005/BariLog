import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  BookOpen,
  Megaphone,
  MessageSquareWarning,
  FileSignature,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  Clock,
  Building2,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import {
  getBuildingRules,
  createBuildingRule,
  getNotices,
  createNotice,
  deleteNotice,
  getComplaints,
  createComplaint,
  resolveComplaint,
  getMaintenanceAgreements,
  createMaintenanceAgreement,
  markAgreementNoted,
  getExpiryReminders,
} from '../../services/api';
import { modalStyles } from '../../components/modals/CreateBuildingModal';

/* =============================================================================
   Feature 03: Digital Document Repository (View layer)
   Tabs: Building Rules, Notices, Complaints, Maintenance Agreements
   ============================================================================= */

const RULE_CATEGORIES = ['GENERAL', 'NOISE', 'HYGIENE', 'SECURITY', 'SAFETY', 'PARKING', 'FINANCE'];
const NOTICE_CATEGORIES = ['GENERAL', 'URGENT', 'MAINTENANCE', 'EVENT'];
const COMPLAINT_CATEGORIES = ['GENERAL', 'NOISE', 'CLEANLINESS', 'SECURITY', 'PARKING', 'NEIGHBOUR'];

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ----------------------------- "New item" tracking -----------------------------
   Stores, per user and per tab, when the user last opened that tab (in localStorage).
   Anything submitted/updated by someone else after that time counts as new. */
const seenKey = (userId) => `barilog_docs_seen_${userId}`;
const loadSeen = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(seenKey(userId))) || {};
  } catch {
    return {};
  }
};
const saveSeen = (userId, seen) => {
  try {
    localStorage.setItem(seenKey(userId), JSON.stringify(seen));
  } catch {
    /* storage unavailable: badges simply reset */
  }
};
const toMillis = (value) => (value ? new Date(value).getTime() : 0);

/* ----------------------------- Small UI pieces ----------------------------- */

const Pill = ({ tone = 'neutral', children }) => {
  const tones = {
    green: { color: 'var(--status-occupied-text)', bg: 'var(--status-occupied-bg)', border: 'var(--status-occupied-border)' },
    blue: { color: 'var(--status-rented-text)', bg: 'var(--status-rented-bg)', border: 'var(--status-rented-border)' },
    amber: { color: 'var(--status-pending-text)', bg: 'var(--status-pending-bg)', border: 'var(--status-pending-border)' },
    red: { color: 'var(--status-vacant-text)', bg: 'var(--status-vacant-bg)', border: 'var(--status-vacant-border)' },
    neutral: { color: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border-hairline)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{ ...styles.pill, color: t.color, backgroundColor: t.bg, borderColor: t.border }}>
      {children}
    </span>
  );
};

const ExpiryBadge = ({ date }) => {
  const d = daysUntil(date);
  if (d === null) return <Pill>No expiry</Pill>;
  if (d < 0) return <Pill tone="red">Expired {Math.abs(d)}d ago</Pill>;
  if (d === 0) return <Pill tone="red">Expires today</Pill>;
  if (d <= 30) return <Pill tone="amber">Expires in {d}d</Pill>;
  return <Pill tone="green">Valid · {formatDate(date)}</Pill>;
};

const NewTag = () => <span style={styles.newTag}>NEW</span>;

const noticeTone = (category) =>
  ({ URGENT: 'red', MAINTENANCE: 'amber', EVENT: 'blue' }[category] || 'neutral');

const EmptyState = ({ icon: Icon, text }) => (
  <div style={styles.empty}>
    <Icon size={28} color="var(--text-muted)" />
    <p>{text}</p>
  </div>
);

/* ----------------------------- Generic form modal ----------------------------- */

const FormModal = ({ title, icon: Icon, fields, initial, submitLabel, onSubmit, onClose }) => {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.card, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 600 }}>{title}</h3>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={18} /></button>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {fields.map((f) => (
            <div key={f.name} style={modalStyles.formGroup}>
              <label style={modalStyles.label}>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  rows={4}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  style={{ ...modalStyles.input, resize: 'vertical' }}
                />
              ) : f.type === 'select' ? (
                <select
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  style={modalStyles.input}
                >
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  required={f.required}
                  min={f.min}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  style={modalStyles.input}
                />
              )}
            </div>
          ))}

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={modalStyles.submitBtn}>
              {saving ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------- Main page ----------------------------- */

export const DocumentRepository = () => {
  const { user } = useContext(AuthContext);
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isResident = user?.role === 'RESIDENT';
  const canUsePrivateTabs = isManager || isResident;

  const tabs = [
    { key: 'rules', label: 'Building Rules', icon: BookOpen },
    { key: 'notices', label: 'Notices', icon: Megaphone },
    ...(canUsePrivateTabs
      ? [
          { key: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
          { key: 'maintenance', label: 'Maintenance Agreements', icon: FileSignature },
        ]
      : []),
  ];

  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [reminders, setReminders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type, target }
  const seenRef = useRef(loadSeen(user?.id));
  const activatedTabRef = useRef(null);
  const [highlightSince, setHighlightSince] = useState({}); // tab -> time used for NEW tags

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [getBuildingRules(), getNotices(), getExpiryReminders(30)];
      if (canUsePrivateTabs) {
        requests.push(getComplaints(), getMaintenanceAgreements());
      }
      const [r, n, exp, c, m] = await Promise.all(requests);
      setRules(r || []);
      setNotices(n || []);
      setReminders(exp || null);
      setComplaints(c || []);
      setAgreements(m || []);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [canUsePrivateTabs]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Activity per tab for the current user: { id -> time of the latest event by someone else }
  const activityFor = (tabKey) => {
    const me = user?.id;
    const map = new Map();
    switch (tabKey) {
      case 'rules':
        rules
          .filter((r) => r.createdById && r.createdById !== me)
          .forEach((r) => map.set(r.id, toMillis(r.createdAt)));
        break;
      case 'notices':
        notices
          .filter((n) => n.createdById !== me)
          .forEach((n) => map.set(n.id, toMillis(n.createdAt)));
        break;
      case 'complaints':
        complaints.forEach((c) =>
          map.set(c.id, isManager ? toMillis(c.createdAt) : toMillis(c.resolvedAt))
        );
        break;
      case 'maintenance':
        agreements.forEach((a) => {
          if (a.submittedById === me) {
            // My own agreement: new only when someone else marks it noted
            map.set(a.id, a.notedById && a.notedById !== me ? toMillis(a.notedAt) : 0);
          } else {
            map.set(a.id, toMillis(a.createdAt));
          }
        });
        break;
      default:
        break;
    }
    return map;
  };

  const unseenCount = (tabKey) => {
    if (tabKey === activeTab) return 0;
    const since = seenRef.current[tabKey] || 0;
    let count = 0;
    activityFor(tabKey).forEach((time) => {
      if (time > since) count += 1;
    });
    return count;
  };

  const isNewItem = (tabKey, id) => {
    const since = highlightSince[tabKey];
    if (since === undefined) return false;
    return (activityFor(tabKey).get(id) || 0) > since;
  };

  // When a tab is opened, remember the previous "last seen" for NEW tags, then mark it seen now
  useEffect(() => {
    if (loading || !user?.id) return;
    if (activatedTabRef.current === activeTab) return;
    activatedTabRef.current = activeTab;
    const previous = seenRef.current[activeTab] || 0;
    setHighlightSince((h) => ({ ...h, [activeTab]: previous }));
    seenRef.current = { ...seenRef.current, [activeTab]: Date.now() };
    saveSeen(user.id, seenRef.current);
  }, [activeTab, loading, user?.id]);

  const reminderCount =
    (reminders?.expiringNotices?.length || 0) + (reminders?.expiringAgreements?.length || 0);

  /* ----------------------------- Actions ----------------------------- */

  const handleDeleteNotice = async (notice) => {
    if (!window.confirm(`Delete notice "${notice.title}"? This cannot be undone.`)) return;
    try {
      await deleteNotice(notice.id);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to delete notice');
    }
  };

  const handleMarkNoted = async (agreement) => {
    try {
      await markAgreementNoted(agreement.id);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update agreement');
    }
  };

  /* ----------------------------- Header button per tab ----------------------------- */

  const headerAction = () => {
    if (activeTab === 'rules' && isManager) {
      return { label: 'Add Rule', onClick: () => setModal({ type: 'rule' }) };
    }
    if (activeTab === 'notices' && isManager) {
      return { label: 'Post Notice', onClick: () => setModal({ type: 'notice' }) };
    }
    if (activeTab === 'complaints' && isResident) {
      return { label: 'File Complaint', onClick: () => setModal({ type: 'complaint' }) };
    }
    if (activeTab === 'maintenance' && isResident) {
      return { label: 'Submit Agreement', onClick: () => setModal({ type: 'agreement' }) };
    }
    if (activeTab === 'maintenance' && isManager) {
      return { label: 'Add Building Agreement', onClick: () => setModal({ type: 'agreement' }) };
    }
    return null;
  };
  const action = headerAction();

  /* ----------------------------- Tab content ----------------------------- */

  const renderRules = () =>
    rules.length === 0 ? (
      <EmptyState icon={BookOpen} text="No building rules have been published yet." />
    ) : (
      <div style={styles.cardGrid}>
        {rules.map((rule, idx) => (
          <div key={rule.id} style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.ruleNumber} className="tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
              <div style={styles.pillRow}>
                {isNewItem('rules', rule.id) && <NewTag />}
                <Pill>{rule.category}</Pill>
              </div>
            </div>
            <h4 style={styles.cardTitle}>{rule.title}</h4>
            <p style={styles.cardBody}>{rule.description}</p>
          </div>
        ))}
      </div>
    );

  const renderNotices = () =>
    notices.length === 0 ? (
      <EmptyState icon={Megaphone} text="No active notices right now." />
    ) : (
      <div style={styles.list}>
        {notices.map((n) => (
          <div key={n.id} style={{ ...styles.card, opacity: n.expired ? 0.6 : 1 }}>
            <div style={styles.cardTop}>
              <div style={styles.pillRow}>
                {isNewItem('notices', n.id) && <NewTag />}
                <Pill tone={noticeTone(n.category)}>{n.category}</Pill>
                {n.expiryDate && <ExpiryBadge date={n.expiryDate} />}
              </div>
              {isManager && (
                <button onClick={() => handleDeleteNotice(n)} style={styles.iconBtnDanger} title="Delete notice">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <h4 style={styles.cardTitle}>{n.title}</h4>
            <p style={styles.cardBody}>{n.content}</p>
            <div style={styles.meta}>
              Posted {formatDate(n.createdAt)}{n.createdByName ? ` by ${n.createdByName}` : ''}
            </div>
          </div>
        ))}
      </div>
    );

  const renderComplaints = () =>
    complaints.length === 0 ? (
      <EmptyState
        icon={MessageSquareWarning}
        text={isManager ? 'No complaints have been filed.' : 'You have not filed any complaints.'}
      />
    ) : (
      <div style={styles.list}>
        {complaints.map((c) => (
          <div key={c.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.pillRow}>
                {isNewItem('complaints', c.id) && <NewTag />}
                <Pill tone={c.status === 'RESOLVED' ? 'green' : 'amber'}>{c.status}</Pill>
                <Pill>{c.category}</Pill>
              </div>
              {isManager && c.status === 'OPEN' && (
                <button onClick={() => setModal({ type: 'resolve', target: c })} style={styles.smallPrimaryBtn}>
                  <CheckCircle2 size={14} /> Resolve
                </button>
              )}
            </div>
            <h4 style={styles.cardTitle}>{c.title}</h4>
            <p style={styles.cardBody}>{c.description}</p>
            {c.resolutionNote && (
              <div style={styles.resolution}>
                <strong>Resolution:</strong> {c.resolutionNote}
                <div style={styles.meta}>
                  {c.resolvedByName ? `By ${c.resolvedByName} · ` : ''}{formatDate(c.resolvedAt)}
                </div>
              </div>
            )}
            <div style={styles.meta}>
              Filed {formatDate(c.createdAt)}{isManager && c.residentName ? ` by ${c.residentName}` : ''}
            </div>
          </div>
        ))}
      </div>
    );

  const renderAgreements = () =>
    agreements.length === 0 ? (
      <EmptyState
        icon={FileSignature}
        text={isManager ? 'No maintenance agreements yet. Add a building contract or wait for residents to submit one.' : 'No agreements yet. Building contracts from management and your own submissions will show here.'}
      />
    ) : (
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Agreement</th>
              <th style={styles.th}>Scope</th>
              <th style={styles.th}>Vendor</th>
              <th style={styles.th}>Service</th>
              <th style={styles.th}>Period</th>
              <th style={styles.th}>Expiry</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map((a) => (
              <tr key={a.id}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    {isNewItem('maintenance', a.id) && <NewTag />}
                    {a.title}
                  </div>
                  {a.description && <div style={styles.subText}>{a.description}</div>}
                </td>
                <td style={styles.td}>
                  {a.buildingLevel ? (
                    <Pill tone="blue">Building</Pill>
                  ) : (
                    <div>
                      <Pill>Flat</Pill>
                      {isManager && <div style={styles.subText}>{a.submittedByName}</div>}
                    </div>
                  )}
                </td>
                <td style={styles.td}>{a.vendorName}</td>
                <td style={styles.td}>{a.serviceType}</td>
                <td style={styles.td} className="tabular-nums">
                  {formatDate(a.startDate)} – {formatDate(a.expiryDate)}
                </td>
                <td style={styles.td}><ExpiryBadge date={a.expiryDate} /></td>
                <td style={styles.td}>
                  {a.status === 'NOTED' ? (
                    <Pill tone="green">Noted</Pill>
                  ) : isManager ? (
                    <button onClick={() => handleMarkNoted(a)} style={styles.smallPrimaryBtn}>
                      <CheckCircle2 size={14} /> Noted
                    </button>
                  ) : (
                    <Pill tone="amber">Pending</Pill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  /* ----------------------------- Modals ----------------------------- */

  const renderModal = () => {
    if (!modal) return null;
    const close = () => setModal(null);
    const afterSave = async (fn) => {
      await fn();
      await loadAll();
    };

    switch (modal.type) {
      case 'rule':
        return (
          <FormModal
            title="Add Building Rule"
            icon={BookOpen}
            submitLabel="Add Rule"
            initial={{ title: '', category: 'GENERAL', description: '' }}
            fields={[
              { name: 'title', label: 'Rule Title', required: true, placeholder: 'e.g. Rooftop Access' },
              { name: 'category', label: 'Category', type: 'select', options: RULE_CATEGORIES },
              { name: 'description', label: 'Rule Details', type: 'textarea', required: true },
            ]}
            onSubmit={(form) => afterSave(() => createBuildingRule(form))}
            onClose={close}
          />
        );
      case 'notice':
        return (
          <FormModal
            title="Post Notice"
            icon={Megaphone}
            submitLabel="Publish Notice"
            initial={{ title: '', category: 'GENERAL', content: '', expiryDate: '' }}
            fields={[
              { name: 'title', label: 'Notice Title', required: true, placeholder: 'e.g. Water supply off on Friday' },
              { name: 'category', label: 'Category', type: 'select', options: NOTICE_CATEGORIES },
              { name: 'content', label: 'Notice Content', type: 'textarea', required: true },
              { name: 'expiryDate', label: 'Show Until (optional)', type: 'date', min: todayISO() },
            ]}
            onSubmit={(form) =>
              afterSave(() => createNotice({ ...form, expiryDate: form.expiryDate || null }))
            }
            onClose={close}
          />
        );
      case 'complaint':
        return (
          <FormModal
            title="File a Complaint"
            icon={MessageSquareWarning}
            submitLabel="Submit Complaint"
            initial={{ title: '', category: 'GENERAL', description: '' }}
            fields={[
              { name: 'title', label: 'Subject', required: true, placeholder: 'e.g. Loud music from 5B at night' },
              { name: 'category', label: 'Category', type: 'select', options: COMPLAINT_CATEGORIES },
              { name: 'description', label: 'Details', type: 'textarea', required: true },
            ]}
            onSubmit={(form) => afterSave(() => createComplaint(form))}
            onClose={close}
          />
        );
      case 'agreement':
        return (
          <FormModal
            title={isManager ? 'Add Building Agreement' : 'Submit Maintenance Agreement'}
            icon={isManager ? Building2 : FileSignature}
            submitLabel={isManager ? 'Add Agreement' : 'Submit Agreement'}
            initial={{ title: '', vendorName: '', serviceType: '', description: '', startDate: todayISO(), expiryDate: '' }}
            fields={[
              {
                name: 'title',
                label: 'Agreement Title',
                required: true,
                placeholder: isManager ? 'e.g. Lift annual maintenance contract' : 'e.g. AC servicing contract',
              },
              { name: 'vendorName', label: 'Vendor / Company', required: true },
              { name: 'serviceType', label: 'Service Type', required: true, placeholder: 'e.g. Air conditioning' },
              { name: 'startDate', label: 'Start Date', type: 'date', required: true },
              { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
              { name: 'description', label: 'Notes (optional)', type: 'textarea' },
            ]}
            onSubmit={(form) => afterSave(() => createMaintenanceAgreement(form))}
            onClose={close}
          />
        );
      case 'resolve':
        return (
          <FormModal
            title={`Resolve: ${modal.target.title}`}
            icon={CheckCircle2}
            submitLabel="Mark Resolved"
            initial={{ resolutionNote: '' }}
            fields={[
              { name: 'resolutionNote', label: 'Resolution Note', type: 'textarea', required: true, placeholder: 'What was done to fix this?' },
            ]}
            onSubmit={(form) => afterSave(() => resolveComplaint(modal.target.id, form))}
            onClose={close}
          />
        );
      default:
        return null;
    }
  };

  /* ----------------------------- Render ----------------------------- */

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Documents & Repository</h1>
          <p style={styles.pageSubtitle}>
            Building rules, notices, complaints and maintenance agreements in one place.
          </p>
        </div>
        <div style={styles.headerActions}>
          <span style={styles.roleBadge}>
            <ShieldCheck size={14} />
            {isManager ? 'Manager Access: Full Control' : isResident ? 'Resident Access' : 'Read-only Access'}
          </span>
          {action && (
            <button onClick={action.onClick} style={styles.primaryBtn}>
              <Plus size={16} /> {action.label}
            </button>
          )}
        </div>
      </div>

      {reminderCount > 0 && (
        <div style={styles.reminderBanner}>
          <AlertTriangle size={18} />
          <div style={{ flex: 1 }}>
            <strong>{reminderCount} document{reminderCount > 1 ? 's' : ''} need attention</strong> (expired or expiring
            within {reminders.windowDays} days)
            <ul style={styles.reminderList}>
              {reminders.expiringAgreements.map((a) => (
                <li key={`a-${a.id}`}>
                  <Clock size={12} /> Agreement: {a.title} ({a.vendorName}) · {formatDate(a.expiryDate)}
                </li>
              ))}
              {reminders.expiringNotices.map((n) => (
                <li key={`n-${n.id}`}>
                  <Clock size={12} /> Notice: {n.title} · {formatDate(n.expiryDate)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div style={styles.tabBar}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          const unseen = loading ? 0 : unseenCount(t.key);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
            >
              <Icon size={16} /> {t.label}
              {unseen > 0 && (
                <span style={styles.tabBadge} title={`${unseen} new`}>
                  {unseen > 9 ? '9+' : unseen}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <div style={modalStyles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading documents...</div>
      ) : (
        <>
          {activeTab === 'rules' && renderRules()}
          {activeTab === 'notices' && renderNotices()}
          {activeTab === 'complaints' && canUsePrivateTabs && renderComplaints()}
          {activeTab === 'maintenance' && canUsePrivateTabs && renderAgreements()}
        </>
      )}

      {renderModal()}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  roleBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '999px',
    fontSize: '12px', fontWeight: 500, color: 'var(--brand-primary)', backgroundColor: 'var(--brand-tint)',
    border: '1px solid var(--border-hairline)',
  },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
    backgroundColor: 'var(--brand-primary)', color: '#FFFFFF', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
  },
  smallPrimaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
    backgroundColor: 'var(--brand-primary)', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, fontSize: '12px',
  },
  iconBtnDanger: {
    padding: '6px', borderRadius: '6px', color: 'var(--status-vacant-text)',
    border: '1px solid var(--status-vacant-border)', backgroundColor: 'var(--status-vacant-bg)',
  },
  reminderBanner: {
    display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', borderRadius: '10px',
    backgroundColor: 'var(--status-pending-bg)', border: '1px solid var(--status-pending-border)',
    color: 'var(--status-pending-text)', fontSize: '13px',
  },
  reminderList: {
    listStyle: 'none', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12.5px',
  },
  tabBar: { display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-hairline)', overflowX: 'auto' },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', fontSize: '13.5px',
    fontWeight: 500, color: 'var(--text-secondary)', borderBottom: '2px solid transparent', marginBottom: '-1px',
    whiteSpace: 'nowrap',
  },
  tabBadge: {
    minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '999px', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#FFFFFF',
    backgroundColor: 'var(--status-vacant-text)', marginLeft: '2px',
  },
  newTag: {
    display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: '999px', fontSize: '10.5px',
    fontWeight: 700, letterSpacing: '0.05em', color: '#FFFFFF', backgroundColor: 'var(--status-vacant-text)',
  },
  pillRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  tabActive: { color: 'var(--brand-primary)', borderBottom: '2px solid var(--brand-primary)', fontWeight: 600 },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: {
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '10px',
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  ruleNumber: { fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' },
  cardTitle: { fontSize: '15px', fontWeight: 600 },
  cardBody: { fontSize: '13.5px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' },
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' },
  resolution: {
    fontSize: '13px', color: 'var(--status-occupied-text)', backgroundColor: 'var(--status-occupied-bg)',
    border: '1px solid var(--status-occupied-border)', borderRadius: '8px', padding: '10px 12px',
  },
  pill: {
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '999px', border: '1px solid',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
  },
  tableWrap: {
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '10px',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' },
  th: {
    textAlign: 'left', padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', fontSize: '11.5px',
    fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-hairline)',
  },
  td: { padding: '12px 16px', borderBottom: '1px solid var(--border-hairline)', verticalAlign: 'top' },
  subText: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '48px 20px',
    color: 'var(--text-secondary)', fontSize: '14px', backgroundColor: 'var(--bg-surface)',
    border: '1px dashed var(--border-strong)', borderRadius: '10px',
  },
  loading: { padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' },
};

export default DocumentRepository;
