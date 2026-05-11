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
  const [showPrivacy, setShowPrivacy] = useState(false)

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
    <div style={{ padding: '40px 24px', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 52, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>lokali</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontStyle: 'italic', marginTop: 2, marginBottom: 16 }}>from online back to real life 🌳</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
          <strong>Find your online besties nearby 💬✨</strong>
          <br /><br />
          Spontaneous conversations — no swiping, no rankings. Simply two people who happened to be in the same place, starting a conversation.
          <br /><br />
          <strong>What makes lokali different?</strong>
          <br /><br />
          <strong>1. The problem with most apps:</strong><br />
          Intention (friendship/relationship) → Decision about the person (yes/no, swiping) → Getting to know each other
          <br /><br />
          But it should be the other way around:<br />
          Getting to know each other → Deciding whether you like them → Building a friendship or relationship
          <br /><br />
          Many people today struggle with real-life interaction. lokali helps you build connections with people nearby — close enough that taking things offline is actually possible.
          <br /><br />
          <strong>2. Reducing toxicity.</strong><br />
          lokali is only partially anonymous – yet anonymous enough that the focus stays on interactions, rather than self-promotion and competition. 🌳
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
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
            I confirm that I am <strong>18 years of age or older</strong> and agree to the{' '}
            <span style={{ color:'var(--accent)', cursor:'pointer', textDecoration:'underline' }}
              onClick={() => setShowPrivacy(true)}>
              Community Guidelines & Privacy Policy
            </span>.
          </label>
        </div>
      )}

      {msg && <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8, lineHeight: 1.5 }}>{msg}</p>}
      <button className="btn-primary" onClick={handle} disabled={loading}>
        {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>

      <div style={{ marginTop:24, padding:'16px 0', borderTop:'0.5px solid var(--border)', fontSize:12, color:'var(--text3)', textAlign:'center', lineHeight:1.8 }}>
        <strong style={{ color:'var(--text2)' }}>Impressum</strong><br />
        Sarah Wriedt · Mühlenweg 112, 24116 Kiel, Deutschland<br />
        <a href="mailto:wriedtsarah@googlemail.com" style={{ color:'var(--accent)' }}>wriedtsarah@googlemail.com</a><br />
        lokali is a private non-commercial hobby project.<br /><br />
        <span onClick={() => setShowPrivacy(true)} style={{ color:'var(--accent)', cursor:'pointer', textDecoration:'underline' }}>
          Privacy Policy & Community Guidelines
        </span>
      </div>
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'var(--bg)', borderRadius:'16px 16px 0 0', padding:24, maxHeight:'80dvh', overflowY:'auto', width:'100%', maxWidth:440 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:700 }}>Privacy & Guidelines</div>
              <button onClick={() => setShowPrivacy(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--text3)' }}>×</button>
            </div>
            <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>
              <strong>lokali is for users 18+.</strong>
              <br /><br />
              <strong>Community Guidelines:</strong>
              <ul style={{ paddingLeft:18, marginTop:6 }}>
                <li>Treat everyone with respect</li>
                <li>No hate speech, harassment, or discrimination</li>
                <li>No NSFW or explicit content</li>
                <li>No spam or scamming</li>
                <li>Violations may result in permanent ban</li>
              </ul>
              <br />
              <strong>Data we collect:</strong> Email address, location (GPS, only when permitted), username, and content you post. We do not sell your data. Full privacy policy available in the app under Profile → Privacy Policy.
              <br /><br />
              Data is stored securely with Supabase (EU region). You can delete your account at any time.
            </div>
            <button onClick={() => setShowPrivacy(false)} className="btn-primary" style={{ marginTop:16 }}>
              Got it ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
