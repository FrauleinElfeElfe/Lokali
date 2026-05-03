import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { profile } = useAuth()

  return (
    <div className="app-layout">
      <div className="topbar">
        <div className="logo">lokali</div>
        <button className="icon-btn" onClick={() => navigate('/profile')}>{profile?.avatar || '🐾'}</button>
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
