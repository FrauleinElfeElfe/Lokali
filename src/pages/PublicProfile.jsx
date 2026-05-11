import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function PublicProfile() {
  const { userId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
      setProfile(p)
      const { data: ps } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      setPosts(ps || [])
      setLoading(false)
    }
    load()
  }, [userId])

  function timeAgo(ts) {
    const d = (Date.now() - new Date(ts)) / 1000
    if (d < 3600) return `${Math.floor(d/60)} min ago`
    if (d < 86400) return `${Math.floor(d/3600)} h ago`
    return `${Math.floor(d/86400)} days ago`
  }

  if (loading) return <div className="empty-state">Loading... 🌳</div>
  if (!profile) return <div className="empty-state">Profile not found.</div>

  const isOwn = user?.id === userId

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'0.5px solid var(--border)' }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text2)' }}>←</button>
        <div style={{ fontWeight:600, fontSize:15 }}>Profile</div>
      </div>

      <div className="profile-header">
        <div className="avatar lg" style={{ margin:'0 auto 14px' }}>{profile.avatar || '🌳'}</div>
        <div className="profile-name">{profile.username}</div>

        <div style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>
          {profile.visibility?.age !== false && profile.age && profile.age !== 'Prefer not to say' && `${profile.age} · `}
          {profile.visibility?.gender !== false && profile.gender && `${profile.gender} · `}
          lokali member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''}
        </div>

        {profile.visibility?.identities !== false && profile.identities?.length > 0 && (
          <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginTop:10 }}>
            {profile.identities.map(id => <span key={id} className="badge">{id}</span>)}
          </div>
        )}

        <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:16 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:600 }}>{posts.length}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Posts</div>
          </div>
        </div>

        {!isOwn && (
          <button onClick={() => navigate(`/chats/${userId}`)} style={{ marginTop:16, padding:'10px 24px', background:'var(--accent)', color:'white', border:'none', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>
            ✉ Send message
          </button>
        )}
      </div>

      <div style={{ padding:'16px 20px' }}>
        <div className="section-label" style={{ padding:0, marginBottom:14 }}>Recent posts</div>
        {posts.length === 0
          ? <div style={{ fontSize:13, color:'var(--text3)' }}>No posts yet.</div>
          : posts.map(p => (
            <div key={p.id} style={{ padding:12, background:'var(--bg2)', borderRadius:10, marginBottom:8 }}>
              <div style={{ fontSize:13, lineHeight:1.5 }}>{p.text}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>{timeAgo(p.created_at)}</div>
            </div>
          ))
        }
      </div>
    </>
  )
}
