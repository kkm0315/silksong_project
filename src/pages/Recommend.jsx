import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import hk from '../data/hk_regions.json'
import ss from '../data/silksong_regions.json'
import { getAudioFeatures, getRecommendations, searchTrack } from '../lib/spotify.jsx'
import { useSpotify } from '../lib/spotify.jsx'

export default function Recommend(){
  const loc = useLocation()
  const params = new URLSearchParams(loc.search)
  const game = params.get('game')
  const id = params.get('id')
  const region = useMemo(()=> (game==='HK'? hk:ss).regions.find(r=>r.id===id), [game, id])
  const [seed, setSeed] = useState('')
  const [tracks, setTracks] = useState([])
  const [filters, setFilters] = useState({ energy: 0.5, valence: 0.5, danceability: 0.5 })
  const { play } = useSpotify()

  useEffect(()=>{
    (async()=>{
      const candidates = await searchTrack(`${region.ost} Christopher Larkin`)
      if(candidates.length){
        const t = candidates[0]
        setSeed(t.id)
        const [feat] = await getAudioFeatures([t.id])
        const recs = await getRecommendations({
          seed_tracks: t.id,
          target_energy: (feat && feat.energy) ?? 0.5,
          target_valence: (feat && feat.valence) ?? 0.5,
          target_danceability: (feat && feat.danceability) ?? 0.5,
          limit: 24,
        })
        setTracks(recs)
      }
    })()
  }, [region])

  async function applyFilters(){
    if(!seed) return
    const recs = await getRecommendations({ seed_tracks: seed, ...filters, limit: 24 })
    setTracks(recs)
  }

  if(!region) return <p>잘못된 구역입니다.</p>

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">{game==='HK'?'할로우나이트':'실크송'} · {region.label}</h2>
      <p className="text-sm text-neutral-300 mb-4">OST: {region.ost} · 힌트: {region.hint || '—'}</p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <Knob label="Energy" value={filters.energy} onChange={v=>setFilters(f=>({...f, energy:v}))}/>
        <Knob label="Valence" value={filters.valence} onChange={v=>setFilters(f=>({...f, valence:v}))}/>
        <Knob label="Danceability" value={filters.danceability} onChange={v=>setFilters(f=>({...f, danceability:v}))}/>
      </div>
      <button onClick={applyFilters} className="mb-6 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">필터 적용</button>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map(t => (
          <div key={t.id} className="bg-neutral-800 rounded-2xl overflow-hidden">
            <img src={t.album.images?.[0]?.url} alt="cover" className="w-full aspect-square object-cover"/>
            <div className="p-3">
              <div className="font-medium">{t.name}</div>
              <div className="text-sm text-neutral-400">{t.artists.map(a=>a.name).join(', ')}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={()=>play(t.uri)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm">재생</button>
                <AddToPlaylistButton uri={t.uri} />
                <a className="px-3 py-1.5 rounded-lg bg-neutral-700 text-sm" href={`https://open.spotify.com/track/${t.id}`} target="_blank">열기</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Knob({label, value, onChange}){
  return (
    <div className="p-3 bg-neutral-800 rounded-2xl">
      <div className="mb-2 text-sm text-neutral-300">{label}: {value.toFixed(2)}</div>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={e=>onChange(parseFloat(e.target.value))} className="w-full"/>
    </div>
  )
}

function AddToPlaylistButton({uri}){
  const [adding, setAdding] = useState(false)
  async function add(){
    setAdding(true)
    const { ensurePlaylist, addTracksToPlaylist } = await import('../lib/spotify.jsx')
    const id = await ensurePlaylist('HK×Silksong 추천 모음')
    await addTracksToPlaylist(id, [uri])
    setAdding(false)
    alert('플레이리스트에 추가되었습니다!')
  }
  return <button onClick={add} disabled={adding} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm">{adding?'추가 중...':'플레이리스트 추가'}</button>
}