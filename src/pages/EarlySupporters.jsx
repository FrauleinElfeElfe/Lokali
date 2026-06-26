import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function EarlySupporters() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [supporters, setSupporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [myEntry, setMyEntry] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('early_supporters').select('*, profiles(username,avatar)').order('slot_number', { ascending: true })
    setSupporters(data || [])
    setMyEntry((data || []).find(s => s.user_id === user.id) || null)
    setLoading(false)
  }

  async function claim() {
    if (!name.trim() || !url.trim()) { showToast('Please fill in both fields'); return }
    if (!url.match(/^https?:\/\//)) { showToast('Link must start with http:// or https://'); return }
    setSaving(true)
    const { data, error } = await supabase.rpc('claim_supporter_slot', {
      p_user_id: user.id, p_name: name.trim(), p_url: url.trim()
    })
    if (error || !data?.success) {
      setSaving(false)
      showToast(data?.error || error?.message || 'Error claiming slot')
      return
    }
    showToast(`You got slot #${data.slot}! 🎉`)
    setShowForm(false)
    const { data: newPost } = await supabase.from('posts').insert({
      user_id: user.id,
      text: `🌟 I'm one of the first 100 lokali supporters! Check out my ${name.trim()}: ${url.trim()}`,
      lat: null, lng: null
    }).select().single()
    if (newPost) {
      await supabase.from('early_supporters').update({ feed_post_id: newPost.id }).eq('user_id', user.id)
    }
    setName(''); setUrl('')
    setSaving(false)
    load()
  }

  async function removeEntry() {
    if (!myEntry) return
    if (myEntry.feed_post_id) {
      await supabase.from('posts').delete().eq('id', myEntry.feed_post_id)
    }
    await supabase.from('early_supporters').delete().eq('user_id', user.id)
    showToast('Your slot has been freed up.')
    load()
  }

  const slotsLeft = 100 - supporters.length

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'0.5px solid var(--border)', position:'sticky', top:0, background:'var(--bg)', zIndex:10 }}>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text2)' }}>←</button>
        <div style={{ fontWeight:600, fontSize:15, flex:1 }}>🌟 100 Supporter Slots</div>
      </div>

      <div style={{ padding:'16px 20px' }}>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:16 }}>
          100 lokali users can claim a permanent shoutout here with a link to their social media. First come, first served – once full, it's full. You can remove your entry anytime to free up the slot for someone else.
        </p>

        <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)', marginBottom:16 }}>
          {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} left` : 'All slots are taken'}
        </div>

        {myEntry ? (
          <div style={{ padding:14, background:'var(--accent-light)', borderRadius:12, marginBottom:20 }}>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>You hold slot #{myEntry.slot_number}: <strong>{myEntry.social_name}</strong></div>
            <div style={{ fontSize:11, color:'var(--accent)', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{myEntry.social_url}</div>
            <button onClick={removeEntry} style={{ padding:'8px 14px', background:'transparent', border:'0.5px solid var(--accent)', borderRadius:8, color:'var(--accent)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600 }}>
              Remove my entry
            </button>
          </div>
        ) : slotsLeft > 0 ? (
          showForm ? (
            <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:20 }}>
              <div className="form-group">
                <label className="form-label">Your name / handle</label>
                <input className="form-input" placeholder="e.g. @yourname" value={name} onChange={e => setName(e.target.value)} maxLength={40} />
              </div>
              <div className="form-group">
                <label className="form-label">Link to your social media</label>
                <input className="form-input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setShowForm(false)} style={{ flex:1, padding:10, background:'transparent', border:'0.5px solid var(--border)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, color:'var(--text3)' }}>Cancel</button>
                <button onClick={claim} disabled={saving} style={{ flex:2, padding:10, background:'var(--accent)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>
                  {saving ? '...' : 'Claim my slot'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="btn-primary" style={{ marginBottom:20 }}>
              Claim your slot 🌟
            </button>
          )
        ) : null}

        {loading ? (
          <div style={{ fontSize:13, color:'var(--text3)' }}>Loading...</div>
        ) : supporters.length === 0 ? (
          <div style={{ fontSize:13, color:'var(--text3)' }}>No supporters yet – be the first!</div>
        ) : (
          supporters.map(s => (
            <a key={s.id} href={s.social_url} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'0.5px solid var(--border)', textDecoration:'none', color:'inherit' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text3)', width:28 }}>#{s.slot_number}</div>
              <div className="avatar" style={{ width:32, height:32, fontSize:16 }}>{s.profiles?.avatar || '🌳'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{s.social_name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>@{s.profiles?.username}</div>
                <div style={{ fontSize:11, color:'var(--accent)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.social_url}</div>
              </div>
              <div style={{ fontSize:14, color:'var(--accent)' }}>↗</div>
            </a>
          ))
        )}
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
