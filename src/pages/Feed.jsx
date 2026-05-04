import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase, createPost, fetchComments, addComment, reportPost } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const DISTANCE_RADII = [
  { label: '2 km', km: 2 }, { label: '5 km', km: 5 }, { label: '10 km', km: 10 },
  { label: '25 km', km: 25 }, { label: '50 km', km: 50 }, { label: '100 km', km: 100 },
  { label: '🗺️ Nationwide', km: 999 },
]

const EUROPE_COUNTRIES = [
  { label: '🇪🇺 All Europe', bounds: { lat: [34, 72], lng: [-25, 45] } },
  { label: '🇩🇪 Germany', bounds: { lat: [47.3, 55.1], lng: [5.9, 15.0] } },
  { label: '🇦🇹 Austria', bounds: { lat: [46.4, 49.0], lng: [9.5, 17.2] } },
  { label: '🇨🇭 Switzerland', bounds: { lat: [45.8, 47.8], lng: [5.9, 10.5] } },
  { label: '🇮🇹 Italy', bounds: { lat: [36.6, 47.1], lng: [6.6, 18.5] } },
  { label: '🇫🇷 France', bounds: { lat: [41.3, 51.1], lng: [-5.2, 9.6] } },
  { label: '🇪🇸 Spain', bounds: { lat: [36.0, 43.8], lng: [-9.3, 4.3] } },
  { label: '🇵🇹 Portugal', bounds: { lat: [37.0, 42.2], lng: [-9.5, -6.2] } },
  { label: '🇬🇧 UK', bounds: { lat: [49.9, 60.9], lng: [-8.2, 1.8] } },
  { label: '🇮🇪 Ireland', bounds: { lat: [51.4, 55.4], lng: [-10.5, -6.0] } },
  { label: '🇳🇱 Netherlands', bounds: { lat: [50.8, 53.6], lng: [3.3, 7.2] } },
  { label: '🇧🇪 Belgium', bounds: { lat: [49.5, 51.5], lng: [2.5, 6.4] } },
  { label: '🇱🇺 Luxembourg', bounds: { lat: [49.4, 50.2], lng: [5.7, 6.5] } },
  { label: '🇩🇰 Denmark', bounds: { lat: [54.6, 57.8], lng: [8.1, 15.2] } },
  { label: '🇸🇪 Sweden', bounds: { lat: [55.3, 69.1], lng: [11.1, 24.2] } },
  { label: '🇳🇴 Norway', bounds: { lat: [57.9, 71.2], lng: [4.6, 31.1] } },
  { label: '🇫🇮 Finland', bounds: { lat: [59.8, 70.1], lng: [19.1, 31.6] } },
  { label: '🇵🇱 Poland', bounds: { lat: [49.0, 54.9], lng: [14.1, 24.2] } },
  { label: '🇨🇿 Czechia', bounds: { lat: [48.6, 51.1], lng: [12.1, 18.9] } },
  { label: '🇸🇰 Slovakia', bounds: { lat: [47.7, 49.6], lng: [16.8, 22.6] } },
  { label: '🇭🇺 Hungary', bounds: { lat: [45.7, 48.6], lng: [16.1, 22.9] } },
  { label: '🇷🇴 Romania', bounds: { lat: [43.6, 48.3], lng: [20.3, 30.0] } },
  { label: '🇧🇬 Bulgaria', bounds: { lat: [41.2, 44.2], lng: [22.4, 28.6] } },
  { label: '🇬🇷 Greece', bounds: { lat: [34.8, 42.0], lng: [19.4, 29.7] } },
  { label: '🇭🇷 Croatia', bounds: { lat: [42.4, 46.6], lng: [13.5, 19.4] } },
  { label: '🇸🇮 Slovenia', bounds: { lat: [45.4, 46.9], lng: [13.4, 16.6] } },
  { label: '🇷🇸 Serbia', bounds: { lat: [42.2, 46.2], lng: [18.8, 23.0] } },
  { label: '🇺🇦 Ukraine', bounds: { lat: [44.4, 52.4], lng: [22.1, 40.2] } },
  { label: '🇹🇷 Turkey', bounds: { lat: [35.8, 42.1], lng: [26.0, 44.8] } },
]

const CONTINENTS = [
  { label: '🌎 Americas', bounds: { lat: [-56, 72], lng: [-168, -34] } },
  { label: '🌏 Asia & Pacific', bounds: { lat: [-50, 77], lng: [26, 180] } },
  { label: '🌍 Africa', bounds: { lat: [-35, 38], lng: [-18, 52] } },
  { label: '🌍 Global', km: 99999 },
]

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
  const [activeBounds, setActiveBounds] = useState(null)
  const [activeLabel, setActiveLabel] = useState('2 km')
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
  const [showEuropeMenu, setShowEuropeMenu] = useState(false)
  const [showContinentMenu, setShowContinentMenu] = useState(false)

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocDenied(false) },
      () => { setLoc({ lat: 0, lng: 0 }); setLocDenied(true); setRadius(99999); setActiveLabel('🌍 Global') }
    )
  }, [])

  useEffect(() => {
    if (!loc) return
    load()
    const ch = supabase.channel('posts-feed-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loc, radius, activeBounds])

  async function load() {
    try {
      let data
      if (activeBounds) {
        const b = activeBounds
        const { data: d } = await supabase.from('posts')
          .select('*, profiles(username,avatar), comments(id)')
          .gte('lat', b.lat[0]).lte('lat', b.lat[1])
          .gte('lng', b.lng[0]).lte('lng', b.lng[1])
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

  function selectDistance(r) {
    if (locDenied) { showToast('Enable location to use distance filters'); return }
    setRadius(r.km); setActiveBounds(null); setActiveLabel(r.label)
    setShowEuropeMenu(false); setShowContinentMenu(false)
  }

  function selectEurope(country) {
    setActiveBounds(country.bounds); setRadius(0); setActiveLabel(country.label)
    setShowEuropeMenu(false); setShowContinentMenu(false)
  }

  function selectContinent(c) {
    if (c.km) { setRadius(c.km); setActiveBounds(null) }
    else { setActiveBounds(c.bounds); setRadius(0) }
    setActiveLabel(c.label)
    setShowEuropeMenu(false); setShowContinentMenu(false)
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

      <div style={{ padding:'6px 20px 2px', fontSize:11, color:'var(--text3)', fontStyle:'italic', textAlign:'center' }}>
        from online back to real life 🌳
      </div>

      {/* RADIUS BAR */}
      <div style={{ position:'relative' }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center', borderBottom:'0.5px solid var(--border)' }}>
          <button onClick={() => document.getElementById('radius-scroll').scrollBy({left:-120,behavior:'smooth'})}
            style={{ position:'absolute', left:0, zIndex:5, background:'linear-gradient(to right, var(--bg) 60%, transparent)', border:'none', cursor:'pointer', fontSize:18, padding:'12px 8px', color:'var(--text2)' }}>‹</button>
          <div id="radius-scroll" className="radius-bar" style={{ borderBottom:'none', paddingLeft:32, paddingRight:32, gap:6 }}>
            {DISTANCE_RADII.map(r => (
              <div key={r.km} className={`radius-chip ${activeLabel === r.label ? 'active' : ''}`} onClick={() => selectDistance(r)}>{r.label}</div>
            ))}
            <div className={`radius-chip ${activeLabel.includes('Europe') || EUROPE_COUNTRIES.some(c => c.label === activeLabel) ? 'active' : ''}`}
              onClick={() => { setShowEuropeMenu(s => !s); setShowContinentMenu(false) }}
              style={{ whiteSpace:'nowrap' }}>
              🇪🇺 Europe {showEuropeMenu ? '▴' : '▾'}
            </div>
            {CONTINENTS.map(c => (
              <div key={c.label} className={`radius-chip ${activeLabel === c.label ? 'active' : ''}`} onClick={() => selectContinent(c)}>{c.label}</div>
            ))}
          </div>
          <button onClick={() => document.getElementById('radius-scroll').scrollBy({left:120,behavior:'smooth'})}
            style={{ position:'absolute', right:0, zIndex:5, background:'linear-gradient(to left, var(--bg) 60%, transparent)', border:'none', cursor:'pointer', fontSize:18, padding:'12px 8px', color:'var(--text2)' }}>›</button>
        </div>

        {/* EUROPE DROPDOWN */}
        {showEuropeMenu && (
          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg)', border:'0.5px solid var(--border)', borderTop:'none', zIndex:50, maxHeight:280, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.1)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {EUROPE_COUNTRIES.map(c => (
                <div key={c.label} onClick={() => selectEurope(c)}
                  style={{ padding:'10px 14px', fontSize:13, cursor:'pointer', borderBottom:'0.5px solid var(--border)', color: activeLabel === c.label ? 'var(--accent)' : 'var(--text)', fontWeight: activeLabel === c.label ? 600 : 400, background: activeLabel === c.label ? 'var(--accent-light)' : 'transparent' }}>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="compose-bar">
        <div className="avatar">{profile?.avatar}</div>
        <div style={{ flex:1, position:'relative' }}>
          <textarea className="compose-input" placeholder="What's happening near you?"
            value={text} onChange={e => setText(e.target.value)}
            onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
            onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();handlePost()} }}
            style={{ width:'100%', paddingRight:40 }} />
          <button onClick={() => setShowEmoji(s => !s)} style={{ position:'absolute', right:8, bottom:10, background:'none', border:'none', fontSize:18, cursor:'pointer', opacity:0.6 }}>😊</button>
          {showEmoji && (
            <div style={{ position:'absolute', top:'100%', marginTop:4, left:0, right:0, background:'var(--bg)', border:'0.5px solid var(--border)', borderRadius:12, padding:10, display:'flex', flexWrap:'wrap', gap:4, zIndex:50, boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }}>
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
                  onClick={() => navigate(`/profile/${post.user_id}`)}>
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
            <div style={{ position:'absolute', top:'100%', marginTop:4, left:0, right:0, background:'var(--bg)', border:'0.5px solid var(--border)', borderRadius:12, padding:10, display:'flex', flexWrap:'wrap', gap:4, zIndex:50, boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }}>
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
                  onClick={() => navigate(`/profile/${post.user_id}`)}>
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
