import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { profile, user } = useAuth()
  const [credits, setCredits] = useState(null)

  useEffect(() => {
    if (!user) return
    loadCredits()
    const ch = supabase.channel('credits-live-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pixel_credits', filter: `user_id=eq.${user.id}` }, loadCredits)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  async function loadCredits() {
    const { data } = await supabase.from('pixel_credits').select('credits').eq('user_id', user.id).maybeSingle()
    setCredits(data?.credits ?? 0)
  }

  return (
    <div className="app-layout">
      <div className="topbar">
        <div className="logo">lokali</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div onClick={() => navigate('/canvas')} style={{ fontSize:13, fontWeight:700, color:'var(--accent)', background:'var(--accent-light)', padding:'5px 10px', borderRadius:20, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
            {credits ?? '–'} 🟦
          </div>
          <button className="icon-btn" onClick={() => navigate('/profile')}>{profile?.avatar || '🌳'}</button>
        </div>
      </div>
      <main className="content">{children}</main>
      <nav className="bottom-nav">
        <button className={`nav-item ${pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
          🏠<span className="nav-label">Feed</span>
        </button>
        <button className={`nav-item ${pathname.startsWith('/chats') ? 'active' : ''}`} onClick={() => navigate('/chats')}>
          💬<span className="nav-label">Chats</span>
        </button>
        <button className={`nav-item ${pathname === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
          👤<span className="nav-label">Profil</span>
        </button>
      </nav>
    </div>
  )
}
