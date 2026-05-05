import { useNavigate } from 'react-router-dom'

export default function Legal() {
  const navigate = useNavigate()
  const email = 'wriedtsarah@googlemail.com'
  const name = 'Sarah Wriedt' // <- deinen echten Namen eintragen!
  const address = 'Mühlenweg 112, 24116 Kiel, Deutschland' // <- deine Adresse eintragen!

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'0.5px solid var(--border)', position:'sticky', top:0, background:'var(--bg)', zIndex:10 }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text2)' }}>←</button>
        <div style={{ fontWeight:600, fontSize:15 }}>Legal & Privacy</div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* IMPRESSUM */}
        <div style={{ marginTop: 28, marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Impressum</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text2)' }}>
            <strong>{name}</strong><br />
            {address}<br />
            E-Mail: <a href={`mailto:${email}`} style={{ color: 'var(--accent)' }}>{email}</a>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 10, lineHeight: 1.6 }}>
            lokali is a private non-commercial project. It is operated as a hobby project with no commercial intent at this time.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', marginBottom: 28 }} />

        {/* DATENSCHUTZ */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>Privacy Policy</h2>

          <Section title="1. Who we are">
            lokali is a private project operated by {name}, {address}. Contact: <a href={`mailto:${email}`} style={{ color: 'var(--accent)' }}>{email}</a>
          </Section>

          <Section title="2. What data we collect">
            When you use lokali, we collect and store the following data:
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
              <li><strong>Email address</strong> – for account creation and login</li>
              <li><strong>Location (GPS coordinates)</strong> – only when you grant permission, used to show nearby posts. We store the coordinates of each post you make.</li>
              <li><strong>Username, age range, gender, community badges</strong> – optional profile information you choose to provide</li>
              <li><strong>Posts, comments, private messages</strong> – content you create on the platform</li>
              <li><strong>IP address</strong> – automatically logged by our infrastructure provider (Supabase/Vercel) for security purposes</li>
            </ul>
            We do <strong>not</strong> collect phone numbers, payment data, or any tracking/advertising data.
          </Section>

          <Section title="3. Why we collect this data">
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Email: to authenticate your account (legal basis: contract performance, Art. 6(1)(b) GDPR)</li>
              <li>Location: to show you nearby posts and calculate distances (legal basis: your explicit consent, Art. 6(1)(a) GDPR)</li>
              <li>Profile data: to personalize your profile (legal basis: consent)</li>
              <li>Posts/messages: core functionality of the service (legal basis: contract)</li>
            </ul>
          </Section>

          <Section title="4. Where data is stored">
            Your data is stored with <strong>Supabase</strong> (database) and <strong>Vercel</strong> (hosting). Both are reputable providers with strong security standards (ISO 27001, SOC 2). Data may be processed on servers in the <strong>United States</strong>. Supabase and Vercel both participate in EU-US data transfer frameworks. By using lokali, you consent to this transfer.
          </Section>

          <Section title="5. How long we keep data">
            We keep your data for as long as your account is active. If you delete your account, your data will be deleted within 30 days, except where we are required by law to retain it.
          </Section>

          <Section title="6. Your rights (GDPR)">
            Under the GDPR, you have the right to:
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Access the data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data ("right to be forgotten")</li>
              <li>Withdraw consent at any time</li>
              <li>Data portability</li>
              <li>Lodge a complaint with a supervisory authority (e.g. ULD Schleswig-Holstein)</li>
            </ul>
            To exercise your rights, contact us at: <a href={`mailto:${email}`} style={{ color: 'var(--accent)' }}>{email}</a>
          </Section>

          <Section title="7. Cookies & Tracking">
            lokali does not use advertising cookies or third-party tracking. We use only technical session cookies necessary for login functionality.
          </Section>

          <Section title="8. Community Guidelines">
            By using lokali you agree to:
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Treat all users with respect – no hate speech, harassment, or discrimination</li>
              <li>No NSFW, explicit, or adult content of any kind</li>
              <li>No spam, scamming, or commercial advertising</li>
              <li>No content that is illegal under German or EU law</li>
              <li>lokali is intended for users aged <strong>18 and over</strong></li>
            </ul>
            Violations may result in account suspension or permanent ban.
          </Section>

          <Section title="9. Changes to this policy">
            We may update this privacy policy from time to time. Changes will be posted here. Continued use of lokali after changes constitutes acceptance of the new policy.
          </Section>

          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 24 }}>
            Last updated: May 2026
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{title}</h3>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text2)' }}>{children}</div>
    </div>
  )
}
