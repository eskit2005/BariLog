import React, { useContext, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ShieldCheck,
  Shield,
  Phone,
  Mail,
  HeartPulse,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  User,
  Building2,
  Save,
  RefreshCw,
  UserCheck,
  Plus,
  Edit2,
  Stethoscope,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import * as api from '../../services/api';
import './ResidentDirectory.css';

const fields = [
  'bloodGroup',
  'emergencyContactName',
  'emergencyContactRelationship',
  'emergencyContactPhone',
  'physicianName',
  'physicianPhone',
];
const labels = [
  'Blood group',
  'Next-of-kin name',
  'Relationship',
  'Next-of-kin phone',
  'Physician name',
  'Physician phone',
];
const emptyProfile = Object.fromEntries(fields.map((f) => [f, '']));
const message = (e) => e.message || 'Unable to complete this request.';

export default function ResidentDirectory() {
  const { user } = useContext(AuthContext);
  const { selectedBuildingId, refreshBuildings } = useOutletContext();
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Privacy preferences state
  const [prefs, setPrefs] = useState(null);
  const [prefsError, setPrefsError] = useState('');
  const [prefsSuccess, setPrefsSuccess] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Resident's own personal profile & emergency details state
  const [myEmergency, setMyEmergency] = useState(null);
  const [editingMyProfile, setEditingMyProfile] = useState(false);
  const [myDraft, setMyDraft] = useState(emptyProfile);
  const [savingMyProfile, setSavingMyProfile] = useState(false);
  const [myProfileSuccess, setMyProfileSuccess] = useState(false);
  const [myProfileError, setMyProfileError] = useState('');

  // Phone number inline edit
  const [currentPhone, setCurrentPhone] = useState(user?.phoneNumber || '');
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState(user?.phoneNumber || '');
  const [savingPhone, setSavingPhone] = useState(false);

  // Emergency contact slide-over state (viewing someone else)
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyProfile);
  const [savingEmergency, setSavingEmergency] = useState(false);

  const [revision, setRevision] = useState(0);

  const key = `${user?.id}:${selectedBuildingId}`;
  const rows = result?.key === key ? result.rows : [];
  const manager = ['MANAGER', 'ADMIN'].includes(user?.role);

  // Sync phone from user context if changed
  useEffect(() => {
    if (user?.phoneNumber) {
      setCurrentPhone(user.phoneNumber);
      setPhoneDraft(user.phoneNumber);
    }
  }, [user?.phoneNumber]);

  // Fetch directory preferences and personal emergency details for resident
  useEffect(() => {
    const c = new AbortController();
    setPrefs(null);
    setPrefsError('');
    setPrefsSuccess(false);

    if (user?.role === 'RESIDENT') {
      api
        .getDirectoryPreferences({ signal: c.signal })
        .then((data) => {
          if (!c.signal.aborted) {
            setPrefs({
              sharePhone: Boolean(data?.sharePhone),
              shareEmail: Boolean(data?.shareEmail),
              shareEmergencyContacts: Boolean(data?.shareEmergencyContacts),
            });
          }
        })
        .catch((e) => {
          if (!c.signal.aborted) setPrefsError(message(e));
        });

      api
        .getMyEmergencyDetails({ signal: c.signal })
        .then((data) => {
          if (!c.signal.aborted) {
            setMyEmergency(data);
            setMyDraft(Object.fromEntries(fields.map((f) => [f, data[f] || ''])));
          }
        })
        .catch(() => {});
    }

    return () => c.abort();
  }, [user?.id, user?.role, revision]);

  // Fetch resident directory rows for selected building
  useEffect(() => {
    const c = new AbortController();
    setResult(null);
    setSelected(null);
    setDetail(null);
    setEditing(false);
    setError('');

    if (selectedBuildingId && user?.role !== 'STAFF') {
      setLoading(true);
      api
        .getResidentDirectory(selectedBuildingId, { signal: c.signal })
        .then((data) => {
          if (!c.signal.aborted) setResult({ key, rows: data });
        })
        .catch((e) => {
          if (!c.signal.aborted) setError(message(e));
        })
        .finally(() => {
          if (!c.signal.aborted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => c.abort();
  }, [key, revision]);

  // Fetch emergency contact profile when a resident is selected
  useEffect(() => {
    const c = new AbortController();
    setDetail(null);
    setDetailError('');
    setEditing(false);

    if (selected?.key === key) {
      api
        .getResidentEmergency(selectedBuildingId, selected.row.residentId, { signal: c.signal })
        .then((profile) => {
          if (!c.signal.aborted) {
            setDetail({ key, residentId: selected.row.residentId, profile });
            setDraft(Object.fromEntries(fields.map((f) => [f, profile[f] || ''])));
          }
        })
        .catch((e) => {
          if (!c.signal.aborted) setDetailError(message(e));
        });
    }

    return () => c.abort();
  }, [selected, key]);

  // Refetch on window focus
  useEffect(() => {
    const focus = () => setRevision((n) => n + 1);
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, []);

  if (user?.role === 'STAFF') {
    return (
      <div className="directory">
        <header>
          <span className="directory-eyebrow">COMMUNITY · RESIDENT DIRECTORY</span>
          <h1>Resident Directory</h1>
          <p>Directory access is reserved for building residents, managers, and assigned security personnel.</p>
        </header>
      </div>
    );
  }

  const current = selected?.key === key ? selected.row : null;
  const profile = detail?.key === key && detail.residentId === current?.residentId ? detail.profile : null;
  const filtered = rows.filter((r) =>
    `${r.name} ${r.units.map((u) => u.unitNumber).join(' ')}`.toLowerCase().includes(query.toLowerCase())
  );

  async function savePreferences(e) {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsError('');
    setPrefsSuccess(false);

    const payload = {
      sharePhone: Boolean(prefs?.sharePhone),
      shareEmail: Boolean(prefs?.shareEmail),
      shareEmergencyContacts: Boolean(prefs?.shareEmergencyContacts),
    };

    try {
      const updated = await api.updateDirectoryPreferences(payload);
      setPrefs({
        sharePhone: Boolean(updated?.sharePhone),
        shareEmail: Boolean(updated?.shareEmail),
        shareEmergencyContacts: Boolean(updated?.shareEmergencyContacts),
      });
      setPrefsSuccess(true);
      setRevision((n) => n + 1);
    } catch (e) {
      setPrefsError(message(e));
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveMyEmergency(e) {
    e.preventDefault();
    setSavingMyProfile(true);
    setMyProfileError('');
    setMyProfileSuccess(false);

    try {
      const updated = await api.updateMyEmergencyDetails(myDraft);
      setMyEmergency(updated);
      setEditingMyProfile(false);
      setMyProfileSuccess(true);
      setRevision((n) => n + 1);
    } catch (e) {
      setMyProfileError(message(e));
    } finally {
      setSavingMyProfile(false);
    }
  }

  async function savePhone(e) {
    e.preventDefault();
    setSavingPhone(true);
    try {
      const res = await api.updateMyPhoneNumber(phoneDraft);
      setCurrentPhone(res.phoneNumber);
      setEditingPhone(false);
      setRevision((n) => n + 1);
    } catch (e) {
      alert(message(e));
    } finally {
      setSavingPhone(false);
    }
  }

  async function saveEmergency(e) {
    e.preventDefault();
    setSavingEmergency(true);
    setDetailError('');

    try {
      const p = await api.updateResidentEmergency(selectedBuildingId, current.residentId, draft);
      setDetail({ key, residentId: current.residentId, profile: p });
      setEditing(false);
      setRevision((n) => n + 1);
    } catch (e) {
      setDetailError(message(e));
    } finally {
      setSavingEmergency(false);
    }
  }

  return (
    <div className="directory">
      <header>
        <div>
          <span className="directory-eyebrow">COMMUNITY · RESIDENT DIRECTORY</span>
          <h1>Resident Directory</h1>
          <p>Find your neighbors, view apartment unit allocations, and manage your directory contact privacy.</p>
        </div>
      </header>

      {/* 1. Contact Privacy Preferences Section for Residents */}
      {user?.role === 'RESIDENT' && (
        <section className="directory-card privacy-card" aria-label="Contact privacy settings">
          <div className="card-header-with-icon">
            <div className="header-icon-badge">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2>Your contact privacy</h2>
              <p>
                These settings control what other residents can see. Building managers and assigned security staff can
                still access your details.
              </p>
            </div>
          </div>

          {prefsSuccess && (
            <div className="directory-alert success" role="status">
              <CheckCircle2 size={18} />
              <span>Your contact privacy settings have been saved successfully and applied to the directory.</span>
              <button type="button" onClick={() => setPrefsSuccess(false)} title="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}

          {prefsError && (
            <div className="directory-alert error" role="alert">
              <AlertCircle size={18} />
              <span>{prefsError}</span>
              <button type="button" onClick={() => setPrefsError('')} title="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}

          {prefs ? (
            <form onSubmit={savePreferences}>
              <div className="privacy-switches-grid">
                {/* 1. Phone Privacy */}
                <div className={`privacy-switch-row ${prefs.sharePhone ? 'is-active' : ''}`}>
                  <div className="switch-label-area">
                    <div className="switch-icon-box">
                      <Phone size={18} />
                    </div>
                    <div className="switch-info">
                      <span className="switch-title">Share my phone number</span>
                      <span className="switch-desc">
                        {prefs.sharePhone
                          ? `Visible to neighbors (${currentPhone || 'No phone set yet'}).`
                          : 'Your phone number is hidden from other residents.'}
                      </span>
                    </div>
                  </div>
                  <div className="switch-control-area">
                    <span className={`badge-status ${prefs.sharePhone ? 'shared' : 'private'}`}>
                      {prefs.sharePhone ? <Eye size={12} /> : <EyeOff size={12} />}
                      {prefs.sharePhone ? 'Visible to neighbors' : 'Hidden from neighbors'}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={prefs.sharePhone}
                        onChange={(e) => setPrefs({ ...prefs, sharePhone: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* 2. Email Privacy */}
                <div className={`privacy-switch-row ${prefs.shareEmail ? 'is-active' : ''}`}>
                  <div className="switch-label-area">
                    <div className="switch-icon-box">
                      <Mail size={18} />
                    </div>
                    <div className="switch-info">
                      <span className="switch-title">Share my email</span>
                      <span className="switch-desc">
                        {prefs.shareEmail
                          ? `Visible to neighbors (${user?.email}).`
                          : 'Your email address is hidden from other residents.'}
                      </span>
                    </div>
                  </div>
                  <div className="switch-control-area">
                    <span className={`badge-status ${prefs.shareEmail ? 'shared' : 'private'}`}>
                      {prefs.shareEmail ? <Eye size={12} /> : <EyeOff size={12} />}
                      {prefs.shareEmail ? 'Visible to neighbors' : 'Hidden from neighbors'}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={prefs.shareEmail}
                        onChange={(e) => setPrefs({ ...prefs, shareEmail: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* 3. Emergency Contacts Privacy */}
                <div className={`privacy-switch-row ${prefs.shareEmergencyContacts ? 'is-active' : ''}`}>
                  <div className="switch-label-area">
                    <div className="switch-icon-box">
                      <HeartPulse size={18} />
                    </div>
                    <div className="switch-info">
                      <span className="switch-title">Share my emergency details</span>
                      <span className="switch-desc">
                        {prefs.shareEmergencyContacts
                          ? 'Neighbors in this building can view your emergency contact & physician details.'
                          : 'Emergency details are kept private (accessible only by managers and security).'}
                      </span>
                    </div>
                  </div>
                  <div className="switch-control-area">
                    <span className={`badge-status ${prefs.shareEmergencyContacts ? 'shared' : 'private'}`}>
                      {prefs.shareEmergencyContacts ? <Eye size={12} /> : <EyeOff size={12} />}
                      {prefs.shareEmergencyContacts ? 'Visible to neighbors' : 'Hidden from neighbors'}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={prefs.shareEmergencyContacts}
                        onChange={(e) => setPrefs({ ...prefs, shareEmergencyContacts: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="privacy-actions">
                <button type="submit" className="save-privacy-btn" disabled={savingPrefs}>
                  {savingPrefs ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving preferences...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save privacy settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="directory-empty-state">
              <RefreshCw size={20} className="animate-spin" />
              <span>Loading privacy preferences…</span>
            </div>
          )}
        </section>
      )}

      {/* 2. Resident's Own Contact & Emergency Data Card */}
      {user?.role === 'RESIDENT' && (
        <section className="directory-card profile-card" aria-label="Your Contact and Emergency Details">
          <div className="card-header-with-icon">
            <div className="header-icon-badge" style={{ background: '#EFF6FF', color: '#2563EB', borderColor: '#DBEAFE' }}>
              <User size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <h2>Your Contact & Emergency Details</h2>
                {!editingMyProfile && (
                  <button
                    type="button"
                    className="btn-small-primary"
                    onClick={() => setEditingMyProfile(true)}
                  >
                    <Edit2 size={13} style={{ marginRight: '4px' }} />
                    Edit Emergency Record
                  </button>
                )}
              </div>
              <p>
                These details are stored on your resident account. Use the controls above to choose which ones you share with neighbors.
              </p>
            </div>
          </div>

          {myProfileSuccess && (
            <div className="directory-alert success" role="status">
              <CheckCircle2 size={18} />
              <span>Your emergency contact details were updated successfully!</span>
              <button type="button" onClick={() => setMyProfileSuccess(false)}><X size={14} /></button>
            </div>
          )}

          {myProfileError && (
            <div className="directory-alert error" role="alert">
              <AlertCircle size={18} />
              <span>{myProfileError}</span>
              <button type="button" onClick={() => setMyProfileError('')}><X size={14} /></button>
            </div>
          )}

          {!editingMyProfile ? (
            <div className="profile-details-grid">
              {/* Phone */}
              <div className="profile-item">
                <span className="profile-item-header"><Phone size={13} /> Phone Number</span>
                {!editingPhone ? (
                  <div className="profile-item-val">
                    <span>{currentPhone || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}</span>
                    <button
                      type="button"
                      className="btn-small-secondary"
                      onClick={() => setEditingPhone(true)}
                      title="Edit phone number"
                    >
                      <Edit2 size={11} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={savePhone} className="inline-phone-form">
                    <input
                      className="inline-phone-input"
                      value={phoneDraft}
                      placeholder="+8801700..."
                      onChange={(e) => setPhoneDraft(e.target.value)}
                    />
                    <button type="submit" className="btn-small-primary" disabled={savingPhone}>
                      {savingPhone ? '...' : 'Save'}
                    </button>
                    <button type="button" className="btn-small-secondary" onClick={() => setEditingPhone(false)}>
                      Cancel
                    </button>
                  </form>
                )}
                <span className="profile-item-sub">Registered login phone</span>
              </div>

              {/* Email */}
              <div className="profile-item">
                <span className="profile-item-header"><Mail size={13} /> Email Address</span>
                <span className="profile-item-val">{user?.email}</span>
                <span className="profile-item-sub">Primary account identity</span>
              </div>

              {/* Blood Group */}
              <div className="profile-item">
                <span className="profile-item-header"><HeartPulse size={13} /> Blood Group</span>
                <span className="profile-item-val">
                  {myEmergency?.bloodGroup ? (
                    <span className="blood-group-badge">{myEmergency.bloodGroup}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
                  )}
                </span>
                <span className="profile-item-sub">Crucial for emergency services</span>
              </div>

              {/* Next-of-Kin */}
              <div className="profile-item">
                <span className="profile-item-header"><User size={13} /> Next-of-Kin Contact</span>
                <span className="profile-item-val">
                  {myEmergency?.emergencyContactName ? (
                    `${myEmergency.emergencyContactName} (${myEmergency.emergencyContactRelationship || 'Contact'})`
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
                  )}
                </span>
                <span className="profile-item-sub">
                  {myEmergency?.emergencyContactPhone ? (
                    <a href={`tel:${myEmergency.emergencyContactPhone}`} className="contact-link">
                      {myEmergency.emergencyContactPhone}
                    </a>
                  ) : (
                    'No phone recorded'
                  )}
                </span>
              </div>

              {/* Physician */}
              <div className="profile-item">
                <span className="profile-item-header"><Stethoscope size={13} /> Family Physician</span>
                <span className="profile-item-val">
                  {myEmergency?.physicianName || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
                </span>
                <span className="profile-item-sub">
                  {myEmergency?.physicianPhone ? (
                    <a href={`tel:${myEmergency.physicianPhone}`} className="contact-link">
                      {myEmergency.physicianPhone}
                    </a>
                  ) : (
                    'No physician phone'
                  )}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={saveMyEmergency} className="directory-form" style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Please provide your blood group, designated next-of-kin contact, and optional family doctor.
              </p>
              {fields.map((f, i) => (
                <div className="form-field-group" key={f}>
                  <label>{labels[i]}</label>
                  {f === 'bloodGroup' ? (
                    <select
                      value={myDraft[f]}
                      onChange={(e) => setMyDraft({ ...myDraft, [f]: e.target.value })}
                    >
                      <option value="">Not provided</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      maxLength={
                        f.endsWith('Phone') ? 30 : f === 'emergencyContactRelationship' ? 50 : 150
                      }
                      placeholder={
                        f === 'emergencyContactName'
                          ? 'e.g. Nusrat Karim'
                          : f === 'emergencyContactRelationship'
                          ? 'e.g. Spouse / Sibling'
                          : f === 'emergencyContactPhone'
                          ? 'e.g. +8801711223344'
                          : f === 'physicianName'
                          ? 'e.g. Dr. M. Rahman'
                          : '+8801811223344'
                      }
                      value={myDraft[f]}
                      onChange={(e) => setMyDraft({ ...myDraft, [f]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <div className="form-btn-row">
                <button type="submit" className="save-privacy-btn" disabled={savingMyProfile}>
                  {savingMyProfile ? 'Saving...' : 'Save Emergency Details'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMyDraft(emptyProfile)}
                >
                  Clear Fields
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingMyProfile(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Building Security Assignments for Managers / Admins */}
      {manager && selectedBuildingId && <Assignments key={key} buildingId={selectedBuildingId} />}

      {/* Building Manager Assignment for Admins */}
      {user?.role === 'ADMIN' && selectedBuildingId && (
        <ManagerAssignment key={`manager-${key}`} buildingId={selectedBuildingId} onSaved={refreshBuildings} />
      )}

      {/* Directory Residents List */}
      <section className="directory-card" aria-label="Building residents list">
        <div className="directory-toolbar">
          <div className="toolbar-title-wrap">
            <h2>Residents</h2>
            {rows.length > 0 && (
              <span className="counter-badge">
                {filtered.length} of {rows.length} {rows.length === 1 ? 'person' : 'residents'}
              </span>
            )}
          </div>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              aria-label="Search residents by name or unit"
              placeholder="Search name or apartment…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="directory-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="directory-empty-state">
            <RefreshCw size={22} className="animate-spin" />
            <span>Loading residents…</span>
          </div>
        ) : !selectedBuildingId ? (
          <div className="directory-empty-state">
            <Building2 size={28} />
            <span>No building is assigned or selected. Please select a building from the header.</span>
          </div>
        ) : !rows.length ? (
          <div className="directory-empty-state">
            <User size={28} />
            <span>No active residents are registered in this building.</span>
          </div>
        ) : !filtered.length ? (
          <div className="directory-empty-state">
            <Search size={28} />
            <span>No residents match "{query}".</span>
          </div>
        ) : (
          <div className="directory-grid">
            {filtered.map((row) => (
              <article className="directory-person" key={row.residentId}>
                <div className="person-header">
                  <div className="person-avatar">{row.name ? row.name.charAt(0).toUpperCase() : 'U'}</div>
                  <div className="person-title-wrap">
                    <h3>{row.name}</h3>
                    <div className="directory-unit-tags">
                      {row.units.map((u) => (
                        <span className="unit-chip" key={u.apartmentId}>
                          <Building2 size={11} />
                          {u.unitNumber} · Floor {u.floorNumber}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="person-contacts">
                  <Contact label="Phone" value={row.phoneNumber} visibility={row.phoneVisibility} phone />
                  <Contact label="Email" value={row.email} visibility={row.emailVisibility} />
                </div>

                <button
                  type="button"
                  className="emergency-btn-trigger"
                  onClick={() => setSelected({ key, row })}
                >
                  <HeartPulse size={14} color="#E11D48" />
                  <span>Emergency contacts</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Emergency Contact Slide-Over Drawer (for viewing any resident's record) */}
      {current && (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
          <section className="drawer-panel" aria-label="Emergency contact details">
            <div className="drawer-header">
              <div className="drawer-title-wrap">
                <HeartPulse size={20} color="#E11D48" />
                <h2>Emergency contacts · {current.name}</h2>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setSelected(null)}
                title="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-content">
              {detailError && (
                <div className="directory-alert error" role="alert">
                  <AlertCircle size={18} />
                  <span>{detailError}</span>
                </div>
              )}

              {!profile ? (
                !detailError && (
                  <div className="directory-empty-state">
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Loading emergency details…</span>
                  </div>
                )
              ) : (
                <>
                  <div
                    className={`emergency-info-banner ${
                      profile.visibility === 'HIDDEN' ? 'hidden' : 'visible'
                    }`}
                  >
                    {profile.visibility === 'HIDDEN' ? (
                      <>
                        <EyeOff size={16} />
                        <span>
                          Hidden by this resident. Building management and assigned security staff retain full emergency
                          access.
                        </span>
                      </>
                    ) : profile.visibility === 'NOT_PROVIDED' ? (
                      <>
                        <AlertCircle size={16} />
                        <span>No emergency details have been recorded for this resident.</span>
                      </>
                    ) : (
                      <>
                        <HeartPulse size={16} />
                        <span>Authorized emergency contact record</span>
                      </>
                    )}
                  </div>

                  {profile.visibility !== 'HIDDEN' && (
                    <dl className="emergency-dl">
                      {fields.map((f, i) => (
                        <React.Fragment key={f}>
                          <dt>{labels[i]}</dt>
                          <dd>
                            {profile[f] ? (
                              f === 'bloodGroup' ? (
                                <span className="blood-group-badge">{profile[f]}</span>
                              ) : f.endsWith('Phone') ? (
                                <a className="contact-link" href={`tel:${profile[f]}`}>
                                  {profile[f]}
                                </a>
                              ) : (
                                profile[f]
                              )
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
                            )}
                          </dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  )}

                  {manager && !editing && (
                    <button
                      type="button"
                      className="edit-emergency-btn"
                      onClick={() => setEditing(true)}
                    >
                      Edit emergency record
                    </button>
                  )}

                  {manager && editing && (
                    <form onSubmit={saveEmergency} className="directory-form">
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Next-of-kin is the resident’s chosen emergency contact. A physician is optional. Enter both name
                        and phone for each contact.
                      </p>
                      {fields.map((f, i) => (
                        <div className="form-field-group" key={f}>
                          <label>{labels[i]}</label>
                          {f === 'bloodGroup' ? (
                            <select
                              value={draft[f]}
                              onChange={(e) => setDraft({ ...draft, [f]: e.target.value })}
                            >
                              <option value="">Not provided</option>
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              maxLength={
                                f.endsWith('Phone') ? 30 : f === 'emergencyContactRelationship' ? 50 : 150
                              }
                              value={draft[f]}
                              onChange={(e) => setDraft({ ...draft, [f]: e.target.value })}
                            />
                          )}
                        </div>
                      ))}
                      <div className="form-btn-row">
                        <button type="submit" className="save-privacy-btn" disabled={savingEmergency}>
                          {savingEmergency ? 'Saving...' : 'Save emergency record'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setDraft(emptyProfile)}
                        >
                          Clear fields
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setEditing(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Contact({ label, value, visibility, phone }) {
  const isHidden = visibility === 'HIDDEN';
  const Icon = phone ? Phone : Mail;

  return (
    <div className="contact-line">
      <div className="contact-line-left">
        <Icon size={14} color="var(--text-muted)" />
        {isHidden ? (
          <span className="contact-hidden">
            <EyeOff size={12} />
            <span>Hidden</span>
          </span>
        ) : value ? (
          phone ? (
            <a href={`tel:${value}`} className="contact-link" title={`Call ${value}`}>
              {value}
            </a>
          ) : (
            <a href={`mailto:${value}`} className="contact-link" title={`Email ${value}`}>
              {value}
            </a>
          )
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
        )}
      </div>
      <span className={`badge-status ${isHidden ? 'private' : value ? 'shared' : 'private'}`}>
        {isHidden ? 'Private' : value ? 'Shared' : 'None'}
      </span>
    </div>
  );
}

function Assignments({ buildingId }) {
  const [rows, setRows] = useState([]);
  const [guard, setGuard] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    api
      .getSecurityAssignments(buildingId, { signal: c.signal })
      .then(setRows)
      .catch((e) => {
        if (!c.signal.aborted) setError(message(e));
      });
    return () => c.abort();
  }, [buildingId]);

  async function action(id, remove = false) {
    setBusy(true);
    setError('');
    try {
      if (remove) await api.revokeBuildingSecurity(buildingId, id);
      else await api.assignBuildingSecurity(buildingId, id);
      setRows(await api.getSecurityAssignments(buildingId));
      setGuard('');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="directory-card">
      <div className="card-header-with-icon">
        <div className="header-icon-badge">
          <Shield size={20} />
        </div>
        <div>
          <h2>Building security</h2>
          <p>Assign an existing security staff account to this building to grant gate & emergency access.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          action(guard);
        }}
        style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}
      >
        <input
          type="number"
          min="1"
          required
          placeholder="Security Account ID"
          className="search-input"
          style={{ width: 'auto', minWidth: '220px' }}
          value={guard}
          onChange={(e) => setGuard(e.target.value)}
        />
        <button type="submit" className="save-privacy-btn" disabled={busy}>
          <Plus size={15} />
          <span>Assign security</span>
        </button>
      </form>

      {error && (
        <div className="directory-alert error" role="alert" style={{ marginTop: '12px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="assignments-list">
          {rows.map((r) => (
            <li className="assignment-item" key={r.securityUserId}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={15} color="var(--brand-primary)" />
                <strong>{r.securityName}</strong>
                <span className="unit-chip">ID #{r.securityUserId}</span>
              </div>
              <button
                type="button"
                className="btn-danger-outline"
                disabled={busy}
                onClick={() => action(r.securityUserId, true)}
              >
                Remove assignment
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ManagerAssignment({ buildingId, onSaved }) {
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <section className="directory-card">
      <div className="card-header-with-icon">
        <div className="header-icon-badge">
          <UserCheck size={20} />
        </div>
        <div>
          <h2>Building manager</h2>
          <p>Assign an administrative manager profile to oversee this building’s operations.</p>
        </div>
      </div>

      <form
        style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await api.assignBuildingManager(buildingId, id);
            await onSaved(buildingId);
            setId('');
          } catch (e) {
            setError(message(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          required
          min="1"
          type="number"
          placeholder="Manager Account ID"
          className="search-input"
          style={{ width: 'auto', minWidth: '220px' }}
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <button type="submit" className="save-privacy-btn" disabled={busy}>
          <UserCheck size={15} />
          <span>Assign manager</span>
        </button>
      </form>

      {error && (
        <div className="directory-alert error" role="alert" style={{ marginTop: '12px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
