import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { upsertProfile } from '../lib/supabase'

const AVATARS = ['🐨','🦊','🐺','🦁','🐸','🦋','🦔','🐧','🦦','🐙','🦜','🐬','🦌','🐼','🦘','🦈']
const AGE_GROUPS = ['Lieber nicht','unter 18','18–21','22–25','26–29','30–39','40+']

export default function Onboarding() {
  const { user, setProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('🐨')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handle() {
    const u = username.trim()
    if (u.length < 2) { setMsg('Benutzername min. 2 Zeichen'); return }
    setLoading(true); setMsg('')
    try {
      const p = await upsertProfile(user.id, { username: u, avatar, age: age || null, gender: gender || null })
      setProfile(p)
    } catch (e) {
      setMsg(e.message?.includes('unique') ? 'Dieser Benutzername ist bereits vergeben' : (e.message || 'Fehler'))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '32px 20px 80px' }}>
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Willkommen bei lokali</div>
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 32, lineHeight: 1.65 }}>
        Die Online-Besties ganz in der Nähe finden – spontane Unterhaltungen, ohne Rankingdruck. Einfach zwei Menschen, die zufällig gleichzeitig am gleichen Ort waren und ins Gespräch gekommen sind.
      </p>
      <div className="form-group">
        <label className="form-label">Dein Benutzername</label>
        <input className="form-input" placeholder="z.B. lena_kiel" maxLength={20}
          value={username} onChange={e => setUsername(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Alter (optional)</label>
        <div className="age-grid">
          {AGE_GROUPS.map(a => (
            <div key={a} className={`age-chip ${age === a ? 'selected' : ''}`}
              onClick={() => setAge(age === a ? '' : a)}>{a}</div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Geschlecht (optional)</label>
        <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
          <option value="">Lieber nicht angeben</option>
          <option value="w">Weiblich</option>
          <option value="m">Männlich</option>
          <option value="d">Divers</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Dein Tier-Avatar</label>
        <div className="avatar-picker">
          {AVATARS.map(a => (
            <div key={a} className={`avatar-option ${avatar === a ? 'selected' : ''}`}
              onClick={() => setAvatar(a)}>{a}</div>
          ))}
        </div>
      </div>
      {msg && <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>{msg}</p>}
      <button className="btn-primary" onClick={handle} disabled={loading}>
        {loading ? '...' : 'Profil erstellen & loslegen'}
      </button>
    </div>
  )
}
