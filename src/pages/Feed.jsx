import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase, createPost, fetchComments, addComment, reportPost } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const RADII = [
  { label: '2 km', km: 2 }, { label: '5 km', km: 5 }, { label: '10 km', km: 10 },
  { label: '50 km', km: 50 }, { label: 'Landesweit', km: 999 }, { label: 'Global 🌍', km: 99999 },
]

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000
  if (d < 60) return 'gerade eben'
  if (d < 3600) return `vor ${Math.floor(d/60)} Min`
  if (d < 86400) return `vor ${Math.floor(d/3600)} Std`
  return `vor ${Math.floor(d/86400)} Tagen`
}
function fmtDist(m) {
  if (!m && m !== 0) return ''
  return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`
}

export default function Feed() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [radius, setRadius] = useState(2)
  const [loc, setLoc] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [openCmts, setOpenCmts] = useState({})
  const [cmtsData, setCmtsData] = useState({})
  const [cmtText, setCmtText] = useState({})
  const [toast, setToast] = useState('')

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setLoc({ lat: 54.3233, lng: 10.1228 })
    )
  }, [])

  useEffect(() => {
    if (!loc) return
    load()
    const ch = supabase.channel('posts-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loc, radius])

  async function load() {
    try {
      const { data } = await supabase.rpc('posts_within_radius', { user_lat: loc.lat, user_lng: loc.lng, radius_km: radius })
      setPosts(data || [])
    } catch {
      const { data } = await supabase.from('posts').select('*, profiles(username,avatar)').order('created_at', { ascending: false }).limit(50)
      setPosts(data || [])
    }
  }

  async function handlePost() {
    if (!text.trim()) return
    setSending(true)
    try {
      await createPost(user.id, text.trim(), loc?.lat, loc?.lng)
      setText(''); showToast('Post veröffentlicht! ✓'); load()
    } catch (e) { showToast(e.message) }
    finally { setSending(false) }
  }

  async function toggleCmts(id) {
    const next = !openCmts[id]
    setOpenCmts(p => ({ ...p, [id]: next }))
    if (next && !cmtsData[id]) {
      const data = await fetchComments(id)
      setCmtsData(p => ({ ...p, [id]: data }))
    }
  }

  async function submitCmt(id) {
    const t = (cmtText[id] || '').trim()
    if (!t) return
    await addComment(id, user.id, t)
    setCmtText(p => ({ ...p, [id]: '' }))
    const data = await fetchComments(id)
    setCmtsData(p => ({ ...p, [id]: data }))
  }

  return (
    <>
      <div className="radius-bar">
        {RADII.map(r => (
          <div key={r.km} className={`radius-chip ${radius === r.km ? 'active' : ''}`}
            onClick={() => setRadius(r.km)}>{r.label}</div>
        ))}
      </div>
      <div className="compose-bar">
        <div className="avatar">{profile?.avatar}</div>
        <textarea className="compose-input" placeholder="Was passiert bei dir gerade?"
          value={text} onChange={e => setText(e.target.value)}
          onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
          onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();handlePost()} }} />
        <button className="send-btn" onClick={handlePost} disabled={sending}>↑</button>
      </div>
      {posts.length === 0
        ? <div className="empty-state">Keine Posts in diesem Radius.<br />Sei die/der Erste! ✍️</div>
        : posts.map(post => {
          const isOwn = post.user_id === user.id
          const cmts = cmtsData[post.id] || []
          return (
            <div className="post-card" key={post.id}>
              <div className="post-header">
                <div className="avatar" style={{ cursor: isOwn ? 'default' : 'pointer' }}
                  onClick={() => !isOwn && navigate(`/chats/${post.user_id}`)}>
                  {post.profiles?.avatar || '🐾'}
                </div>
                <div className="post-meta">
                  <div className="post-username">
                    {post.profiles?.username || 'Unbekannt'}
                    {isOwn && <span style={{ fontSize:11,color:'var(--accent)',marginLeft:6 }}>(du)</span>}
                  </div>
                  <div className="post-time">{timeAgo(post.created_at)}</div>
                </div>
                {post.distance_m != null && <div className="dist-badge">{fmtDist(post.distance_m)}</div>}
              </div>
              <div className="post-text">{post.text}</div>
              <div className="post-actions">
                <button className="action-btn" onClick={() => toggleCmts(post.id)}>💬 {cmts.length}</button>
                {!isOwn && <button className="action-btn" onClick={() => navigate(`/chats/${post.user_id}`)}>✉ Anschreiben</button>}
                <button className="action-btn report" onClick={() => { reportPost(post.id, user.id); showToast('Gemeldet ✓') }}>⚑ Melden</button>
              </div>
              {openCmts[post.id] && (
                <div className="comments-wrap">
                  {cmts.map(c => (
                    <div className="comment" key={c.id}>
                      <div style={{ fontSize:18 }}>{c.profiles?.avatar || '🐾'}</div>
                      <div>
                        <div className="comment-author">{c.profiles?.username}</div>
                        <div className="comment-text">{c.text}</div>
                        <div className="comment-time">{timeAgo(c.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="add-comment">
                    <div style={{ fontSize:16 }}>{profile?.avatar}</div>
                    <input placeholder="Kommentar..." value={cmtText[post.id]||''}
                      onChange={e => setCmtText(p=>({...p,[post.id]:e.target.value}))}
                      onKeyDown={e => e.key==='Enter'&&submitCmt(post.id)} />
                    <button onClick={() => submitCmt(post.id)}>Senden</button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      }
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
