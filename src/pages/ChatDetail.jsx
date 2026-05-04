import { useState, useEffect, useRef, useCallback } from 'react'
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
  const userIdRef = useRef(userId)
  const userRef = useRef(user)

  useEffect(() => { userIdRef.current = userId }, [userId])
  useEffect(() => { userRef.current = user }, [user])

  const load = useCallback(async () => {
    const data = await fetchMessages(userRef.current.id, userIdRef.current)
    setMsgs(data || [])
  }, [])

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => setOther(data))

    load()

    const ch = supabase.channel('chat-' + userId + '-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `recipient_id=eq.${user.id}`
      }, () => load())
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `sender_id=eq.${user.id}`
      }, () => load())
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function send() {
    if (!text.trim()) return
    const t = text.trim()
    setText('')
    // Optimistically add message
    setMsgs(prev => [...prev, {
      id: 'temp-' + Date.now(),
      sender_id: user.id,
      recipient_id: userId,
      text: t,
      created_at: new Date().toISOString()
    }])
    await sendMessage(user.id, userId, t)
    load()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100dvh - 56px)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'0.5px solid var(--border)', background:'var(--bg)', position:'sticky', top:0, zIndex:10 }}>
        <button className="back-btn" onClick={() => navigate('/chats')}>←</button>
        <div className="avatar">{other?.avatar || '🌳'}</div>
        <div style={{ fontWeight:600, fontSize:15 }}>{other?.username || '...'}</div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {msgs.length === 0 && <div className="empty-state" style={{ padding:'40px 0' }}>Say hello! 👋</div>}
        {msgs.map(m => (
          <div key={m.id} className={`msg-bubble ${m.sender_id === user.id ? 'msg-me' : 'msg-them'}`}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display:'flex', gap:10, padding:'14px 20px', borderTop:'0.5px solid var(--border)', background:'var(--bg)' }}>
        <input style={{ flex:1, border:'0.5px solid var(--border)', borderRadius:22, padding:'10px 16px', fontFamily:'inherit', fontSize:14, background:'var(--bg2)', color:'var(--text)', outline:'none' }}
          placeholder="Write a message..." value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key==='Enter' && send()} />
        <button className="send-btn" style={{ borderRadius:'50%', width:40, height:40 }} onClick={send}>↑</button>
      </div>
    </div>
  )
}
