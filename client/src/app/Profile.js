import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const S = {
  page: { background: '#f8f9fa', minHeight: '100vh', padding: '40px 20px', fontFamily: "'Inter', sans-serif" },
  inner: { maxWidth: 860, margin: '0 auto' },
  h1: { fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 700, color: '#2C2F38', margin: 0 },
  subtitle: { color: '#6b7280', fontSize: 15, marginTop: 6 },
  card: { background: '#ffffff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '28px 32px', marginBottom: 20 },
  sectionTitle: { fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 700, color: '#2C2F38', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' },
  label: { fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' },
  value: { fontSize: 15, color: '#2C2F38', fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, color: '#2C2F38', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' },
  editBtn: { padding: '8px 18px', borderRadius: 8, border: '1.5px solid #2F6DF6', background: 'transparent', color: '#2F6DF6', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#2F6DF6', color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginRight: 10 },
  tag: { display: 'inline-block', background: '#EEF4FF', color: '#2F6DF6', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 500, margin: '3px 4px 3px 0' },
  pill: { display: 'inline-block', background: '#f3f4f6', color: '#2C2F38', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 500, margin: '3px 4px 3px 0' },
  divider: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' },
  jobCard: { border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 12 },
  empty: { color: '#6b7280', fontSize: 14, fontStyle: 'italic' },
  successBanner: { background: 'rgba(16,185,129,0.08)', border: '1px solid #10B981', borderRadius: 10, padding: '12px 18px', marginBottom: 20, color: '#10B981', fontSize: 14, fontWeight: 600 },
  errorBanner: { background: '#FEF2F2', border: '1px solid #EF4444', borderRadius: 10, padding: '12px 18px', marginBottom: 20, color: '#EF4444', fontSize: 14, fontWeight: 600 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 14, cursor: 'pointer', marginBottom: 24, background: 'none', border: 'none', padding: 0, fontFamily: "'Inter', sans-serif" },
};

function Field({ label, value }) {
  return (
    <div>
      <span style={S.label}>{label}</span>
      <div style={S.value}>{value || <span style={S.empty}>Not provided</span>}</div>
    </div>
  );
}

function EditField({ label, name, value, onChange, type, placeholder }) {
  return (
    <div>
      <span style={S.label}>{label}</span>
      <input style={S.input} type={type || 'text'} name={name} value={value || ''} onChange={onChange} placeholder={placeholder || ''} />
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { fetchUser(); }, []);

  async function fetchUser() {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      if (data.success) setUserData(data.user);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function startEdit(section, draft) {
    setEditingSection(section); setEditDraft(draft);
    setSaveSuccess(false); setSaveError('');
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setEditDraft(prev => ({ ...prev, [name]: value }));
  }

  async function saveSection(section, payload) {
    setSaving(true); setSaveError('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ section, data: payload }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Save failed');
      await fetchUser();
      setEditingSection(null); setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { setSaveError(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: 16 }}>Loading profile...</div>
    </div>
  );

  const od = userData?.onboardingData || {};
  const s1 = od.s1 || {}; const s2 = od.s2 || {}; const s3 = od.s3 || {};
  const s5 = od.s5 || {}; const s6 = od.s6 || {}; const s7 = od.s7 || {}; const s8 = od.s8 || {};
  const planLabels = { basic: 'Starter', pro: 'Pro', premium: 'Concierge' };
  const statusColors = { active: '#10B981', past_due: '#F59E0B', canceled: '#EF4444', inactive: '#6b7280' };

  return (
    <div style={S.page}>
      <div style={S.inner}>
        <button style={S.backBtn} onClick={() => navigate('/app/dashboard')}>
          {'\u2190'} Back to Dashboard
        </button>
        <div style={{ marginBottom: 32 }}>
          <h1 style={S.h1}>My Profile</h1>
          <p style={S.subtitle}>Manage your account information and job search preferences</p>
        </div>
        {saveSuccess && <div style={S.successBanner}>Profile updated successfully</div>}
        {saveError && <div style={S.errorBanner}>{saveError}</div>}

        {/* Account & Subscription */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={S.sectionTitle}>Account &amp; Subscription</div>
            {editingSection !== 'account' && (
              <button style={S.editBtn} onClick={() => startEdit('account', { name: userData?.name || '', email: userData?.email || '' })}>Edit</button>
            )}
          </div>
          {editingSection === 'account' ? (
            <>
              <div style={S.grid2}>
                <EditField label="Full Name" name="name" value={editDraft.name} onChange={handleChange} />
                <EditField label="Email Address" name="email" value={editDraft.email} onChange={handleChange} type="email" />
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={S.cancelBtn} onClick={() => setEditingSection(null)}>Cancel</button>
                <button style={S.saveBtn} disabled={saving} onClick={() => saveSection('account', editDraft)}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </>
          ) : (
            <div style={S.grid2}>
              <Field label="Full Name" value={userData?.name} />
              <Field label="Email Address" value={userData?.email} />
              <div>
                <span style={S.label}>Plan</span>
                <div><span style={S.tag}>{planLabels[userData?.plan] || 'Pro'} Plan</span></div>
              </div>
              <div>
                <span style={S.label}>Status</span>
                <div><span style={{ ...S.tag, background: (statusColors[userData?.subscriptionStatus] || '#6b7280') + '18', color: statusColors[userData?.subscriptionStatus] || '#6b7280' }}>
                  {userData?.subscriptionStatus === 'active' ? 'Active' : userData?.subscriptionStatus || 'Unknown'}
                </span></div>
              </div>
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={S.sectionTitle}>Personal Information</div>
            {editingSection !== 'personal' && (
              <button style={S.editBtn} onClick={() => startEdit('personal', {
                firstName: s1.firstName || '', lastName: s1.lastName || '',
                phone: s1.phone || '', linkedin: s1.linkedin || '',
                address: s1.address || '', city: s1.city || '', state: s1.state || '', zip: s1.zip || '',
              })}>Edit</button>
            )}
          </div>
          {editingSection === 'personal' ? (
            <>
              <div style={S.grid2}>
                <EditField label="First Name" name="firstName" value={editDraft.firstName} onChange={handleChange} />
                <EditField label="Last Name" name="lastName" value={editDraft.lastName} onChange={handleChange} />
                <EditField label="Phone" name="phone" value={editDraft.phone} onChange={handleChange} placeholder="(555) 000-0000" />
                <EditField label="LinkedIn URL" name="linkedin" value={editDraft.linkedin} onChange={handleChange} placeholder="linkedin.com/in/yourname" />
                <EditField label="Street Address" name="address" value={editDraft.address} onChange={handleChange} />
                <EditField label="City" name="city" value={editDraft.city} onChange={handleChange} />
                <EditField label="State" name="state" value={editDraft.state} onChange={handleChange} />
                <EditField label="ZIP Code" name="zip" value={editDraft.zip} onChange={handleChange} />
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={S.cancelBtn} onClick={() => setEditingSection(null)}>Cancel</button>
                <button style={S.saveBtn} disabled={saving} onClick={() => saveSection('personal', editDraft)}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </>
          ) : (
            <div style={S.grid2}>
              <Field label="First Name" value={s1.firstName} />
              <Field label="Last Name" value={s1.lastName} />
              <Field label="Phone" value={s1.phone} />
              <Field label="LinkedIn" value={s1.linkedin} />
              <Field label="Street Address" value={s1.address} />
              <Field label="City" value={s1.city} />
              <Field label="State" value={s1.state} />
              <Field label="ZIP Code" value={s1.zip} />
            </div>
          )}
        </div>

        {/* Work Authorization */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Work Authorization</div>
          <div style={S.grid2}>
            <Field label="Authorized to Work in US" value={s2.workAuth} />
            <Field label="US Citizen" value={s2.usCitizen} />
            {s2.visaType && s2.visaType !== 'N/A' && <Field label="Visa / Status Type" value={s2.visaType} />}
            <Field label="Requires Sponsorship Now" value={s2.sponsorNow} />
            <Field label="Requires Future Sponsorship" value={s2.sponsorFuture} />
            <Field label="18 Years or Older" value={s2.over18} />
          </div>
        </div>

        {/* Job Preferences */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={S.sectionTitle}>Job Preferences</div>
            {editingSection !== 'preferences' && (
              <button style={S.editBtn} onClick={() => startEdit('preferences', {
                targetTitles: s8.targetTitles || '', salaryMin: s8.salaryMin || '',
                currentSalary: s8.currentSalary || '', salaryType: s8.salaryType || 'Annual',
                startDate: s8.startDate || '', relocPrefs: s8.relocPrefs || '',
              })}>Edit</button>
            )}
          </div>
          {editingSection === 'preferences' ? (
            <>
              <div style={S.grid2}>
                <EditField label="Target Job Titles" name="targetTitles" value={editDraft.targetTitles} onChange={handleChange} placeholder="e.g. Software Engineer" />
                <EditField label="Desired Salary Minimum" name="salaryMin" value={editDraft.salaryMin} onChange={handleChange} placeholder="$85,000" />
                <EditField label="Current Salary" name="currentSalary" value={editDraft.currentSalary} onChange={handleChange} placeholder="$75,000" />
                <div>
                  <span style={S.label}>Salary Type</span>
                  <select name="salaryType" value={editDraft.salaryType || 'Annual'} onChange={handleChange} style={{ ...S.input, background: '#ffffff' }}>
                    <option>Annual</option><option>Hourly</option>
                  </select>
                </div>
                <EditField label="Available Start Date" name="startDate" value={editDraft.startDate} onChange={handleChange} placeholder="e.g. Immediately" />
                <EditField label="Relocation Preferences" name="relocPrefs" value={editDraft.relocPrefs} onChange={handleChange} placeholder="e.g. Sun Belt states only" />
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={S.cancelBtn} onClick={() => setEditingSection(null)}>Cancel</button>
                <button style={S.saveBtn} disabled={saving} onClick={() => saveSection('preferences', editDraft)}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={S.grid2}>
                <Field label="Target Job Titles" value={s8.targetTitles} />
                <Field label="Desired Salary Minimum" value={s8.salaryMin} />
                <Field label="Current Salary" value={s8.currentSalary} />
                <Field label="Salary Type" value={s8.salaryType} />
                <Field label="Available Start Date" value={s8.startDate} />
                <Field label="Relocation Preferences" value={s8.relocPrefs} />
              </div>
              {((s8.seniority || []).length > 0 || (s8.empType || []).length > 0 || (s8.workArrangement || []).length > 0) && (
                <>
                  <hr style={S.divider} />
                  <div style={S.grid3}>
                    <div>
                      <span style={S.label}>Seniority Level</span>
                      <div>{(s8.seniority || []).map((v, i) => <span key={i} style={S.tag}>{v}</span>)}</div>
                    </div>
                    <div>
                      <span style={S.label}>Employment Type</span>
                      <div>{(s8.empType || []).map((v, i) => <span key={i} style={S.pill}>{v}</span>)}</div>
                    </div>
                    <div>
                      <span style={S.label}>Work Arrangement</span>
                      <div>{(s8.workArrangement || []).map((v, i) => <span key={i} style={S.pill}>{v}</span>)}</div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Employment History */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={S.sectionTitle}>Employment History</div>
            <button style={S.editBtn} onClick={() => navigate('/app/onboarding')}>Edit in Onboarding</button>
          </div>
          {(s3.entries || []).length === 0 ? (
            <p style={S.empty}>No employment history on file.</p>
          ) : (
            (s3.entries || []).map((job, i) => (
              <div key={i} style={S.jobCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#2C2F38' }}>{job.title || 'Unknown Title'}</div>
                    <div style={{ color: '#6b7280', fontSize: 14, marginTop: 2 }}>
                      {job.company}{job.city ? ' \u00b7 ' + job.city + (job.state ? ', ' + job.state : '') : ''}
                    </div>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'right', whiteSpace: 'nowrap', marginLeft: 16 }}>
                    {job.startDate}{job.currentlyHere ? ' \u2013 Present' : job.endDate ? ' \u2013 ' + job.endDate : ''}
                  </div>
                </div>
                {job.duties && (
                  <p style={{ marginTop: 10, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                    {job.duties.slice(0, 200)}{job.duties.length > 200 ? '...' : ''}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Education */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={S.sectionTitle}>Education</div>
            <button style={S.editBtn} onClick={() => navigate('/app/onboarding')}>Edit in Onboarding</button>
          </div>
          {(s5.schools || []).length === 0 ? (
            <p style={S.empty}>No education history on file.</p>
          ) : (
            (s5.schools || []).map((school, i) => (
              <div key={i} style={S.jobCard}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2C2F38' }}>{school.name || 'Unknown School'}</div>
                <div style={{ color: '#6b7280', fontSize: 14, marginTop: 2 }}>
                  {[school.degree, school.major].filter(Boolean).join(' in ')}
                  {school.gradYear ? ' \u00b7 Class of ' + school.gradYear : ''}
                </div>
                {school.gpa && <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>GPA: {school.gpa}</div>}
              </div>
            ))
          )}
        </div>

        {/* Skills & Certifications */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Skills &amp; Certifications</div>
          {(s6.skills || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span style={S.label}>Skills</span>
              <div>{(s6.skills || []).map((sk, i) => <span key={i} style={S.tag}>{sk.name || sk}</span>)}</div>
            </div>
          )}
          {(s6.certs || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span style={S.label}>Certifications</span>
              <div>{(s6.certs || []).map((c, i) => <span key={i} style={S.pill}>{c.name || c}</span>)}</div>
            </div>
          )}
          {(s6.languages || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span style={S.label}>Languages</span>
              <div>{(s6.languages || []).map((l, i) => <span key={i} style={S.pill}>{l.name || l}{l.level ? ' (' + l.level + ')' : ''}</span>)}</div>
            </div>
          )}
          {(s6.software || []).length > 0 && (
            <div>
              <span style={S.label}>Software &amp; Tools</span>
              <div>{(s6.software || []).map((sw, i) => <span key={i} style={S.pill}>{sw.name || sw}</span>)}</div>
            </div>
          )}
          {!(s6.skills || []).length && !(s6.certs || []).length && !(s6.languages || []).length && !(s6.software || []).length && (
            <p style={S.empty}>No skills or certifications on file.</p>
          )}
        </div>

        {/* References */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={S.sectionTitle}>References</div>
            <button style={S.editBtn} onClick={() => navigate('/app/onboarding')}>Edit in Onboarding</button>
          </div>
          {(s7.refs || []).filter(r => r.name).length === 0 ? (
            <p style={S.empty}>No references on file.</p>
          ) : (
            <div style={S.grid2}>
              {(s7.refs || []).filter(r => r.name).map((ref, i) => (
                <div key={i} style={S.jobCard}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#2C2F38' }}>{ref.name}</div>
                  {ref.title && <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{ref.title}{ref.company ? ' \u00b7 ' + ref.company : ''}</div>}
                  {ref.phone && <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{ref.phone}</div>}
                  {ref.email && <div style={{ color: '#6b7280', fontSize: 13 }}>{ref.email}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div style={{ ...S.card, border: '1px solid #fca5a5' }}>
          <div style={S.sectionTitle}>Account Actions</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button style={{ ...S.editBtn, borderColor: '#EF4444', color: '#EF4444' }} onClick={() => { logout(); navigate('/app/signin'); }}>
              Sign Out
            </button>
            <button style={S.editBtn} onClick={() => navigate('/app/billing')}>
              Manage Subscription
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
