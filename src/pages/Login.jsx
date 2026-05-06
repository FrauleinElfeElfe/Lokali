import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const [ageConfirmed, setAgeConfirmed] = useState(false)

  async function handle() {
    if (!email || !password) { setMsg('Please fill in all fields'); return }
    if (mode === 'signup' && !ageConfirmed) { setMsg('Please confirm you are 18 or older.'); return }
    setLoading(true); setMsg('')
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMsg('Confirmation email sent! Please check your inbox.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (e) {
      if (e.message?.includes('rate limit') || e.message?.includes('email rate')) {
        setMsg("You weren't selected as a test user this time – please try again later! 🌳")
      } else if (e.message?.includes('Invalid login')) {
        setMsg('Wrong email or password.')
      } else {
        setMsg(e.message || 'An error occurred. Please try again.')
      }
    }
    finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '48px 24px', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 52, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>lokali</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontStyle: 'italic', marginTop: 2, marginBottom: 12 }}>from online back to real life 🌳</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65 }}>
          Find your online besties nearby – spontaneous conversations without ranking pressure. Simply two people who happened to be in the same place at the same time and struck up a conversation.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {['login', 'signup'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: 10, borderRadius: 10, border: '0.5px solid',
            borderColor: mode === m ? 'var(--accent)' : 'var(--border)',
            background: mode === m ? 'var(--accent)' : 'var(--bg2)',
            color: mode === m ? '#fff' : 'var(--text2)',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}>
            {m === 'login' ? 'Sign in' : 'Register'}
          </button>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" placeholder="your@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()} />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input className="form-input" type="password" placeholder="min. 6 characters"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()} />
      </div>
      {mode === 'signup' && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:16, padding:'12px 14px', background:'var(--bg2)', borderRadius:10, border:'0.5px solid var(--border)' }}>
          <input type="checkbox" id="age-check" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)}
            style={{ marginTop:2, flexShrink:0, accentColor:'var(--accent)', width:16, height:16 }} />
          <label htmlFor="age-check" style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5, cursor:'pointer' }}>
            I confirm that I am <strong>18 years of age or older</strong> and agree to the <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => window.location.href='/legal'}>Community Guidelines & Privacy Policy</span>.
          </label>
        </div>
      )}
      {msg && <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8, lineHeight: 1.5 }}>{msg}</p>}
      <button className="btn-primary" onClick={handle} disabled={loading}>
        {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </div>
  )
}
