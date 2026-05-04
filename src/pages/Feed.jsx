import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase, createPost, fetchComments, addComment, reportPost } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const RADII = [
  { label: '2 km', km: 2 }, { label: '5 km', km: 5 }, { label: '10 km', km: 10 },
  { label: '50 km', km: 50 },
  { label: '🇩🇪 Germany', km: 900 },
  { label: '🇮🇹 Italy', km: 901 },
  { label: '🇫🇷 France', km: 902 },
  { label: '🇬🇧 UK', km: 903 },
  { label: '🇺🇸 USA', km: 904 },
  { label: '🌍 Global', km: 99999 },
]

const COUNTRY_BOUNDS = {
  900: { lat: [47.3, 55.1], lng: [5.9, 15.0] },
  901: { lat: [36.6, 47.1], lng: [6.6, 18.5] },
  902: { lat: [41.3, 51.1], lng: [-5.2, 9.6] },
  903: { lat: [49.9, 60.9], lng: [-8.2, 1.8] },
  904: { lat: [24.5, 49.4], lng: [-125.0, -66.9] },
}

const EMOJIS = ['😊','😂','❤️','🔥','👍','🙌','😍','🤔','😅','🥰','😭','🎉','✨','💪','🙏','😎','🤩','😇','🥳','😴','🤗','💚','🌳','🐨','🦊','🐸','🦋','🦔','🐧','🦦','🐙']

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d/60)} min ago`
  if (d < 86400) return `${Math.floor(d/3600)} h ago`
  return `${Math.floor(d/86400)} days ago`
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
  const [locDenied, setLocDenied] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [openCmts, setOpenCmts] = useState({})
  const [cmtsData, setCmtsData] = useState({})
  const [cntData, setCntData] = useState({})
  const [cmtText, setCmtText] = useState({})
  const [toast, setToast] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocDenied(false) },
      () => { setLoc({ lat: 0, lng: 0 }); setLocDenied(true); setRadius(99999) }
    )
  }, [])

  useEffect(() => {
    if (!loc) return
    load()
    const ch = supabase.channel('posts-feed-' + radius)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loc, radius])

  async function load() {
    try {
      let data
      const cb = COUNTRY_BOUNDS[radius]
      if (cb) {
        const { data: d } = await supabase.from('posts')
          .select('*, profiles(username,avatar), comments(id)')
          .gte('lat', cb.lat[0]).lte('lat', cb.lat[1])
          .gte('lng', cb.lng[0]).lte('lng', cb.lng[1])
          .order('created_at', { ascending: false }).limit(100)
        data = d
      } else if (radius === 99999 || locDenied) {
        const { data: d } = await supabase.from('posts')
          .select('*, profiles(username,avatar), comments(id)')
          .order('created_at', { ascending: false }).limit(100)
        data = d
      } else {
        try {
          const { data: d } = await supabase.rpc('posts_within_radius', { user_lat: loc.lat, user_lng: loc.lng, radius_km: radius })
          data = d
        } catch {
          const { data: d } = await supabase.from('posts')
            .select('*, profiles(username,avatar), comments(id)')
            .order('created_at', { ascending: false }).limit(50)
          data = d
        }
      }
      const ps = data || []
      const counts = {}
      ps.forEach(p => { counts[p.id] = p.comments ? p.comments.length : (p.comment_count || 0) })
      setCntData(counts)
      setPosts(ps)
    } catch (e) { console.error(e) }
  }

  async function handlePost() {
    if (!text.trim()) return
    setSending(true)
    try {
      await createPost(user.id, text.trim(), loc?.lat !== 0 ? loc?.lat : null, loc?.lng !== 0 ? loc?.lng : null)
      setText(''); showToast('Post published! ✓'); load()
    } catch (e) { showToast(e.message) }
    finally { setSending(false) }
  }

  async function toggleCmts(id) {
    const next = !openCmts[id]
    setOpenCmts(p => ({ ...p, [id]: next }))
    if (next) {
      const data = await fetchComments(id)
      setCmtsData(p => ({ ...p, [id]: data }))
      setCntData(p => ({ ...p, [id]: data.length }))
    }
  }

  async function submitCmt(id) {
    const t = (cmtText[id] || '').trim()
    if (!t) return
    await addComment(id, user.id, t)
    setCmtText(p => ({ ...p, [id]: '' }))
    const data = await fetchComments(id)
    setCmtsData(p => ({ ...p, [id]: data }))
    setCntData(p => ({ ...p, [id]: data.length }))
  }

  return (
    <>
      {locDenied && (
        <div style={{ background:'#fff8e1', borderBottom:'0.5px solid #ffe082', padding:'10px 20px', fontSize:13, color:'#7a5c00', lineHeight:1.5 }}>
          📍 Location access denied – showing <strong>Global</strong> posts. Enable location in your browser to see local posts.
        </div>
      )}

      <div style={{ padding:'6px 20px 2px', fontSize:11, color:'var(--text3)', fontStyle:'italic', textAlign:'center', letterSpacing:'0.3px' }}>
        from online back to real life 🌳
      </div>

      <div style={{ position:'relative', display:'flex', alignItems:'center', borderBottom:'0.5px solid var(--border)' }}>
        <button onClick={() => document.getElementById('radius-scroll').scrollBy({left:-120,behavior:'smooth'})}
          style={{ position:'absolute', left:0, zIndex:5, background:'linear-gradient(to right, var(--bg) 60%, transparent)', border:'none', cursor:'pointer', fontSize:18, padding:'12px 8px', color:'var(--text2)' }}>‹</button>
        <div id="radius-scroll" className="radius-bar" style={{ borderBottom:'none', paddingLeft:32, paddingRight:32 }}>
          {RADII.map(r => (
            <div key={r.km} className={`radius-chip ${radius === r.km ? 'active' : ''}`}
              onClick={() => {
                if (locDenied && r.km < 9000) { showToast('Enable location to use distance filters'); return }
                setRadius(r.km)
              }}>
              {r.label}
            </div>
          ))}
        </div>
        <button onClick={() => document.getElementById('radius-scroll').scrollBy({left:120,behavior:'smooth'})}
          style={{ position:'absolute', right:0, zIndex:5, background:'linear-gradient(to left, var(--bg) 60%, transparent)', border:'none', cursor:'pointer', fontSize:18, padding:'12px 8px', color:'var(--text2)' }}>›</button>
      </div>

      <div className="compose-bar">
        <div className="avatar">{profile?.avatar}</div>
        <div style={{ flex:1, position:'relative' }}>
          <textarea className="compose-input" placeholder="What's happening near you?"
            value={text} onChange={e => setText(e.target.value)}
            onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
            onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();handlePost()} }}
            style={{ width:'100%', paddingRight:40 }} />
          <button onClick={() => setShowEmoji(s => !s)} style={{ position:'absolute', right:8, bottom:10, background:'none', border:'none', fontSize:18, cursor:'pointer', opacity:0.6 }} title="Add emoji">
            😊
          </button>
          {showEmoji && (
            <div style={{ position:'absolute', bottom:'100%', left:0, right:0, background:'var(--bg)', border:'0.5px solid var(--border)', borderRadius:12, padding:10, display:'flex', flexWrap:'wrap', gap:4, zIndex:50, boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }}>
              {EMOJIS.map(e => (
                <span key={e} onClick={() => { setText(t => t + e); setShowEmoji(false) }} style={{ fontSize:22, cursor:'pointer', padding:3, borderRadius:6 }}>{e}</span>
              ))}
            </div>
          )}
        </div>
        <button className="send-btn" onClick={handlePost} disabled={sending}>↑</button>
      </div>

      {posts.length === 0
        ? <div className="empty-state">No posts in this area yet.<br />Be the first! ✍️</div>
        : posts.map(post => {
          const isOwn = post.user_id === user.id
          const cmts = cmtsData[post.id] || []
          const cntDisplay = cntData[post.id] ?? 0
          return (
            <div className="post-card" key={post.id}>
              <div className="post-header">
                <div className="avatar" style={{ cursor: isOwn ? 'default' : 'pointer' }}
                  onClick={() => !isOwn && navigate(`/chats/${post.user_id}`)}>
                  {post.profiles?.avatar || '🌳'}
                </div>
                <div className="post-meta">
                  <div className="post-username">
                    {post.profiles?.username || 'Unknown'}
                    {isOwn && <span style={{ fontSize:11, color:'var(--accent)', marginLeft:6 }}>(you)</span>}
                  </div>
                  <div className="post-time">{timeAgo(post.created_at)}</div>
                </div>
                {post.distance_m != null && <div className="dist-badge">{fmtDist(post.distance_m)}</div>}
              </div>
              <div className="post-text">{post.text}</div>
              <div className="post-actions">
                <button className="action-btn" onClick={() => toggleCmts(post.id)}>
                  💬 {openCmts[post.id] ? cmts.length : cntDisplay}
                </button>
                {!isOwn && <button className="action-btn" onClick={() => navigate(`/chats/${post.user_id}`)}>✉ Message</button>}
                <button className="action-btn report" onClick={() => { reportPost(post.id, user.id); showToast('Reported ✓') }}>⚑ Report</button>
              </div>
              {openCmts[post.id] && (
                <div className="comments-wrap">
                  {cmts.map(c => (
                    <div className="comment" key={c.id}>
                      <div style={{ fontSize:18 }}>{c.profiles?.avatar || '🌳'}</div>
                      <div>
                        <div className="comment-author">{c.profiles?.username}</div>
                        <div className="comment-text">{c.text}</div>
                        <div className="comment-time">{timeAgo(c.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="add-comment">
                    <div style={{ fontSize:16 }}>{profile?.avatar}</div>
                    <input placeholder="Add a comment..." value={cmtText[post.id]||''}
                      onChange={e => setCmtText(p=>({...p,[post.id]:e.target.value}))}
                      onKeyDown={e => e.key==='Enter'&&submitCmt(post.id)} />
                    <button onClick={() => submitCmt(post.id)}>Send</button>
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
