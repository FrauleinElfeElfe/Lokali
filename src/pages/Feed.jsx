import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase, createPost, fetchComments, addComment } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const DISTANCE_RADII = [
  { label: '5 km', km: 5 }, { label: '10 km', km: 10 },
  { label: '25 km', km: 25 }, { label: '50 km', km: 50 }, { label: '100 km', km: 100 },
]

const AFRICA_COUNTRIES = [
  { label: '🌍 All Africa', bounds: { lat: [-35, 38], lng: [-18, 52] } },
  { label: '🇩🇿 Algeria', bounds: { lat: [19, 37], lng: [-9, 12] } },
  { label: '🇦🇴 Angola', bounds: { lat: [-18, -4], lng: [11, 25] } },
  { label: '🇨🇲 Cameroon', bounds: { lat: [1, 13], lng: [8, 16] } },
  { label: '🇨🇩 DR Congo', bounds: { lat: [-13, 5], lng: [12, 31] } },
  { label: '🇪🇬 Egypt', bounds: { lat: [22, 32], lng: [24, 37] } },
  { label: '🇪🇹 Ethiopia', bounds: { lat: [3, 15], lng: [33, 48] } },
  { label: '🇬🇭 Ghana', bounds: { lat: [4, 11], lng: [-3, 1] } },
  { label: '🇨🇮 Ivory Coast', bounds: { lat: [4, 11], lng: [-8, -2] } },
  { label: '🇰🇪 Kenya', bounds: { lat: [-5, 5], lng: [33, 42] } },
  { label: '🇲🇬 Madagascar', bounds: { lat: [-26, -12], lng: [43, 51] } },
  { label: '🇲🇦 Morocco', bounds: { lat: [27, 36], lng: [-14, -1] } },
  { label: '🇲🇿 Mozambique', bounds: { lat: [-27, -10], lng: [32, 41] } },
  { label: '🇳🇬 Nigeria', bounds: { lat: [4, 14], lng: [2, 15] } },
  { label: '🇸🇳 Senegal', bounds: { lat: [12, 16], lng: [-17, -11] } },
  { label: '🇿🇦 South Africa', bounds: { lat: [-35, -22], lng: [16, 33] } },
  { label: '🇸🇩 Sudan', bounds: { lat: [9, 23], lng: [21, 39] } },
  { label: '🇹🇿 Tanzania', bounds: { lat: [-12, -1], lng: [29, 41] } },
  { label: '🇹🇳 Tunisia', bounds: { lat: [30, 38], lng: [7, 12] } },
  { label: '🇺🇬 Uganda', bounds: { lat: [-2, 4], lng: [29, 35] } },
  { label: '🇿🇲 Zambia', bounds: { lat: [-18, -8], lng: [22, 34] } },
  { label: '🇿🇼 Zimbabwe', bounds: { lat: [-22, -15], lng: [25, 33] } },
]

const NORTH_AMERICA_COUNTRIES = [
  { label: '🌎 All North America', bounds: { lat: [7, 72], lng: [-168, -52] } },
  { label: '🇨🇦 Canada', bounds: { lat: [42, 83], lng: [-141, -52] } },
  { label: '🇨🇷 Costa Rica', bounds: { lat: [8, 11], lng: [-86, -82] } },
  { label: '🇨🇺 Cuba', bounds: { lat: [19, 23], lng: [-85, -74] } },
  { label: '🇩🇴 Dominican Rep.', bounds: { lat: [17, 20], lng: [-72, -68] } },
  { label: '🇸🇻 El Salvador', bounds: { lat: [13, 14], lng: [-90, -87] } },
  { label: '🇬🇹 Guatemala', bounds: { lat: [13, 18], lng: [-92, -88] } },
  { label: '🇭🇳 Honduras', bounds: { lat: [13, 16], lng: [-89, -83] } },
  { label: '🇯🇲 Jamaica', bounds: { lat: [17, 18], lng: [-78, -76] } },
  { label: '🇲🇽 Mexico', bounds: { lat: [14, 33], lng: [-118, -86] } },
  { label: '🇳🇮 Nicaragua', bounds: { lat: [10, 15], lng: [-88, -83] } },
  { label: '🇵🇦 Panama', bounds: { lat: [7, 10], lng: [-83, -77] } },
  { label: '🇵🇷 Puerto Rico', bounds: { lat: [17, 19], lng: [-68, -65] } },
  { label: '🇺🇸 USA', bounds: { lat: [24, 50], lng: [-125, -66] } },
]

const SOUTH_AMERICA_COUNTRIES = [
  { label: '🌎 All South America', bounds: { lat: [-56, 13], lng: [-82, -34] } },
  { label: '🇦🇷 Argentina', bounds: { lat: [-55, -21], lng: [-73, -53] } },
  { label: '🇧🇴 Bolivia', bounds: { lat: [-23, -9], lng: [-69, -57] } },
  { label: '🇧🇷 Brazil', bounds: { lat: [-33, 5], lng: [-73, -35] } },
  { label: '🇨🇱 Chile', bounds: { lat: [-56, -17], lng: [-75, -66] } },
  { label: '🇨🇴 Colombia', bounds: { lat: [-4, 13], lng: [-79, -66] } },
  { label: '🇪🇨 Ecuador', bounds: { lat: [-5, 2], lng: [-81, -75] } },
  { label: '🇬🇾 Guyana', bounds: { lat: [1, 9], lng: [-61, -57] } },
  { label: '🇵🇾 Paraguay', bounds: { lat: [-27, -19], lng: [-62, -54] } },
  { label: '🇵🇪 Peru', bounds: { lat: [-18, -1], lng: [-81, -68] } },
  { label: '🇸🇷 Suriname', bounds: { lat: [2, 6], lng: [-58, -54] } },
  { label: '🇺🇾 Uruguay', bounds: { lat: [-35, -30], lng: [-58, -53] } },
  { label: '🇻🇪 Venezuela', bounds: { lat: [0, 12], lng: [-73, -59] } },
]

const ASIA_COUNTRIES = [
  { label: '🌏 All Asia', bounds: { lat: [-10, 77], lng: [26, 145] } },
  { label: '🇦🇫 Afghanistan', bounds: { lat: [29, 39], lng: [60, 75] } },
  { label: '🇧🇩 Bangladesh', bounds: { lat: [20, 27], lng: [88, 93] } },
  { label: '🇨🇳 China', bounds: { lat: [18, 54], lng: [73, 135] } },
  { label: '🇮🇳 India', bounds: { lat: [8, 37], lng: [68, 97] } },
  { label: '🇮🇩 Indonesia', bounds: { lat: [-11, 6], lng: [95, 141] } },
  { label: '🇮🇷 Iran', bounds: { lat: [25, 40], lng: [44, 64] } },
  { label: '🇮🇶 Iraq', bounds: { lat: [29, 38], lng: [38, 49] } },
  { label: '🇮🇱 Israel', bounds: { lat: [29, 33], lng: [34, 36] } },
  { label: '🇯🇵 Japan', bounds: { lat: [24, 46], lng: [122, 146] } },
  { label: '🇯🇴 Jordan', bounds: { lat: [29, 33], lng: [35, 39] } },
  { label: '🇰🇿 Kazakhstan', bounds: { lat: [41, 56], lng: [51, 88] } },
  { label: '🇰🇼 Kuwait', bounds: { lat: [28, 30], lng: [46, 49] } },
  { label: '🇱🇧 Lebanon', bounds: { lat: [33, 34], lng: [35, 37] } },
  { label: '🇲🇾 Malaysia', bounds: { lat: [1, 7], lng: [100, 119] } },
  { label: '🇳🇵 Nepal', bounds: { lat: [26, 30], lng: [80, 88] } },
  { label: '🇵🇰 Pakistan', bounds: { lat: [23, 37], lng: [60, 78] } },
  { label: '🇵🇭 Philippines', bounds: { lat: [4, 21], lng: [116, 127] } },
  { label: '🇸🇦 Saudi Arabia', bounds: { lat: [16, 32], lng: [36, 56] } },
  { label: '🇸🇬 Singapore', bounds: { lat: [1.1, 1.5], lng: [103.6, 104.1] } },
  { label: '🇰🇷 South Korea', bounds: { lat: [33, 39], lng: [124, 130] } },
  { label: '🇱🇰 Sri Lanka', bounds: { lat: [5, 10], lng: [79, 82] } },
  { label: '🇸🇾 Syria', bounds: { lat: [32, 37], lng: [35, 43] } },
  { label: '🇹🇼 Taiwan', bounds: { lat: [21, 25], lng: [120, 122] } },
  { label: '🇹🇭 Thailand', bounds: { lat: [5, 21], lng: [97, 106] } },
  { label: '🇦🇪 UAE', bounds: { lat: [22, 26], lng: [51, 56] } },
  { label: '🇺🇿 Uzbekistan', bounds: { lat: [37, 46], lng: [56, 74] } },
  { label: '🇻🇳 Vietnam', bounds: { lat: [8, 23], lng: [102, 110] } },
  { label: '🇾🇪 Yemen', bounds: { lat: [12, 19], lng: [42, 54] } },
]

const AUSTRALIA_COUNTRIES = [
  { label: '🦘 All Australia & Oceania', bounds: { lat: [-50, -8], lng: [108, 180] } },
  { label: '🇦🇺 Australia (all)', bounds: { lat: [-44, -10], lng: [113, 154] } },
  { label: '🇦🇺 New South Wales', bounds: { lat: [-37.5, -28.2], lng: [140.9, 153.6] } },
  { label: '🇦🇺 Queensland', bounds: { lat: [-29.2, -10.7], lng: [138.0, 153.6] } },
  { label: '🇦🇺 South Australia', bounds: { lat: [-38.1, -26.0], lng: [129.0, 141.0] } },
  { label: '🇦🇺 Tasmania', bounds: { lat: [-43.6, -39.6], lng: [144.6, 148.5] } },
  { label: '🇦🇺 Victoria', bounds: { lat: [-39.2, -33.9], lng: [140.9, 150.0] } },
  { label: '🇦🇺 Western Australia', bounds: { lat: [-35.1, -13.7], lng: [113.2, 129.0] } },
  { label: '🇫🇯 Fiji', bounds: { lat: [-20, -15], lng: [177, 180] } },
  { label: '🇳🇿 New Zealand', bounds: { lat: [-47, -34], lng: [166, 178] } },
  { label: '🇵🇬 Papua New Guinea', bounds: { lat: [-12, -1], lng: [141, 156] } },
]

const EUROPE_COUNTRIES = [
  { label: '🌍 All Europe', bounds: { lat: [34, 72], lng: [-25, 45] } },
  { label: '🇦🇱 Albania', bounds: { lat: [39.6, 42.7], lng: [19.3, 21.1] } },
  { label: '🇦🇹 Austria', bounds: { lat: [46.4, 49.0], lng: [9.5, 17.2] } },
  { label: '🇧🇾 Belarus', bounds: { lat: [51.3, 56.2], lng: [23.2, 32.8] } },
  { label: '🇧🇪 Belgium', bounds: { lat: [49.5, 51.5], lng: [2.5, 6.4] } },
  { label: '🇧🇦 Bosnia & Herz.', bounds: { lat: [42.6, 45.3], lng: [15.7, 19.7] } },
  { label: '🇧🇬 Bulgaria', bounds: { lat: [41.2, 44.2], lng: [22.4, 28.6] } },
  { label: '🇭🇷 Croatia', bounds: { lat: [42.4, 46.6], lng: [13.5, 19.4] } },
  { label: '🇨🇾 Cyprus', bounds: { lat: [34.6, 35.7], lng: [32.3, 34.6] } },
  { label: '🇨🇿 Czechia', bounds: { lat: [48.6, 51.1], lng: [12.1, 18.9] } },
  { label: '🇩🇰 Denmark', bounds: { lat: [54.6, 57.8], lng: [8.1, 15.2] } },
  { label: '🇪🇪 Estonia', bounds: { lat: [57.5, 59.7], lng: [21.8, 28.2] } },
  { label: '🇫🇮 Finland', bounds: { lat: [59.8, 70.1], lng: [19.1, 31.6] } },
  { label: '🇫🇷 France', bounds: { lat: [41.3, 51.1], lng: [-5.2, 9.6] } },
  { label: '🇩🇪 Germany', bounds: { lat: [47.3, 55.1], lng: [5.9, 15.0] } },
  { label: '🇬🇷 Greece', bounds: { lat: [34.8, 42.0], lng: [19.4, 29.7] } },
  { label: '🇭🇺 Hungary', bounds: { lat: [45.7, 48.6], lng: [16.1, 22.9] } },
  { label: '🇮🇸 Iceland', bounds: { lat: [63.4, 66.5], lng: [-24.5, -13.5] } },
  { label: '🇮🇪 Ireland', bounds: { lat: [51.4, 55.4], lng: [-10.5, -6.0] } },
  { label: '🇮🇹 Italy', bounds: { lat: [36.6, 47.1], lng: [6.6, 18.5] } },
  { label: '🇽🇰 Kosovo', bounds: { lat: [41.9, 43.3], lng: [20.0, 21.8] } },
  { label: '🇱🇻 Latvia', bounds: { lat: [55.7, 58.1], lng: [20.9, 28.2] } },
  { label: '🇱🇮 Liechtenstein', bounds: { lat: [47.0, 47.3], lng: [9.5, 9.6] } },
  { label: '🇱🇹 Lithuania', bounds: { lat: [53.9, 56.5], lng: [21.0, 26.8] } },
  { label: '🇱🇺 Luxembourg', bounds: { lat: [49.4, 50.2], lng: [5.7, 6.5] } },
  { label: '🇲🇹 Malta', bounds: { lat: [35.8, 36.1], lng: [14.2, 14.6] } },
  { label: '🇲🇩 Moldova', bounds: { lat: [45.5, 48.5], lng: [26.6, 30.2] } },
  { label: '🇲🇪 Montenegro', bounds: { lat: [41.9, 43.6], lng: [18.4, 20.4] } },
  { label: '🇳🇱 Netherlands', bounds: { lat: [50.8, 53.6], lng: [3.3, 7.2] } },
  { label: '🇲🇰 North Macedonia', bounds: { lat: [40.9, 42.4], lng: [20.5, 23.1] } },
  { label: '🇳🇴 Norway', bounds: { lat: [57.9, 71.2], lng: [4.6, 31.1] } },
  { label: '🇵🇱 Poland', bounds: { lat: [49.0, 54.9], lng: [14.1, 24.2] } },
  { label: '🇵🇹 Portugal', bounds: { lat: [37.0, 42.2], lng: [-9.5, -6.2] } },
  { label: '🇷🇴 Romania', bounds: { lat: [43.6, 48.3], lng: [20.3, 30.0] } },
  { label: '🇷🇸 Serbia', bounds: { lat: [42.2, 46.2], lng: [18.8, 23.0] } },
  { label: '🇸🇰 Slovakia', bounds: { lat: [47.7, 49.6], lng: [16.8, 22.6] } },
  { label: '🇸🇮 Slovenia', bounds: { lat: [45.4, 46.9], lng: [13.4, 16.6] } },
  { label: '🇪🇸 Spain', bounds: { lat: [36.0, 43.8], lng: [-9.3, 4.3] } },
  { label: '🇸🇪 Sweden', bounds: { lat: [55.3, 69.1], lng: [11.1, 24.2] } },
  { label: '🇨🇭 Switzerland', bounds: { lat: [45.8, 47.8], lng: [5.9, 10.5] } },
  { label: '🇹🇷 Turkey', bounds: { lat: [35.8, 42.1], lng: [26.0, 44.8] } },
  { label: '🇺🇦 Ukraine', bounds: { lat: [44.4, 52.4], lng: [22.1, 40.2] } },
  { label: '🇬🇧 UK', bounds: { lat: [49.9, 60.9], lng: [-8.2, 1.8] } },
]

const EMOJIS = ['😊','😂','❤️','🔥','👍','🙌','😍','🤔','😅','🥰','😭','🎉','✨','💪','🙏','😎','🤩','😇','🥳','😴','🤗','💚','🌳','🐨','🦊','🐸','🦋','🦔','🐧','🦦','🐙']

const REPORT_REASONS = [
  'Hate speech / discrimination',
  'Harassment or bullying',
  'NSFW / explicit content',
  'Spam or scam',
  'Misinformation',
  'Underage user',
  'Other',
]

const AD_BANNERS = [{ src: '/ad-banner-1.jpg', interval: 5 }] // increase to 15 once there are enough posts to test properly

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

const IDENTITY_FILTER_OPTIONS = [
  { group: 'Orientation & Gender', items: ['LGBTQ+'] },
  { group: 'Neurodivergent', items: ['ADHD', 'Autism', 'AuDHD', 'Dyslexia', 'Dyscalculia'] },
  { group: 'Mental Health', items: ['Depression', 'Anxiety', 'BPD', 'PTSD / cPTSD', 'Bipolar'] },
  { group: 'Physical', items: ['Chronic illness', 'Physical disability', 'Hearing impaired', 'Visually impaired'] },
]

function CountryDropdown({ countries, activeLabel, onSelect, onClose }) {
  return (
    <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg)', border:'0.5px solid var(--border)', borderTop:'none', zIndex:50, maxHeight:300, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.1)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
        {countries.map(c => (
          <div key={c.label} onClick={() => { onSelect(c); onClose() }}
            style={{ padding:'10px 14px', fontSize:13, cursor:'pointer', borderBottom:'0.5px solid var(--border)', color: activeLabel === c.label ? 'var(--accent)' : 'var(--text)', fontWeight: activeLabel === c.label ? 600 : 400, background: activeLabel === c.label ? 'var(--accent-light)' : 'transparent' }}>
            {c.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Feed() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [touchStartX, setTouchStartX] = useState(null)

  function handleTouchStart(e) { setTouchStartX(e.touches[0].clientX) }
  function handleTouchEnd(e) {
    if (touchStartX === null) return
    const dx = e.changedTouches[0].clientX - touchStartX
    if (dx < -80) navigate('/supporters')
    setTouchStartX(null)
  }
  const [posts, setPosts] = useState([])
  const [radius, setRadius] = useState(5)
  const [activeBounds, setActiveBounds] = useState(null)
  const [activeLabel, setActiveLabel] = useState('5 km')
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
  const [openMenu, setOpenMenu] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [identityFilters, setIdentityFilters] = useState([])
  const [showIdentityFilter, setShowIdentityFilter] = useState(false)

  function toggleIdentityFilter(tag) {
    setIdentityFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }
  const [adIndex, setAdIndex] = useState(0)
  const [canvasPreview, setCanvasPreview] = useState(null)
  const [canvasPixels, setCanvasPixels] = useState([])

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    loadCanvasPreview()
    const ch = supabase.channel('canvas-preview-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'canvas_pixels' }, loadCanvasPreview)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function loadCanvasPreview() {
    const { data: cv } = await supabase.from('canvas_current').select('*').eq('is_full', false).order('id', { ascending: false }).limit(1).maybeSingle()
    setCanvasPreview(cv)
    if (cv) {
      const { data: px } = await supabase.from('canvas_pixels').select('*').eq('canvas_id', cv.id)
      setCanvasPixels(px || [])
    }
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoc({ lat: 0, lng: 0 }); setLocDenied(true); setRadius(99999); setActiveLabel('🌍 Global')
      return
    }
    navigator.geolocation.getCurrentPosition(
      p => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocDenied(false) },
      () => { setLoc({ lat: 0, lng: 0 }); setLocDenied(true); setRadius(99999); setActiveLabel('🌍 Global') },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    if (!loc) return
    load()
    const ch = supabase.channel('posts-feed-v7')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loc, radius, activeBounds, identityFilters])

  async function load() {
    try {
      let data
      console.log('[lokali] load() called with radius=', radius, 'activeBounds=', activeBounds, 'locDenied=', locDenied, 'loc=', loc)
      if (activeBounds) {
        const b = activeBounds
        const { data: d } = await supabase.from('posts')
          .select('*, profiles!posts_user_id_fkey(username,avatar,identities,visibility), comments(id), triggered_profile:profiles!posts_triggered_by_user_id_fkey(username,avatar)')
          .gte('lat', b.lat[0]).lte('lat', b.lat[1])
          .gte('lng', b.lng[0]).lte('lng', b.lng[1])
          .order('created_at', { ascending: false }).limit(100)
        data = d
      } else if (radius === 99999 || locDenied) {
        const { data: d } = await supabase.from('posts')
          .select('*, profiles!posts_user_id_fkey(username,avatar,identities,visibility), comments(id), triggered_profile:profiles!posts_triggered_by_user_id_fkey(username,avatar)')
          .order('created_at', { ascending: false }).limit(100)
        data = d
      } else {
        const { data: d, error } = await supabase.rpc('posts_within_radius', {
          user_lat: loc.lat, user_lng: loc.lng, radius_km: radius
        })
        if (error) {
          console.error('posts_within_radius error', error)
          const { data: fallback } = await supabase.from('posts')
            .select('*, profiles!posts_user_id_fkey(username,avatar,identities,visibility), comments(id), triggered_profile:profiles!posts_triggered_by_user_id_fkey(username,avatar)')
            .order('created_at', { ascending: false }).limit(50)
          data = fallback
        } else {
          data = d
        }
      }
      let ps = data || []
      console.log('[lokali] posts before identity filter:', ps.length, 'filters:', identityFilters)
      if (identityFilters.length > 0) {
        ps = ps.filter(p => {
          if (p.is_system) return true
          const tags = p.profiles?.identities || []
          const vis = p.profiles?.visibility?.identities
          if (vis === false) return false
          return identityFilters.some(f => tags.includes(f))
        })
        console.log('[lokali] posts after identity filter:', ps.length)
      }
      const counts = {}
      ps.forEach(p => { counts[p.id] = p.comments ? p.comments.length : (p.comment_count || 0) })
      setCntData(counts)
      setPosts(ps)
    } catch (e) { console.error(e) }
  }

  function selectDistance(r) {
    if (locDenied) { showToast('Enable location to use distance filters'); return }
    setRadius(r.km); setActiveBounds(null); setActiveLabel(r.label); setOpenMenu(null)
  }

  function selectCountry(c) {
    setActiveBounds(c.bounds); setRadius(0); setActiveLabel(c.label)
  }

  function selectGlobal() {
    setRadius(99999); setActiveBounds(null); setActiveLabel('🌍 Global'); setOpenMenu(null)
  }

  async function handlePost() {
    const trimmed = text.trim()

    // Trigger: empty message
    if (!trimmed) {
      await createSystemPost(`${profile?.username} has nothing to say 🤷`, user.id)
      setText('')
      return
    }

    // Trigger: way too long (book)
    if (text.length > 1000) {
      await createSystemPost(`${profile?.username} is writing a book 📖`, user.id)
      setText(''); showToast("That's a lot of words! Maybe keep it under 500 characters next time 😄")
      return
    }
    if (text.length > 500) { showToast('Your post is too long – please shorten it to 500 characters.'); return }

    // Trigger: no spaces, very long single "word"
    const hasNoSpaces = !trimmed.includes(' ') && trimmed.length > 60
    if (hasNoSpaces) {
      await createSystemPost(`${profile?.username} is on an infinite road 🛣️`, user.id)
      setText('')
      return
    }

    setSending(true)
    try {
      const hasRealLoc = loc && !locDenied && loc.lat !== 0 && loc.lng !== 0
      await createPost(user.id, trimmed,
        hasRealLoc ? loc.lat : null,
        hasRealLoc ? loc.lng : null)
      try { await supabase.rpc('grant_post_credit', { p_user_id: user.id }) } catch {}
      setText(''); showToast('Post published! ✓')

      // Trigger: pixel milestone (100+)
      const { data: creditRow } = await supabase.from('pixel_credits').select('credits').eq('user_id', user.id).maybeSingle()
      if ((creditRow?.credits || 0) >= 100) {
        const { data: alreadyAnnounced } = await supabase.from('posts').select('id').eq('is_system', true).ilike('text', `%${profile?.username} is pixelated%`).limit(1)
        if (!alreadyAnnounced || alreadyAnnounced.length === 0) {
          await createSystemPost(`${profile?.username} is pixelated 🟦`, user.id)
        }
      }

      // Trigger: 0.5% unicorn summon
      if (Math.random() < 0.005) {
        await supabase.rpc('summon_unicorn', { p_user_id: user.id }).catch(() => {})
        await createSystemPost(`${profile?.username} summoned Cornelius the unicorn 🦄`, user.id)
      }

      load()
    } catch (e) { showToast(e.message) }
    finally { setSending(false) }
  }

  async function createSystemPost(message, triggeredByUserId) {
    try {
      const hasRealLoc = loc && !locDenied && loc.lat !== 0 && loc.lng !== 0
      await supabase.from('posts').insert({
        user_id: null,
        text: message,
        is_system: true,
        triggered_by_user_id: triggeredByUserId || null,
        lat: hasRealLoc ? loc.lat : null,
        lng: hasRealLoc ? loc.lng : null,
      })
      load()
    } catch (e) { console.error(e) }
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

  async function submitReport() {
    if (!reportReason) { showToast('Please select a reason'); return }
    await supabase.from('reports').insert({ post_id: reportTarget.id, reporter_id: user.id, reason: reportReason })
    setReportTarget(null); setReportReason('')
    showToast('Reported – thank you! We will review this. ✓')
  }

  const menuBtn = (label, menuKey, countries) => {
    const isActive = openMenu === menuKey || countries.some(c => c.label === activeLabel)
    return (
      <div className={`radius-chip ${isActive ? 'active' : ''}`}
        onClick={() => setOpenMenu(openMenu === menuKey ? null : menuKey)}
        style={{ whiteSpace:'nowrap' }}>
        {label} {openMenu === menuKey ? '▴' : '▾'}
      </div>
    )
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {locDenied && (
        <div style={{ background:'#fff8e1', borderBottom:'0.5px solid #ffe082', padding:'10px 20px', fontSize:13, color:'#7a5c00', lineHeight:1.5 }}>
          📍 Location access denied – showing <strong>Global</strong> posts. Enable location in your browser to see local posts.
        </div>
      )}
      <div style={{ padding:'6px 20px 2px', fontSize:11, color:'var(--text3)', fontStyle:'italic', textAlign:'center' }}>
        from online back to real life 🌳
      </div>

      <div style={{ position:'relative' }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center', borderBottom:'0.5px solid var(--border)' }}>
          <button onClick={() => document.getElementById('radius-scroll').scrollBy({ left: -120, behavior: 'smooth' })}
            style={{ position:'absolute', left:0, zIndex:5, background:'linear-gradient(to right, var(--bg) 60%, transparent)', border:'none', cursor:'pointer', fontSize:18, padding:'12px 8px', color:'var(--text2)' }}>‹</button>
          <div id="radius-scroll" className="radius-bar" style={{ borderBottom:'none', paddingLeft:32, paddingRight:32 }}>
            {DISTANCE_RADII.map(r => (
              <div key={r.km} className={`radius-chip ${activeLabel === r.label ? 'active' : ''}`}
                onClick={() => selectDistance(r)}>{r.label}</div>
            ))}
            {menuBtn('🌍 Africa', 'africa', AFRICA_COUNTRIES)}
            {menuBtn('🌎 North America', 'northamerica', NORTH_AMERICA_COUNTRIES)}
            {menuBtn('🌏 Asia', 'asia', ASIA_COUNTRIES)}
            {menuBtn('🦘 Australia & Oceania', 'australia', AUSTRALIA_COUNTRIES)}
            {menuBtn('🌍 Europe', 'europe', EUROPE_COUNTRIES)}
            {menuBtn('🌎 South America', 'southamerica', SOUTH_AMERICA_COUNTRIES)}
            <div className={`radius-chip ${activeLabel === '🌍 Global' ? 'active' : ''}`}
              onClick={selectGlobal}>🌍 Global</div>
          </div>
          <button onClick={() => document.getElementById('radius-scroll').scrollBy({ left: 120, behavior: 'smooth' })}
            style={{ position:'absolute', right:0, zIndex:5, background:'linear-gradient(to left, var(--bg) 60%, transparent)', border:'none', cursor:'pointer', fontSize:18, padding:'12px 8px', color:'var(--text2)' }}>›</button>
        </div>

        {openMenu === 'africa' && <CountryDropdown countries={AFRICA_COUNTRIES} activeLabel={activeLabel} onSelect={selectCountry} onClose={() => setOpenMenu(null)} />}
        {openMenu === 'northamerica' && <CountryDropdown countries={NORTH_AMERICA_COUNTRIES} activeLabel={activeLabel} onSelect={selectCountry} onClose={() => setOpenMenu(null)} />}
        {openMenu === 'asia' && <CountryDropdown countries={ASIA_COUNTRIES} activeLabel={activeLabel} onSelect={selectCountry} onClose={() => setOpenMenu(null)} />}
        {openMenu === 'australia' && <CountryDropdown countries={AUSTRALIA_COUNTRIES} activeLabel={activeLabel} onSelect={selectCountry} onClose={() => setOpenMenu(null)} />}
        {openMenu === 'europe' && <CountryDropdown countries={EUROPE_COUNTRIES} activeLabel={activeLabel} onSelect={selectCountry} onClose={() => setOpenMenu(null)} />}
        {openMenu === 'southamerica' && <CountryDropdown countries={SOUTH_AMERICA_COUNTRIES} activeLabel={activeLabel} onSelect={selectCountry} onClose={() => setOpenMenu(null)} />}
      </div>

      <div style={{ borderBottom:'0.5px solid var(--border)', position:'relative' }}>
        <div onClick={() => setShowIdentityFilter(s => !s)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 20px', cursor:'pointer' }}>
          <span style={{ fontSize:12, fontWeight:600, color: identityFilters.length > 0 ? 'var(--accent)' : 'var(--text2)' }}>
            🏷️ Community filter {identityFilters.length > 0 ? `(${identityFilters.length})` : ''}
          </span>
          <span style={{ fontSize:11, color:'var(--text3)' }}>{showIdentityFilter ? '▴' : '▾'}</span>
          {identityFilters.length > 0 && (
            <span onClick={e => { e.stopPropagation(); setIdentityFilters([]) }}
              style={{ fontSize:11, color:'var(--accent)', marginLeft:'auto', textDecoration:'underline' }}>
              Clear
            </span>
          )}
        </div>
        {showIdentityFilter && (
          <div style={{ padding:'0 20px 14px' }}>
            {IDENTITY_FILTER_OPTIONS.map(group => (
              <div key={group.group} style={{ marginTop:8 }}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{group.group}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {group.items.map(tag => (
                    <div key={tag} onClick={() => toggleIdentityFilter(tag)}
                      style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:'0.5px solid', borderColor: identityFilters.includes(tag) ? 'var(--accent)' : 'var(--border)', background: identityFilters.includes(tag) ? 'var(--accent-light)' : 'var(--bg2)', color: identityFilters.includes(tag) ? 'var(--accent)' : 'var(--text2)' }}>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="compose-bar">
        <div className="avatar">{profile?.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ position:'relative' }}>
            <textarea className="compose-input" placeholder="What's happening near you?"
              value={text} onChange={e => setText(e.target.value)}
              onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
              onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); handlePost() } }}
              style={{ width:'100%', paddingRight:40 }} />
            <button onClick={() => setShowEmoji(s => !s)}
              style={{ position:'absolute', right:8, bottom:10, background:'none', border:'none', fontSize:18, cursor:'pointer', opacity:0.6 }}>😊</button>
            {showEmoji && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:4, background:'var(--bg)', border:'0.5px solid var(--border)', borderRadius:12, padding:10, display:'flex', flexWrap:'wrap', gap:4, zIndex:50, boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }}>
                {EMOJIS.map(e => (
                  <span key={e} onClick={() => { setText(t => t + e); setShowEmoji(false) }}
                    style={{ fontSize:22, cursor:'pointer', padding:3, borderRadius:6 }}>{e}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize:11, color: text.length > 500 ? '#cc3333' : 'var(--text3)', textAlign:'right', marginTop:4 }}>
            {text.length} / 500
          </div>
        </div>
        <button className="send-btn" onClick={handlePost} disabled={sending}>↑</button>
      </div>

      <div className="post-card" onClick={() => navigate('/canvas')} style={{ cursor:'pointer' }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
          🎨 Community Canvas
          <span style={{ fontSize:11, color:'var(--accent)', marginLeft:'auto' }}>Tap to paint →</span>
        </div>
        <div style={{ width:'100%', overflowX:'auto' }}>
          <div style={{
            display:'grid',
            gridTemplateColumns: `repeat(${canvasPreview?.width || 48}, minmax(0,1fr))`,
            gridTemplateRows: `repeat(${canvasPreview?.height || 24}, 1fr)`,
            width:'100%', aspectRatio: `${canvasPreview?.width || 48} / ${canvasPreview?.height || 24}`,
            border:'1px solid var(--border)', borderRadius:8, background:'var(--bg2)', overflow:'hidden',
          }}>
            {Array.from({ length: (canvasPreview?.height || 24) }).map((_, y) =>
              Array.from({ length: (canvasPreview?.width || 48) }).map((_, x) => {
                const px = canvasPixels.find(p => p.x === x && p.y === y)
                return <div key={`${x}-${y}`} style={{ background: px ? px.color : 'transparent' }} />
              })
            )}
          </div>
        </div>
      </div>

      {posts.length === 0
        ? <div className="empty-state">No posts in this area yet.<br />Be the first! ✍️</div>
        : posts.map((post, idx) => {
          const isOwn = post.user_id === user.id
          const isSystem = post.is_system
          const cmts = cmtsData[post.id] || []
          const cntDisplay = cntData[post.id] ?? 0
          const ad = AD_BANNERS[0]
          const showAdBefore = ad && idx > 0 && idx % ad.interval === 0
          return (
            <div key={post.id}>
              {showAdBefore && (
                <div style={{ padding:'10px 20px', borderBottom:'0.5px solid var(--border)' }}>
                  <img src={ad.src} alt="Advertisement" style={{ width:'100%', borderRadius:12, display:'block' }} />
                  <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center', marginTop:4, letterSpacing:'0.5px' }}>Advertisement</div>
                </div>
              )}
            <div className="post-card" style={isSystem ? { background:'var(--accent-light)' } : undefined}>
              <div className="post-header">
                <div className="avatar" style={{ cursor: isSystem ? 'default' : 'pointer' }}
                  onClick={() => !isSystem && navigate(`/profile/${post.user_id}`)}>
                  {isSystem ? '🌳' : (post.profiles?.avatar || '🌳')}
                </div>
                <div className="post-meta">
                  <div className="post-username" style={isSystem ? { fontFamily:'Caveat, cursive', color:'var(--accent)', fontSize:18, fontWeight:700 } : undefined}>
                    {isSystem ? 'lokali' : (post.profiles?.username || 'Unknown')}
                    {isOwn && !isSystem && <span style={{ fontSize:11, color:'var(--accent)', marginLeft:6 }}>(you)</span>}
                  </div>
                  <div className="post-time">{timeAgo(post.created_at)}</div>
                </div>
                {post.distance_m != null && <div className="dist-badge">{fmtDist(post.distance_m)}</div>}
              </div>
              <div className="post-text">
                {isSystem && post.triggered_profile?.username ? (
                  <>
                    <span onClick={() => navigate(`/profile/${post.triggered_by_user_id}`)} style={{ color:'var(--accent)', fontWeight:600, cursor:'pointer' }}>
                      {post.triggered_profile.username}
                    </span>
                    {post.text.slice(post.triggered_profile.username.length)}
                  </>
                ) : post.text}
              </div>
              {!isSystem && (
              <div className="post-actions">
                <button className="action-btn" onClick={() => toggleCmts(post.id)}>
                  💬 {openCmts[post.id] ? cmts.length : cntDisplay}
                </button>
                {!isOwn && <button className="action-btn" onClick={() => navigate(`/chats/${post.user_id}`)}>✉ Message</button>}
                {!isOwn && <button className="action-btn report" onClick={() => { setReportTarget({ id: post.id, username: post.profiles?.username }); setReportReason('') }}>⚑ Report</button>}
                {isOwn && (
                  <button className="action-btn report" onClick={async () => {
                    if (!window.confirm('Delete this post?')) return
                    await supabase.from('posts').delete().eq('id', post.id)
                    showToast('Post deleted.')
                    load()
                  }}>🗑 Delete</button>
                )}
              </div>
              )}
              {!isSystem && openCmts[post.id] && (
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
                      onChange={e => setCmtText(p => ({ ...p, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key==='Enter' && submitCmt(post.id)} />
                    <button onClick={() => submitCmt(post.id)}>Send</button>
                  </div>
                </div>
              )}
            </div>
            </div>
          )
        })
      }

      {reportTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg)', borderRadius:16, padding:24, maxWidth:360, width:'100%' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>⚑ Report post</div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:16 }}>by @{reportTarget.username}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {REPORT_REASONS.map(r => (
                <div key={r} onClick={() => setReportReason(r)}
                  style={{ padding:'10px 14px', borderRadius:10, fontSize:13, cursor:'pointer', border:'0.5px solid', borderColor: reportReason === r ? 'var(--accent)' : 'var(--border)', background: reportReason === r ? 'var(--accent-light)' : 'var(--bg2)', color: reportReason === r ? 'var(--accent)' : 'var(--text2)', fontWeight: reportReason === r ? 600 : 400 }}>
                  {r}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setReportTarget(null)}
                style={{ flex:1, padding:10, background:'var(--bg2)', border:'0.5px solid var(--border)', borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Cancel</button>
              <button onClick={submitReport}
                style={{ flex:1, padding:10, background:'var(--accent)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
