import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase, fetchMessages, sendMessage } from '../lib/supabase'
import { useParams, useNavigate } from 'react-router-dom'

export default function ChatDetail() {
  const { user } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const [msgs, setMsgs] = useState([])
  const [other, setOther] = useState(null)
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    loadOther(); load()
    const ch = supabase.channel('msgs-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [userId])

  useEffect(() => { bottomRef.current?.scrollIntoView() }, [msgs])

  async function loadOther() {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setOther(data)
  }

  async function load() {
    const data = await fetchMessages(user.id, userId)
    setMsgs(data || [])
  }

  async function send() {
    if (!text.trim()) return
    const t = text.trim()
    setText('')
    await sendMessage(user.id, userId, t)
    load()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100dvh - 56px)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'0.5px solid var(--border)', background:'var(--bg)' }}>
        <button className="back-btn" onClick={() => navigate('/chats')}>←</button>
        <div className="avatar">{other?.avatar || '🐾'}</div>
        <div style={{ fontWeight:600, fontSize:15 }}>{other?.username || '...'}</div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {msgs.length === 0 && <div className="empty-state" style={{ padding:'40px 0' }}>Sag hallo! 👋</div>}
        {msgs.map(m => (
          <div key={m.id} className={`msg-bubble ${m.sender_id === user.id ? 'msg-me' : 'msg-them'}`}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display:'flex', gap:10, padding:'14px 20px', borderTop:'0.5px solid var(--border)', background:'var(--bg)' }}>
        <input style={{ flex:1, border:'0.5px solid var(--border)', borderRadius:22, padding:'10px 16px', fontFamily:'inherit', fontSize:14, background:'var(--bg2)', color:'var(--text)', outline:'none' }}
          placeholder="Nachricht schreiben..." value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key==='Enter' && send()} />
        <button className="send-btn" style={{ borderRadius:'50%', width:40, height:40 }} onClick={send}>↑</button>
      </div>
    </div>
  )
}
