import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

const PRIVACY_CONTENT = `
lokali is for users 18 and over.

COMMUNITY GUIDELINES
By using lokali you agree to:
• Treat all users with respect – no hate speech, harassment, or discrimination
• No NSFW, explicit, or adult content of any kind
• No spam, scamming, or commercial advertising
• No content that is illegal under German or EU law
• lokali is intended for users aged 18 and over
Violations may result in account suspension or permanent ban.

PRIVACY POLICY

1. Who we are
lokali is a private project operated by Sarah Wriedt, Mühlenweg 112, 24116 Kiel, Deutschland.
Contact: wriedtsarah@googlemail.com

2. What data we collect
• Email address – for account creation and login
• Location (GPS coordinates) – only when you grant permission
• Username, age range, gender, community badges – optional profile info
• Posts, comments, private messages – content you create
• IP address – automatically logged by Supabase/Vercel for security
We do NOT collect phone numbers, payment data, or advertising data.

3. Why we collect this data
• Email: to authenticate your account (Art. 6(1)(b) GDPR)
• Location: to show nearby posts (Art. 6(1)(a) GDPR – your consent)
• Profile data: to personalise your profile (consent)
• Posts/messages: core functionality (contract)

4. Where data is stored
Data is stored with Supabase (database) and Vercel (hosting), both with strong security standards (ISO 27001, SOC 2). Data may be processed on servers in the United States. By using lokali, you consent to this transfer.

5. How long we keep data
Your data is kept for as long as your account is active. If you delete your account, all your data (posts, comments, messages, profile) will be permanently deleted immediately. Your email address (held by Supabase Auth) will be removed within 30 days.

6. Your rights (GDPR)
You have the right to: access your data, correct inaccurate data, delete your data, withdraw consent, data portability, and lodge a complaint with ULD Schleswig-Holstein.
Contact: wriedtsarah@googlemail.com

7. Cookies & Tracking
lokali does not use advertising cookies or third-party tracking. Only technical session cookies necessary for login are used.

8. Changes to this policy
Changes will be posted here. Continued use constitutes acceptance.

Last updated: May 2026

IMPRESSUM
Sarah Wriedt
Mühlenweg 112, 24116 Kiel, Deutschland
E-Mail: wriedtsarah@googlemail.com
lokali is a private non-commercial hobby project with no commercial intent at this time.
`

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
          No swiping, no rankings. Simply people who happened to be there at the same time.
          <br /><br />
          <strong>What makes lokali different?</strong>
          <br /><br />
	</p>
	<p style={{ fontFamily: 'Caveat, cursive', fontSize: 24, color: 'var(--accent)', lineHeight: 1.7 }}>
          <strong> The problem with most apps:</strong><br />
	</p>
	<p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
          <strong> 1. Intention (friendship/relationship) → Decisions over people (swiping) → Getting to know each other </strong>
          <br /><br />
          But it should be the other way around:<br />
          Getting to know each other → Decisions → Intention for friendship or relationship
          <br /><br />
          Many people today struggle with real-life interaction. lokali helps you build online connections with people nearby, so taking things offline is actually possible.
          <br /><br />
          <strong>2. Toxicity.</strong><br />
          To reduce toxicity lokali is only partially anonymous, yet anonymous enough that the focus stays on interactions, rather than self-promotion and competition. 🌳
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
              onClick={e => { e.preventDefault(); setShowPrivacy(true) }}>
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

      {showPrivacy && (
        <div
          onClick={() => setShowPrivacy(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:'var(--bg)', borderRadius:'16px 16px 0 0', padding:24, maxHeight:'85dvh', overflowY:'auto', width:'100%', maxWidth:440 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:700 }}>Privacy Policy & Guidelines</div>
              <button
                onClick={() => setShowPrivacy(false)}
                style={{ background:'none', border:'none', fontSize:28, cursor:'pointer', color:'var(--text3)', lineHeight:1, padding:'0 4px' }}>
                ×
              </button>
            </div>
            <pre style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'inherit' }}>
              {PRIVACY_CONTENT}
            </pre>
            <button
              onClick={() => setShowPrivacy(false)}
              className="btn-primary"
              style={{ marginTop:16, position:'sticky', bottom:0 }}>
              Got it ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
