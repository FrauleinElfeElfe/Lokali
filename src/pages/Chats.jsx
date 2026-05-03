import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Chats() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [convos, setConvos] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(username,avatar), recipient:profiles!messages_recipient_id_fkey(username,avatar)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!data) return
    const seen = new Map()
    for (const m of data) {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
      const otherProfile = m.sender_id === user.id ? m.recipient : m.sender
      if (!seen.has(otherId)) seen.set(otherId, { id: otherId, profile: otherProfile, last: m })
    }
    setConvos([...seen.values()])
  }

  if (convos.length === 0) return <div className="empty-state">Noch keine Chats.<br />Schreib jemanden im Feed an! ✉️</div>

  return (
    <>
      <div className="section-label">Nachrichten</div>
      {convos.map(c => (
        <div className="chat-item" key={c.id} onClick={() => navigate(`/chats/${c.id}`)}>
          <div className="avatar">{c.profile?.avatar || '🐾'}</div>
          <div style={{ flex: 1 }}>
            <div className="chat-name">{c.profile?.username || 'Unbekannt'}</div>
            <div className="chat-preview">{c.last.text?.substring(0, 50)}</div>
          </div>
        </div>
      ))}
    </>
  )
}
