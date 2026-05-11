import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase, upsertProfile } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const AVATARS = ['🐨','🦊','🐺','🦁','🐸','🦋','🦔','🐧','🦦','🐙','🦜','🐬','🦌','🐼','🦘','🦈','🐻','🦒','🐘','🦏','🐆','🦓','🦅','🦚','🦩','🐊','🐇','🦝','🦫','🐿️','🦉','🦛','🐃','🦬']
const IDENTITY_OPTIONS = [
  { group: 'Orientation & Gender', items: ['LGBTQ+'] },
  { group: 'Neurodivergent', items: ['ADHD', 'Autism', 'AuDHD', 'Dyslexia', 'Dyscalculia'] },
  { group: 'Mental Health', items: ['Depression', 'Anxiety', 'BPD', 'PTSD / cPTSD', 'Bipolar'] },
  { group: 'Physical', items: ['Chronic illness', 'Physical disability', 'Hearing impaired', 'Visually impaired'] },
]

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000
  if (d < 3600) return `${Math.floor(d/60)} min ago`
  if (d < 86400) return `${Math.floor(d/3600)} h ago`
  return `${Math.floor(d/86400)} days ago`
}

export default function Profile() {
  const { user, profile, setProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [identities, setIdentities] = useState([])
  const [visibility, setVisibility] = useState({ age: true, gender: true, identities: true })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [toast, setToast] = useState('')

  const AGE_GROUPS = ['Prefer not to say','18–21','22–25','26–29','30–39','40+']

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!user) return
    supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setPosts(data || []))
    if (profile) {
      setAge(profile.age || '')
      setGender(profile.gender || '')
      setIdentities(profile.identities || [])
      setVisibility(profile.visibility || { age: true, gender: true, identities: true })
    }
  }, [user, profile])

  async function changeAvatar(avatar) {
    setSaving(true)
    try {
      const p = await upsertProfile(user.id, { ...profile, avatar })
      setProfile(p); setEditingAvatar(false); showToast('Avatar updated! 🐾')
    } catch (e) { showToast(e.message) }
    finally { setSaving(false) }
  }

  async function deleteAccount() {
    if (deleteInput !== profile?.username) { setMsg('Username does not match'); return }
    setDeleting(true)
    try {
      // Call server-side function that deletes both profile and auth user
      const { error } = await supabase.rpc('delete_user_account', { user_id: user.id })
      if (error) throw error
      await signOut()
    } catch (e) {
      console.error(e)
      setMsg('Error deleting account: ' + e.message)
      setDeleting(false)
    }
  }

  async function saveUsername() {
    const u = newUsername.trim()
    if (u.length < 2) { setMsg('Min. 2 characters'); return }
    if (profile?.username_changed_at) {
      const daysSince = (Date.now() - new Date(profile.username_changed_at)) / (1000 * 60 * 60 * 24)
      if (daysSince < 30) {
        setMsg(`You can change your username again in ${Math.ceil(30 - daysSince)} days.`)
        return
      }
    }
    setSaving(true); setMsg('')
    try {
      const p = await upsertProfile(user.id, { ...profile, username: u, username_changed_at: new Date().toISOString() })
      setProfile(p); setEditingUsername(false); showToast('Username updated!')
    } catch (e) { setMsg(e.message?.includes('unique') ? 'Username already taken.' : e.message) }
    finally { setSaving(false) }
  }

  async function saveDetails() {
    setSaving(true)
    try {
      const p = await upsertProfile(user.id, { ...profile, age: age || null, gender: gender || null, identities: identities.length ? identities : null, visibility })
      setProfile(p); setEditingDetails(false); showToast('Profile updated!')
    } catch (e) { showToast(e.message) }
    finally { setSaving(false) }
  }

  function toggleIdentity(id) {
    setIdentities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <>
      <div className="profile-header">
        <div style={{ position:'relative', width:80, margin:'0 auto 14px' }}>
          <div className="avatar lg">{profile?.avatar || '🌳'}</div>
          <button onClick={() => setEditingAvatar(true)} style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'var(--accent)', border:'none', cursor:'pointer', fontSize:12, color:'white' }}>✏️</button>
        </div>

        {editingAvatar && (
          <div style={{ background:'var(--bg2)', borderRadius:12, padding:14, margin:'0 20px 14px' }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:'var(--text2)' }}>Choose your avatar</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {AVATARS.map(a => (
                <span key={a} onClick={() => changeAvatar(a)} style={{ fontSize:26, cursor:'pointer', padding:4, borderRadius:8, background: profile?.avatar === a ? 'var(--accent-light)' : 'transparent', border: profile?.avatar === a ? '2px solid var(--accent)' : '2px solid transparent' }}>{a}</span>
              ))}
            </div>
            <button onClick={() => setEditingAvatar(false)} style={{ marginTop:12, width:'100%', padding:8, background:'transparent', border:'0.5px solid var(--border)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, color:'var(--text3)' }}>Cancel</button>
          </div>
        )}

        {editingUsername ? (
          <div style={{ margin:'0 20px 14px' }}>
            <input style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'0.5px solid var(--accent)', fontFamily:'inherit', fontSize:15, background:'var(--bg2)', color:'var(--text)', outline:'none', marginBottom:8 }}
              placeholder="New username" value={newUsername} onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => e.key==='Enter' && saveUsername()} />
            {msg && <div style={{ fontSize:12, color:'var(--accent)', marginBottom:8 }}>{msg}</div>}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={saveUsername} disabled={saving} style={{ flex:1, padding:8, background:'var(--accent)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>Save</button>
              <button onClick={() => { setEditingUsername(false); setMsg('') }} style={{ flex:1, padding:8, background:'transparent', border:'0.5px solid var(--border)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, color:'var(--text3)' }}>Cancel</button>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>Username can only be changed once per month.</div>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <div className="profile-name">{profile?.username}</div>
            <button onClick={() => { setEditingUsername(true); setNewUsername(profile?.username || '') }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'var(--text3)' }}>✏️</button>
          </div>
        )}

        <div style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>
          {profile?.visibility?.age !== false && profile?.age && profile.age !== 'Prefer not to say' && `${profile.age} · `}
          {profile?.visibility?.gender !== false && profile?.gender && `${profile.gender} · `}
          Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'today'}
        </div>

        {profile?.visibility?.identities !== false && profile?.identities?.length > 0 && (
          <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginTop:10 }}>
            {profile.identities.map(id => (
              <span key={id} className="badge">{id}</span>
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:16 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:600 }}>{posts.length}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Posts</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginTop:14 }}>
          <span className="badge">✓ Email verified</span>
          <span className="badge">{posts.length >= 10 ? '⭐ Active' : posts.length >= 3 ? '🌱 Growing' : 'New member'}</span>
        </div>

        <button onClick={() => setEditingDetails(!editingDetails)} style={{ marginTop:14, padding:'6px 16px', background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, color:'var(--text2)' }}>
          {editingDetails ? 'Cancel editing' : '✏️ Edit profile details'}
        </button>
      </div>

      {editingDetails && (
        <div style={{ padding:'16px 20px', borderBottom:'0.5px solid var(--border)' }}>
          <div className="form-group">
            <label className="form-label">Age</label>
            <div className="age-grid">
              {AGE_GROUPS.map(a => (
                <div key={a} className={`age-chip ${age === a ? 'selected' : ''}`} onClick={() => setAge(age === a ? '' : a)}>{a}</div>
              ))}
            </div>
            <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={visibility.age} onChange={e => setVisibility(v => ({...v, age: e.target.checked}))} />
              <span style={{ fontSize:12, color:'var(--text3)' }}>Show age on profile</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
            </select>
            <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={visibility.gender} onChange={e => setVisibility(v => ({...v, gender: e.target.checked}))} />
              <span style={{ fontSize:12, color:'var(--text3)' }}>Show gender on profile</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Community</label>
            {IDENTITY_OPTIONS.map(group => (
              <div key={group.group} style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{group.group}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {group.items.map(id => (
                    <div key={id} onClick={() => toggleIdentity(id)}
                      style={{ padding:'7px 12px', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer', border:'0.5px solid', borderColor: identities.includes(id) ? 'var(--accent)' : 'var(--border)', background: identities.includes(id) ? 'var(--accent-light)' : 'var(--bg2)', color: identities.includes(id) ? 'var(--accent)' : 'var(--text2)' }}>
                      {id}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={visibility.identities} onChange={e => setVisibility(v => ({...v, identities: e.target.checked}))} />
              <span style={{ fontSize:12, color:'var(--text3)' }}>Show on profile</span>
            </div>
          </div>
          <button onClick={saveDetails} disabled={saving} className="btn-primary" style={{ marginTop:0 }}>
            {saving ? '...' : 'Save changes'}
          </button>
        </div>
      )}

      <div style={{ padding:'16px 20px' }}>
        <div className="section-label" style={{ padding:0, marginBottom:14 }}>My Posts</div>
        {posts.length === 0
          ? <div style={{ fontSize:13, color:'var(--text3)' }}>You haven't posted yet.</div>
          : posts.map(p => (
            <div key={p.id} style={{ padding:12, background:'var(--bg2)', borderRadius:10, marginBottom:8 }}>
              <div style={{ fontSize:13, lineHeight:1.5 }}>{p.text}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>{timeAgo(p.created_at)}</div>
            </div>
          ))
        }
      </div>

      <div style={{ padding:'8px 20px 32px' }}>
        <button onClick={() => navigate('/legal')} style={{ width:'100%', padding:12, background:'transparent', border:'0.5px solid var(--border)', borderRadius:12, fontFamily:'inherit', fontSize:14, color:'var(--text3)', cursor:'pointer', marginBottom:10 }}>
          🔒 Privacy Policy & Impressum
        </button>
        <button onClick={signOut} style={{ width:'100%', padding:12, background:'transparent', border:'0.5px solid var(--border)', borderRadius:12, fontFamily:'inherit', fontSize:14, color:'var(--text3)', cursor:'pointer', marginBottom:10 }}>
          Sign out
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} style={{ width:'100%', padding:12, background:'transparent', border:'0.5px solid #ffcccc', borderRadius:12, fontFamily:'inherit', fontSize:14, color:'#cc3333', cursor:'pointer' }}>
          🗑 Delete account
        </button>
      </div>

      {showDeleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg)', borderRadius:16, padding:24, maxWidth:360, width:'100%' }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:8, color:'#cc3333' }}>⚠️ Delete account</div>
            <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:16 }}>
              This will permanently delete your account, all your posts, comments and messages. This cannot be undone.<br /><br />
              Type your username <strong>{profile?.username}</strong> to confirm:
            </p>
            <input style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'0.5px solid #ffcccc', fontFamily:'inherit', fontSize:14, background:'var(--bg2)', color:'var(--text)', outline:'none', marginBottom:8 }}
              placeholder={profile?.username} value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
            {msg && <div style={{ fontSize:12, color:'#cc3333', marginBottom:8 }}>{msg}</div>}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setMsg('') }}
                style={{ flex:1, padding:10, background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                Cancel
              </button>
              <button onClick={deleteAccount} disabled={deleting}
                style={{ flex:1, padding:10, background:'#cc3333', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>
                {deleting ? '...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
