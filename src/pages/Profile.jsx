import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    if (!user) return
    supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setPosts(data || []))
  }, [user])

  function timeAgo(ts) {
    const d = (Date.now() - new Date(ts)) / 1000
    if (d < 3600) return `vor ${Math.floor(d/60)} Min`
    if (d < 86400) return `vor ${Math.floor(d/3600)} Std`
    return `vor ${Math.floor(d/86400)} Tagen`
  }

  return (
    <>
      <div className="profile-header">
        <div className="avatar lg" style={{ margin:'0 auto 14px' }}>{profile?.avatar || '🐾'}</div>
        <div className="profile-name">{profile?.username}</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>
          {profile?.age && `${profile.age} · `}Kiel · Mitglied seit heute
        </div>
        <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:16 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:600 }}>{posts.length}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Posts</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginTop:14 }}>
          <span className="badge">✓ E-Mail bestätigt</span>
          <span className="badge">{posts.length >= 10 ? '⭐ Aktiv' : posts.length >= 3 ? '🌱 Wächst' : 'Neues Mitglied'}</span>
        </div>
      </div>

      <div style={{ padding:'16px 20px' }}>
        <div className="section-label" style={{ padding:0, marginBottom:14 }}>Meine Posts</div>
        {posts.length === 0
          ? <div style={{ fontSize:13, color:'var(--text3)' }}>Du hast noch nichts gepostet.</div>
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
          Abmelden
        </button>
      </div>
    </>
  )
}
