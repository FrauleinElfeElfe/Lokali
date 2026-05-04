import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { upsertProfile } from '../lib/supabase'

const AVATARS = ['🐨','🦊','🐺','🦁','🐸','🦋','🦔','🐧','🦦','🐙','🦜','🐬','🦌','🐼','🦘','🦈','🐻','🦒','🐘','🦏','🐆','🦓','🦅','🦚','🦩','🐊','🐇','🦝','🦫','🐿️','🦉','🦛','🐃','🦬']
const AGE_GROUPS = ['Prefer not to say','under 18','18–21','22–25','26–29','30–39','40+']
const IDENTITY_OPTIONS = ['LGBTQ+','ADHD','Autism','AuDHD']

export default function Onboarding() {
  const { user, setProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('🐨')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [identities, setIdentities] = useState([])
  const [visibility, setVisibility] = useState({ age: true, gender: true, identities: true })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  function toggleIdentity(id) {
    setIdentities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handle() {
    const u = username.trim()
    if (u.length < 2) { setMsg('Username min. 2 characters'); return }
    setLoading(true); setMsg('')
    try {
      const p = await upsertProfile(user.id, {
        username: u, avatar,
        age: age || null, gender: gender || null,
        identities: identities.length ? identities : null,
        visibility,
      })
      setProfile(p)
    } catch (e) {
      setMsg(e.message?.includes('unique') ? 'This username is already taken.' : (e.message || 'Error'))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '32px 20px 80px' }}>
      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 32, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>lokali</div>
      <div style={{ fontSize: 11, color: 'var(--accent)', fontStyle: 'italic', marginBottom: 10 }}>from online back to real life 🌳</div>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.65 }}>
        Set up your profile to get started.
      </p>

      <div className="form-group">
        <label className="form-label">Username</label>
        <input className="form-input" placeholder="e.g. lena_kiel" maxLength={20}
          value={username} onChange={e => setUsername(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Age (optional)</label>
        <div className="age-grid">
          {AGE_GROUPS.map(a => (
            <div key={a} className={`age-chip ${age === a ? 'selected' : ''}`}
              onClick={() => setAge(age === a ? '' : a)}>{a}</div>
          ))}
        </div>
        {age && age !== 'Prefer not to say' && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="age-vis" checked={visibility.age} onChange={e => setVisibility(v => ({...v, age: e.target.checked}))} />
            <label htmlFor="age-vis" style={{ fontSize: 12, color: 'var(--text3)' }}>Show age on profile</label>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Gender (optional)</label>
        <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
          <option value="">Prefer not to say</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Other">Other</option>
        </select>
        {gender && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="gender-vis" checked={visibility.gender} onChange={e => setVisibility(v => ({...v, gender: e.target.checked}))} />
            <label htmlFor="gender-vis" style={{ fontSize: 12, color: 'var(--text3)' }}>Show gender on profile</label>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Community (optional)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {IDENTITY_OPTIONS.map(id => (
            <div key={id} onClick={() => toggleIdentity(id)}
              style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid', borderColor: identities.includes(id) ? 'var(--accent)' : 'var(--border)', background: identities.includes(id) ? 'var(--accent-light)' : 'var(--bg2)', color: identities.includes(id) ? 'var(--accent)' : 'var(--text2)' }}>
              {id}
            </div>
          ))}
        </div>
        {identities.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="id-vis" checked={visibility.identities} onChange={e => setVisibility(v => ({...v, identities: e.target.checked}))} />
            <label htmlFor="id-vis" style={{ fontSize: 12, color: 'var(--text3)' }}>Show on profile</label>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Your animal avatar</label>
        <div className="avatar-picker">
          {AVATARS.map(a => (
            <div key={a} className={`avatar-option ${avatar === a ? 'selected' : ''}`}
              onClick={() => setAvatar(a)}>{a}</div>
          ))}
        </div>
      </div>

      {msg && <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>{msg}</p>}
      <button className="btn-primary" onClick={handle} disabled={loading}>
        {loading ? '...' : 'Create profile & get started'}
      </button>
    </div>
  )
}
