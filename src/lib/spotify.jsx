import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getAccessToken, refresh } from './auth.js'

async function api(path, init){
  let token = getAccessToken()
  if(!token){ token = await refresh() }
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers||{}) }
  })
  if(res.status === 401){
    await refresh()
    return api(path, init)
  }
  return res
}

export async function searchTrack(q){
  const r = await api(`/search?type=track&limit=10&q=${encodeURIComponent(q)}`)
  const j = await r.json()
  return j.tracks.items
}

export async function getAudioFeatures(trackIds){
  const r = await api(`/audio-features?ids=${trackIds.join(',')}`)
  const j = await r.json()
  return j.audio_features
}

export async function getRecommendations(opts){
  const p = new URLSearchParams({limit: String(opts.limit ?? 20)})
  if(opts.seed_tracks) p.set('seed_tracks', opts.seed_tracks)
  if(opts.target_valence!=null) p.set('target_valence', String(opts.target_valence))
  if(opts.target_energy!=null) p.set('target_energy', String(opts.target_energy))
  if(opts.target_danceability!=null) p.set('target_danceability', String(opts.target_danceability))
  const r = await api(`/recommendations?${p.toString()}`)
  const j = await r.json()
  return j.tracks
}

export async function addTracksToPlaylist(playlistId, uris){
  const r = await api(`/playlists/${playlistId}/tracks`, { method:'POST', body: JSON.stringify({uris}) })
  return r.json()
}

export async function ensurePlaylist(name){
  const me = await (await api('/me')).json()
  const lists = await (await api(`/users/${me.id}/playlists?limit=50`)).json()
  const found = lists.items.find(p=>p.name===name)
  if(found) return found.id
  const created = await (await api(`/users/${me.id}/playlists`, { method:'POST', body: JSON.stringify({name, public:false}) })).json()
  return created.id
}

const SpotifyCtx = createContext({ ready:false, play: async()=>{} })

export function SpotifyProvider({children}){
  const [ready, setReady] = useState(false)
  const deviceIdRef = useRef()

  useEffect(()=>{
    window.onSpotifyWebPlaybackSDKReady = async () => {
      const token = getAccessToken()
      if(!token) return
      const player = new window.Spotify.Player({ name: 'HK×Silksong Player', getOAuthToken: cb=>cb(token) })
      player.addListener('ready', ({ device_id }) => {
        deviceIdRef.current = device_id
        setReady(true)
      })
      player.addListener('not_ready', ()=> setReady(false))
      player.connect()
    }
  }, [])

  const play = async (uri)=>{
    if(!deviceIdRef.current) return alert('웹 재생 디바이스가 준비되지 않았습니다. (Spotify Premium 필요)')
    await api(`/me/player/play?device_id=${deviceIdRef.current}`, { method:'PUT', body: JSON.stringify({ uris:[uri] }) })
  }

  const value = useMemo(()=>({ ready, deviceId: deviceIdRef.current, play }), [ready])
  return <SpotifyCtx.Provider value={value}>{children}</SpotifyCtx.Provider>
}
export const useSpotify = ()=> useContext(SpotifyCtx)
