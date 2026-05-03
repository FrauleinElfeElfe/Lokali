import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handle() {
    if (!email || !password) { setMsg('Bitte alle Felder ausfüllen'); return }
    setLoading(true); setMsg('')
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMsg('Bestätigungs-E-Mail gesendet! Bitte checke dein Postfach.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (e) {
      if (e.message?.includes('rate limit') || e.message?.includes('email rate')) {
        setMsg('Leider ist die Testversion von lokali noch relativ schnell überlastet. Bitte probiere es in einer halben Stunde erneut. Vielen Dank für dein Verständnis! 🌳')
      } else {
        setMsg(e.message || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
      }
    }
    finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '48px 24px', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Caveat,cursive', fontSize: 52, fontWeight: 700, color: 'var(--accent)', marginBottom: 0, lineHeight: 1 }}>lokali</div>
      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 36 }}>
        Find your online besties nearby – spontaneous conversations without ranking pressure. Simply two people who happened to be in the same place at the same time and struck up a conversation.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {['login','signup'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: 10, borderRadius: 10, border: '0.5px solid',
            borderColor: mode === m ? 'var(--accent)' : 'var(--border)',
            background: mode === m ? 'var(--accent)' : 'var(--bg2)',
            color: mode === m ? '#fff' : 'var(--text2)',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}>
            {m === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        ))}
      </div>
      <div className="form-group">
        <label className="form-label">E-Mail</label>
        <input className="form-input" type="email" placeholder="deine@email.de"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()} />
      </div>
      <div className="form-group">
        <label className="form-label">Passwort</label>
        <input className="form-input" type="password" placeholder="min. 6 Zeichen"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()} />
      </div>
      {msg && <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>{msg}</p>}
      <button className="btn-primary" onClick={handle} disabled={loading}>
        {loading ? '...' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
      </button>
    </div>
  )
}
