import React, { useContext, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import * as api from '../../services/api';
import './ResidentDirectory.css';

const fields = ['bloodGroup', 'emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone', 'physicianName', 'physicianPhone'];
const labels = ['Blood group', 'Next-of-kin name', 'Relationship', 'Next-of-kin phone', 'Physician name', 'Physician phone'];
const emptyProfile = Object.fromEntries(fields.map(f => [f, '']));
const message = e => e.message || 'Unable to complete this request.';

export default function ResidentDirectory() {
  const { user } = useContext(AuthContext);
  const { selectedBuildingId, refreshBuildings } = useOutletContext();
  const [result, setResult] = useState(null), [query, setQuery] = useState('');
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState(null), [prefsError, setPrefsError] = useState('');
  const [selected, setSelected] = useState(null), [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(''), [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyProfile), [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const key = `${user?.id}:${selectedBuildingId}`;
  const rows = result?.key === key ? result.rows : [];
  const manager = ['MANAGER', 'ADMIN'].includes(user?.role);
  useEffect(() => {
    const c = new AbortController();
    setPrefs(null); setPrefsError('');
    if (user?.role === 'RESIDENT') api.getDirectoryPreferences({signal:c.signal}).then(setPrefs).catch(e => {if (!c.signal.aborted) setPrefsError(message(e));});
    return () => c.abort();
  }, [user?.id, user?.role]);
  useEffect(() => {
    const c = new AbortController();
    setResult(null); setSelected(null); setDetail(null); setEditing(false); setError('');
    if (selectedBuildingId && user?.role !== 'STAFF') {
      setLoading(true);
      api.getResidentDirectory(selectedBuildingId, {signal:c.signal}).then(data => {if(!c.signal.aborted) setResult({key, rows:data});})
        .catch(e => {if(!c.signal.aborted) setError(message(e));}).finally(() => {if(!c.signal.aborted) setLoading(false);});
    } else setLoading(false);
    return () => c.abort();
  }, [key, revision]);
  useEffect(() => {
    const c = new AbortController(); setDetail(null); setDetailError(''); setEditing(false);
    if (selected?.key === key) api.getResidentEmergency(selectedBuildingId, selected.row.residentId, {signal:c.signal})
      .then(profile => {if(!c.signal.aborted) {setDetail({key, residentId:selected.row.residentId, profile}); setDraft(Object.fromEntries(fields.map(f => [f, profile[f] || ''])));}})
      .catch(e => {if(!c.signal.aborted) setDetailError(message(e));});
    return () => c.abort();
  }, [selected, key]);
  useEffect(() => {const focus = () => setRevision(n => n+1); window.addEventListener('focus',focus);return () => window.removeEventListener('focus',focus);}, []);
  if (user?.role === 'STAFF') return <div className="directory"><h1>Resident Directory</h1><p>Directory access is available to residents, building management, and assigned security.</p></div>;
  const current = selected?.key === key ? selected.row : null;
  const profile = detail?.key === key && detail.residentId === current?.residentId ? detail.profile : null;
  const filtered = rows.filter(r => `${r.name} ${r.units.map(u => u.unitNumber).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  async function savePreferences(e) {
    e.preventDefault(); setSaving(true); setPrefsError('');
    try {setPrefs(await api.updateDirectoryPreferences(prefs));setRevision(n=>n+1);} catch(e){setPrefsError(message(e));} finally{setSaving(false);}
  }
  async function saveEmergency(e) {
    e.preventDefault();setSaving(true);setDetailError('');
    try {const p=await api.updateResidentEmergency(selectedBuildingId,current.residentId,draft);setDetail({key,residentId:current.residentId,profile:p});setEditing(false);}catch(e){setDetailError(message(e));}finally{setSaving(false);}
  }
  return <div className="directory">
    <header><div><span className="directory-eyebrow">COMMUNITY · FEATURE 04</span><h1>Resident Directory</h1><p>Find your neighbors and the right person to contact in an emergency.</p></div></header>
    {user?.role === 'RESIDENT' && <section className="directory-card"><h2>Your contact privacy</h2><p>These settings control what other residents can see. Building managers and assigned security staff can still access your details.</p>
      {prefs ? <form onSubmit={savePreferences}><div className="directory-switches">{[['sharePhone','Share my phone number'],['shareEmail','Share my email'],['shareEmergencyContacts','Share my emergency details']].map(([f,label])=><label key={f}><input type="checkbox" checked={prefs[f]} onChange={e=>setPrefs({...prefs,[f]:e.target.checked})}/>{label}</label>)}</div><button disabled={saving}>Save privacy settings</button></form> : <p>Loading preferences…</p>}{prefsError && <p role="alert">{prefsError}</p>}</section>}
    {manager && selectedBuildingId && <Assignments key={key} buildingId={selectedBuildingId}/>}
    {user?.role === 'ADMIN' && selectedBuildingId && <ManagerAssignment key={`manager-${key}`} buildingId={selectedBuildingId} onSaved={refreshBuildings}/>}
    <section className="directory-card"><div className="directory-toolbar"><h2>Residents</h2><input aria-label="Search residents by name or unit" placeholder="Search name or apartment…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
      {error && <p role="alert">{error}</p>}{loading ? <p>Loading residents…</p> : !selectedBuildingId ? <p>No building is assigned to your account yet.</p> : !rows.length ? <p>No active residents are registered in this building.</p> : !filtered.length ? <p>No residents match your search.</p> : <div className="directory-grid">{filtered.map(row=><article className="directory-person" key={row.residentId}><h3>{row.name}</h3><p className="directory-unit">{row.units.map(u=>`${u.unitNumber} · Floor ${u.floorNumber}`).join(' / ')}</p><Contact label="Phone" value={row.phoneNumber} visibility={row.phoneVisibility} phone/><Contact label="Email" value={row.email} visibility={row.emailVisibility}/><button type="button" onClick={()=>setSelected({key,row})}>Emergency contacts</button></article>)}</div>}
    </section>
    {current && <section className="directory-card" aria-label="Emergency contact details"><div className="directory-toolbar"><h2>Emergency contacts · {current.name}</h2><button type="button" onClick={()=>setSelected(null)}>Close</button></div>{detailError && <p role="alert">{detailError}</p>}
      {!profile ? !detailError && <p>Loading emergency details…</p> : <><p>{profile.visibility==='HIDDEN' ? 'Hidden by this resident.' : profile.visibility==='NOT_PROVIDED' ? 'No emergency details have been provided.' : 'Emergency contact record'}</p>{profile.visibility!=='HIDDEN' && <dl>{fields.map((f,i)=><React.Fragment key={f}><dt>{labels[i]}</dt><dd>{profile[f] ? f.endsWith('Phone') ? <a href={`tel:${profile[f]}`}>{profile[f]}</a> : profile[f] : 'Not provided'}</dd></React.Fragment>)}</dl>}{manager && !editing && <button type="button" onClick={()=>setEditing(true)}>Edit emergency record</button>}
        {manager && editing && <form onSubmit={saveEmergency} className="directory-form"><p>Next-of-kin is the resident’s chosen emergency contact. A physician is optional. Enter both name and phone for each contact.</p>{fields.map((f,i)=><label key={f}>{labels[i]}{f==='bloodGroup' ? <select value={draft[f]} onChange={e=>setDraft({...draft,[f]:e.target.value})}><option value="">Not provided</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}</select> : <input maxLength={f.endsWith('Phone')?30:f==='emergencyContactRelationship'?50:150} value={draft[f]} onChange={e=>setDraft({...draft,[f]:e.target.value})}/>}</label>)}<button disabled={saving}>Save emergency record</button><button type="button" onClick={()=>setDraft(emptyProfile)}>Clear fields</button></form>}</>}
    </section>}
  </div>;
}
function Contact({label,value,visibility,phone}) {return <p><strong>{label}: </strong>{visibility==='HIDDEN'?'Hidden':value?phone?<a href={`tel:${value}`}>{value}</a>:<a href={`mailto:${value}`}>{value}</a>:'Not provided'}</p>;}
function Assignments({buildingId}) {
  const [rows,setRows]=useState([]),[guard,setGuard]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{const c=new AbortController();api.getSecurityAssignments(buildingId,{signal:c.signal}).then(setRows).catch(e=>{if(!c.signal.aborted)setError(message(e));});return()=>c.abort();},[buildingId]);
  async function action(id,remove=false){setBusy(true);setError('');try{if(remove)await api.revokeBuildingSecurity(buildingId,id);else await api.assignBuildingSecurity(buildingId,id);setRows(await api.getSecurityAssignments(buildingId));setGuard('');}catch(e){setError(message(e));}finally{setBusy(false);}}
  return <section className="directory-card"><h2>Building security</h2><p>Assign an existing security account to this building.</p><form onSubmit={e=>{e.preventDefault();action(guard);}} className="directory-toolbar"><label>Security account ID <input type="number" min="1" required value={guard} onChange={e=>setGuard(e.target.value)}/></label><button disabled={busy}>Assign security</button></form>{error&&<p role="alert">{error}</p>}<ul>{rows.map(r=><li key={r.securityUserId}>{r.securityName} · #{r.securityUserId} <button disabled={busy} onClick={()=>action(r.securityUserId,true)}>Remove assignment</button></li>)}</ul></section>;
}
function ManagerAssignment({buildingId,onSaved}) {
 const [id,setId]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <section className="directory-card"><h2>Building manager</h2><form className="directory-toolbar" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await api.assignBuildingManager(buildingId,id);await onSaved(buildingId);setId('');}catch(e){setError(message(e));}finally{setBusy(false);}}}><label>Manager account ID <input required min="1" type="number" value={id} onChange={e=>setId(e.target.value)}/></label><button disabled={busy}>Assign manager</button></form>{error&&<p role="alert">{error}</p>}</section>;
}
