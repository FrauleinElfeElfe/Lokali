import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase, upsertProfile } from '../lib/supabase'

const AVATARS = ['🐨','🦊','🐺','🦁','🐸','🦋','🦔','🐧','🦦','🐙','🦜','🐬','🦌','🐼','🦘','🦈','🐻','🦒','🐘','🦏','🐆','🦓','🦅','🦚','🦩','🐊','🦋','🐇','🦝','🦫','🦦','🐿️','🦔','🐾']

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000
  if (d < 3600) return `${Math.floor(d/60)} min ago`
  if (d < 86400) return `${Math.floor(d/3600)} h ago`
  return `${Math.floor(d/86400)} days ago`
}

export default function Profile() {
  const { user, profile, setProfile, signOut } = useAuth()
  const [posts, setPosts] = useState([])
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [toast, setToast] = useState('')

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!user) return
    supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setPosts(data || []))
  }, [user])

  async function changeAvatar(avatar) {
    setSaving(true)
    try {
      const p = await upsertProfile(user.id, { ...profile, avatar })
      setProfile(p)
      setEditingAvatar(false)
      showToast('Avatar updated! 🐾')
    } catch (e) { showToast(e.message) }
    finally { setSaving(false) }
  }

  async function saveUsername() {
    const u = newUsername.trim()
    if (u.length < 2) { setMsg('Min. 2 characters'); return }

    // Check 30-day cooldown
    if (profile?.username_changed_at) {
      const daysSince = (Date.now() - new Date(profile.username_changed_at)) / (1000 * 60 * 60 * 24)
      if (daysSince < 30) {
        const daysLeft = Math.ceil(30 - daysSince)
        setMsg(`You can change your username again in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`)
        return
      }
    }

    setSaving(true); setMsg('')
    try {
      const p = await upsertProfile(user.id, { ...profile, username: u, username_changed_at: new Date().toISOString() })
      setProfile(p)
      setEditingUsername(false)
      showToast('Username updated!')
    } catch (e) {
      setMsg(e.message?.includes('unique') ? 'This username is already taken.' : e.message)
    }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="profile-header">
        <div style={{ position:'relative', width:80, margin:'0 auto 14px' }}>
          <div className="avatar lg">{profile?.avatar || '🌳'}</div>
          <button onClick={() => setEditingAvatar(true)} style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'var(--accent)', border:'none', cursor:'pointer', fontSize:12, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
        </div>

        {editingAvatar ? (
          <div style={{ background:'var(--bg2)', borderRadius:12, padding:14, margin:'0 20px 14px' }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:'var(--text2)' }}>Choose your avatar</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {AVATARS.map(a => (
                <span key={a} onClick={() => changeAvatar(a)} style={{ fontSize:26, cursor:'pointer', padding:4, borderRadius:8, background: profile?.avatar === a ? 'var(--accent-light)' : 'transparent', border: profile?.avatar === a ? '2px solid var(--accent)' : '2px solid transparent' }}>{a}</span>
              ))}
            </div>
            <button onClick={() => setEditingAvatar(false)} style={{ marginTop:12, width:'100%', padding:8, background:'transparent', border:'0.5px solid var(--border)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, color:'var(--text3)' }}>Cancel</button>
          </div>
        ) : null}

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
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <div className="profile-name">{profile?.username}</div>
            <button onClick={() => { setEditingUsername(true); setNewUsername(profile?.username || '') }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'var(--text3)' }} title="Change username (once per month)">✏️</button>
          </div>
        )}

        <div style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>
          {profile?.age && `${profile.age} · `}Member since today
        </div>
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
      </div>

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
        <button onClick={signOut} style={{ width:'100%', padding:12, background:'transparent', border:'0.5px solid var(--border)', borderRadius:12, fontFamily:'inherit', fontSize:14, color:'var(--text3)', cursor:'pointer' }}>
          Sign out
        </button>
      </div>
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
