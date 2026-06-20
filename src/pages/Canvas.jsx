import { useState, useEffect, useRef } from 'react'
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
  const [selectedColor, setSelectedColor] = useState('#E50000')
  const [selectedPixel, setSelectedPixel] = useState(null)
  const [myRecentPixel, setMyRecentPixel] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const cellSize = 16

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    loadAll()
    const ch = supabase.channel('canvas-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'canvas_pixels' }, loadCurrentPixels)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadCredits(), loadCurrentCanvas(), loadArchive()])
    setLoading(false)
  }

  async function loadCredits() {
    const { data } = await supabase.from('pixel_credits').select('*').eq('user_id', user.id).maybeSingle()
    setCredits(data?.credits || 0)
  }

  async function loadCurrentCanvas() {
    const { data } = await supabase.from('canvas_current').select('*').eq('is_full', false).order('id', { ascending: false }).limit(1).maybeSingle()
    setCurrentCanvas(data)
    if (data) await loadCurrentPixels(data.id)
  }

  async function loadCurrentPixels(canvasIdOrPayload) {
    const canvasId = typeof canvasIdOrPayload === 'object' ? currentCanvas?.id : canvasIdOrPayload
    if (!canvasId) return
    const { data } = await supabase.from('canvas_pixels').select('*').eq('canvas_id', canvasId)
    setPixels(data || [])
    const mine = (data || []).find(p => p.user_id === user.id && !p.sealed && (Date.now() - new Date(p.placed_at)) < 10 * 60 * 1000)
    if (mine) setMyRecentPixel(mine)
  }

  async function loadArchive() {
    const { data } = await supabase
      .from('canvas_archive')
      .select('*, canvas_current(id, width, height), canvas_pixels:canvas_current(canvas_pixels(*))')
      .order('sequence_number', { ascending: false })
      .limit(10)
    // Simpler approach: fetch separately
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

  async function handleCellClick(x, y) {
    const existing = getPixel(x, y)
    if (existing) {
      if (existing.user_id === user.id && !existing.sealed) {
        const age = Date.now() - new Date(existing.placed_at)
        if (age < 10 * 60 * 1000) {
          setSelectedPixel(existing)
          setSelectedColor(existing.color)
        } else {
          showToast('This pixel is already sealed.')
        }
      } else {
        showToast('This pixel is already claimed.')
      }
      return
    }
    if (myRecentPixel) {
      showToast('Wait until your current pixel is sealed, or edit it below.')
      return
    }
    if (credits < 1) {
      showToast('No pixel credits left. Come back tomorrow! 🌳')
      return
    }
    setSelectedPixel({ x, y, isNew: true })
  }

  async function confirmPlace() {
    if (!selectedPixel) return
    if (selectedPixel.isNew) {
      const { data, error } = await supabase.rpc('place_pixel', {
        p_user_id: user.id, p_x: selectedPixel.x, p_y: selectedPixel.y,
        p_color: selectedColor, p_username: profile?.username
      })
      if (error || !data?.success) {
        showToast(data?.error || 'Error placing pixel'); return
      }
      showToast('Pixel placed! You can edit it for 10 minutes. 🎨')
      await loadCredits()
      await loadCurrentCanvas()
    } else {
      const { data, error } = await supabase.rpc('update_pixel', {
        p_user_id: user.id, p_pixel_id: selectedPixel.id, p_color: selectedColor
      })
      if (error || !data?.success) {
        showToast(data?.error || 'Error updating pixel'); return
      }
      showToast('Pixel updated!')
      await loadCurrentCanvas()
    }
    setSelectedPixel(null)
  }

  if (loading) return <div className="empty-state">Loading canvas... 🎨</div>

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'0.5px solid var(--border)', position:'sticky', top:0, background:'var(--bg)', zIndex:10 }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text2)' }}>←</button>
        <div style={{ fontWeight:600, fontSize:15 }}>🎨 Community Canvas</div>
      </div>

      <div style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Your pixel credits</div>
            <div style={{ fontSize:24, fontWeight:700, color:'var(--accent)' }}>{credits} 🟦</div>
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', textAlign:'right', maxWidth:160, lineHeight:1.5 }}>
            +5 for visiting today<br />+5 for posting today
          </div>
        </div>

        <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:'var(--text2)' }}>Current canvas</div>
        <div style={{ overflowX:'auto', paddingBottom:8 }}>
          <div style={{
            display:'grid',
            gridTemplateColumns: `repeat(${currentCanvas?.width || 32}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${currentCanvas?.height || 16}, ${cellSize}px)`,
            border:'2px solid var(--border)', width:'fit-content', borderRadius:6, overflow:'hidden'
          }}>
            {Array.from({ length: (currentCanvas?.height || 16) }).map((_, y) =>
              Array.from({ length: (currentCanvas?.width || 32) }).map((_, x) => {
                const px = getPixel(x, y)
                return (
                  <div key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    style={{
                      width: cellSize, height: cellSize,
                      background: px ? px.color : 'var(--bg2)',
                      border: '0.5px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer',
                    }}
                    title={px ? `by @${px.username}` : 'Empty'}
                  />
                )
              })
            )}
          </div>
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>
          {pixels.length} / {(currentCanvas?.width || 32) * (currentCanvas?.height || 16)} pixels filled
        </div>

        {selectedPixel && (
          <div style={{ marginTop:16, padding:16, background:'var(--bg2)', borderRadius:12 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>
              {selectedPixel.isNew ? 'Place a pixel' : 'Edit your pixel'} ({selectedPixel.x}, {selectedPixel.y})
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setSelectedColor(c)}
                  style={{ width:28, height:28, background:c, borderRadius:6, cursor:'pointer', border: selectedColor === c ? '3px solid var(--accent)' : '1px solid var(--border)' }} />
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setSelectedPixel(null)}
                style={{ flex:1, padding:10, background:'transparent', border:'0.5px solid var(--border)', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                Cancel
              </button>
              <button onClick={confirmPlace}
                style={{ flex:1, padding:10, background:'var(--accent)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>
                {selectedPixel.isNew ? 'Place pixel' : 'Update color'}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop:32, fontSize:13, fontWeight:600, color:'var(--text2)' }}>Completed canvases ⬇ (newest first)</div>
        <p style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>Scroll down to see older, completed artworks from the community.</p>

        {archive.length === 0 && (
          <div style={{ fontSize:13, color:'var(--text3)', padding:'20px 0' }}>No completed canvases yet. Keep painting! 🎨</div>
        )}

        {archive.map(a => (
          <div key={a.id} style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>
              Completed {new Date(a.completed_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
            </div>
            <div style={{ overflowX:'auto' }}>
              <div style={{
                display:'grid',
                gridTemplateColumns: `repeat(${a.canvas?.width || 32}, 8px)`,
                gridTemplateRows: `repeat(${a.canvas?.height || 16}, 8px)`,
                border:'1px solid var(--border)', width:'fit-content', borderRadius:4, overflow:'hidden'
              }}>
                {Array.from({ length: (a.canvas?.height || 16) }).map((_, y) =>
                  Array.from({ length: (a.canvas?.width || 32) }).map((_, x) => {
                    const px = a.pixels.find(p => p.x === x && p.y === y)
                    return <div key={`${x}-${y}`} style={{ width:8, height:8, background: px ? px.color : 'var(--bg2)' }} />
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
