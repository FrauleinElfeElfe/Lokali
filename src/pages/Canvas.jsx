import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const COLORS = [
  '#FFFFFF','#E4E4E4','#888888','#222222','#000000',
  '#FFA7D1','#E50000','#E59500','#A06A42','#E5D900',
  '#94E044','#02BE01','#00D3DD','#0083C7','#0000EA',
  '#CF6EE4','#820080','#FF6A00','#FF0000','#FFD700',
  '#7CFC00','#00CED1','#1E90FF','#9400D3','#FF1493',
  '#8B4513','#2F4F4F','#FF69B4','#00FF7F','#FFFACD',
]
const QUICK_COLORS = COLORS

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase()
}

function hexToHsl(hex) {
  let r = 0, g = 0, b = 0
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  if (hex.length !== 6) return null
  r = parseInt(hex.slice(0, 2), 16) / 255
  g = parseInt(hex.slice(2, 4), 16) / 255
  b = parseInt(hex.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export default function Canvas() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [credits, setCredits] = useState(0)
  const [currentCanvas, setCurrentCanvas] = useState(null)
  const [pixels, setPixels] = useState([])
  const [archive, setArchive] = useState([])
  const [selectedXY, setSelectedXY] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [hue, setHue] = useState(0)
  const [sat, setSat] = useState(100)
  const [light, setLight] = useState(50)
  const [pickerColor, setPickerColorRaw] = useState('#FF0000')

  function setPickerColor(hex) {
    setPickerColorRaw(hex.toUpperCase())
    const hsl = hexToHsl(hex)
    if (hsl) { setHue(hsl.h); setSat(hsl.s); setLight(hsl.l) }
  }

  useEffect(() => {
    setPickerColorRaw(hslToHex(hue, sat, light))
  }, [hue, sat, light])

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    loadAll()
    const ch = supabase.channel('canvas-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'canvas_pixels' }, () => loadCurrentCanvas())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function loadAll() {
    setLoading(true)
    await loadCredits()
    await loadCurrentCanvas()
    await loadArchive()
    setLoading(false)
  }

  async function loadCredits() {
    const { data } = await supabase.from('pixel_credits').select('*').eq('user_id', user.id).maybeSingle()
    setCredits(data?.credits ?? 0)
  }

  async function loadCurrentCanvas() {
    const { data: cv } = await supabase.from('canvas_current').select('*').eq('is_full', false).order('id', { ascending: false }).limit(1).maybeSingle()
    setCurrentCanvas(cv)
    if (cv) {
      const { data: px } = await supabase.from('canvas_pixels').select('*').eq('canvas_id', cv.id)
      setPixels(px || [])
    }
  }

  async function loadArchive() {
    const { data: archives } = await supabase.from('canvas_archive').select('*').order('sequence_number', { ascending: false }).limit(15)
    if (!archives) { setArchive([]); return }
    const full = await Promise.all(archives.map(async a => {
      const { data: cv } = await supabase.from('canvas_current').select('*').eq('id', a.canvas_id).single()
      const { data: px } = await supabase.from('canvas_pixels').select('*').eq('canvas_id', a.canvas_id)
      return { ...a, canvas: cv, pixels: px || [] }
    }))
    setArchive(full)
  }

  function getPixel(x, y) {
    return pixels.find(p => p.x === x && p.y === y)
  }

  function handleCellClick(x, y) {
    const existing = getPixel(x, y)
    if (existing) {
      const isMine = existing.user_id === user.id
      const age = Date.now() - new Date(existing.placed_at)
      if (isMine && age < 10 * 60 * 1000) {
        setSelectedXY({ x, y, isNew: false, pixelId: existing.id })
        setPickerColor(existing.color)
      } else {
        showToast(isMine ? 'This pixel is sealed.' : 'Already claimed by someone else.')
        setSelectedXY(null)
      }
      return
    }
    if (credits < 1) {
      showToast('No pixel credits left. Come back tomorrow! 🌳')
      return
    }
    setSelectedXY({ x, y, isNew: true })
  }

  async function handleColorPick(color) {
    if (!selectedXY) return
    if (selectedXY.isNew) {
      const { data, error } = await supabase.rpc('place_pixel', {
        p_user_id: user.id, p_x: selectedXY.x, p_y: selectedXY.y,
        p_color: color, p_username: profile?.username
      })
      if (error || !data?.success) {
        showToast(data?.error || error?.message || 'Error placing pixel')
        return
      }
      setSelectedXY(null)
      await loadCredits()
      await loadCurrentCanvas()
      showToast('Pixel placed! Keep going 🎨')
    } else {
      const { data, error } = await supabase.rpc('update_pixel', {
        p_user_id: user.id, p_pixel_id: selectedXY.pixelId, p_color: color
      })
      if (error || !data?.success) {
        showToast(data?.error || error?.message || 'Error updating pixel')
        return
      }
      await loadCurrentCanvas()
    }
  }

  const baseSize = 9
  const cellSize = baseSize * zoom

  if (loading) return <div className="empty-state">Loading canvas... 🎨</div>

  return (
    <div style={{ padding: '0 0 100px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'0.5px solid var(--border)', position:'sticky', top:0, background:'var(--bg)', zIndex:10 }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text2)' }}>←</button>
        <div style={{ fontWeight:600, fontSize:15, flex:1 }}>🎨 Community Canvas</div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', background:'var(--accent-light)', padding:'4px 10px', borderRadius:20 }}>
          {credits} 🟦
        </div>
      </div>

      <div style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>
            {pixels.length} / {(currentCanvas?.width || 48) * (currentCanvas?.height || 24)} pixels filled
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} style={{ width:28, height:28, borderRadius:6, border:'0.5px solid var(--border)', background:'var(--bg2)', cursor:'pointer', fontSize:14 }}>−</button>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.5))} style={{ width:28, height:28, borderRadius:6, border:'0.5px solid var(--border)', background:'var(--bg2)', cursor:'pointer', fontSize:14 }}>+</button>
          </div>
        </div>

        <div style={{ overflowX:'auto', paddingBottom:8, border:'2px solid var(--border)', borderRadius:8 }}>
          <div style={{
            display:'grid',
            gridTemplateColumns: `repeat(${currentCanvas?.width || 48}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${currentCanvas?.height || 24}, ${cellSize}px)`,
            width:'fit-content',
          }}>
            {Array.from({ length: (currentCanvas?.height || 24) }).map((_, y) =>
              Array.from({ length: (currentCanvas?.width || 48) }).map((_, x) => {
                const px = getPixel(x, y)
                const isSelected = selectedXY?.x === x && selectedXY?.y === y
                return (
                  <div key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    style={{
                      width: cellSize, height: cellSize,
                      background: px ? px.color : 'var(--bg2)',
                      outline: isSelected ? '2px solid var(--accent)' : 'none',
                      outlineOffset: -1,
                      border: '0.5px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                    title={px ? `@${px.username}` : 'Empty'}
                  />
                )
              })
            )}
          </div>
        </div>

        <div style={{
          marginTop: 14,
          opacity: selectedXY ? 1 : 0.35,
          pointerEvents: selectedXY ? 'auto' : 'none',
          transition: 'opacity 0.2s'
        }}>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10 }}>
            {selectedXY ? `Pick a color for pixel (${selectedXY.x}, ${selectedXY.y})` : 'Tap an empty pixel to start painting'}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:48, height:48, borderRadius:10, background: pickerColor, border:'1px solid var(--border)', flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Hex code</div>
              <input value={pickerColor} onChange={e => setPickerColor(e.target.value)}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'0.5px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontFamily:'monospace', fontSize:14 }} />
            </div>
          </div>

          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:4 }}>
              <span>Hue</span><span>{hue}°</span>
            </div>
            <input type="range" min="0" max="359" value={hue}
              onChange={e => setHue(Number(e.target.value))}
              style={{ width:'100%', height:14, borderRadius:8, background:'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)', WebkitAppearance:'none', outline:'none' }} />
          </div>

          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:4 }}>
              <span>Saturation</span><span>{sat}%</span>
            </div>
            <input type="range" min="0" max="100" value={sat}
              onChange={e => setSat(Number(e.target.value))}
              style={{ width:'100%', height:14, borderRadius:8, background:`linear-gradient(to right, hsl(${hue},0%,${light}%), hsl(${hue},100%,${light}%))`, WebkitAppearance:'none', outline:'none' }} />
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:4 }}>
              <span>Lightness</span><span>{light}%</span>
            </div>
            <input type="range" min="0" max="100" value={light}
              onChange={e => setLight(Number(e.target.value))}
              style={{ width:'100%', height:14, borderRadius:8, background:`linear-gradient(to right, #000, hsl(${hue},${sat}%,50%), #fff)`, WebkitAppearance:'none', outline:'none' }} />
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:14 }}>
            {QUICK_COLORS.map(c => (
              <div key={c} onClick={() => setPickerColor(c)}
                style={{ width:22, height:22, background:c, borderRadius:5, cursor:'pointer', border: pickerColor.toLowerCase() === c.toLowerCase() ? '2px solid var(--accent)' : '1px solid var(--border)' }} />
            ))}
          </div>

          <button onClick={() => handleColorPick(pickerColor)} disabled={!selectedXY}
            style={{ width:'100%', padding:12, background:'var(--accent)', color:'white', border:'none', borderRadius:10, cursor: selectedXY ? 'pointer' : 'default', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>
            {selectedXY?.isNew ? 'Place pixel' : 'Update pixel'}
          </button>
        </div>

        <div style={{ marginTop:36, fontSize:14, fontWeight:700, color:'var(--text)' }}>Completed canvases 🖼️</div>
        {archive.length === 0 && (
          <div style={{ fontSize:13, color:'var(--text3)', padding:'16px 0' }}>No completed canvases yet. Keep painting! 🎨</div>
        )}
        {archive.map(a => (
          <div key={a.id} style={{ marginTop:16 }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>
              {new Date(a.completed_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
            </div>
            <div style={{ overflowX:'auto' }}>
              <div style={{
                display:'grid',
                gridTemplateColumns: `repeat(${a.canvas?.width || 48}, 6px)`,
                gridTemplateRows: `repeat(${a.canvas?.height || 24}, 6px)`,
                border:'1px solid var(--border)', width:'fit-content', borderRadius:4,
              }}>
                {Array.from({ length: (a.canvas?.height || 24) }).map((_, y) =>
                  Array.from({ length: (a.canvas?.width || 48) }).map((_, x) => {
                    const px = a.pixels.find(p => p.x === x && p.y === y)
                    return <div key={`${x}-${y}`} style={{ width:6, height:6, background: px ? px.color : 'var(--bg2)' }} />
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
