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
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>
            {selectedXY ? `Pick a color for pixel (${selectedXY.x}, ${selectedXY.y})` : 'Tap an empty pixel to start painting'}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => handleColorPick(c)}
                style={{ width:32, height:32, background:c, borderRadius:8, cursor: selectedXY ? 'pointer' : 'default', border:'1px solid var(--border)' }} />
            ))}
          </div>
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
