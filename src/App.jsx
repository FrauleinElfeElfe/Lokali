import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Feed from './pages/Feed'
import Chats from './pages/Chats'
import ChatDetail from './pages/ChatDetail'
import Profile from './pages/Profile'
import Layout from './components/Layout'
import './index.css'

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',fontSize:40}}>🌳</div>
  if (!user) return <Login />
  if (!profile?.username) return <Onboarding />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chats/:userId" element={<ChatDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider><AppRoutes /></AuthProvider>
    </BrowserRouter>
  )
}
