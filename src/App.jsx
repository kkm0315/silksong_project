import { NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import HollowKnight from './pages/HollowKnight.jsx'
import Silksong from './pages/Silksong.jsx'
import Recommend from './pages/Recommend.jsx'
import { useEffect } from 'react'
import { exchangeCodeForToken, getAccessToken, logout, restoreSession } from './lib/auth.js'
import { SpotifyProvider } from './lib/spotify.jsx'

export default function App(){
  const navigate = useNavigate()

  useEffect(() => {
    const url = new URL(window.location.href)
    if(url.searchParams.get('code')){
      exchangeCodeForToken().then(() => navigate(url.pathname, { replace: true }))
    } else {
      restoreSession()
    }
  }, [navigate])

  return (
    <SpotifyProvider>
      <div className="min-h-screen bg-neutral-900 text-neutral-100">
        <header className="sticky top-0 z-10 backdrop-blur bg-neutral-900/80 border-b border-neutral-800">
          <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
            <h1 className="text-xl font-semibold">Hollow Knight × Silksong · Spotify 추천</h1>
            <AuthBar />
          </div>
          <nav className="max-w-6xl mx-auto px-3 pb-2 flex gap-2">
            <Tab to="/" label="할로우나이트" end />
            <Tab to="/silksong" label="실크송" />
          </nav>
        </header>
        <main className="max-w-6xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<HollowKnight/>} />
            <Route path="/silksong" element={<Silksong/>} />
            <Route path="/recommend" element={<Recommend/>} />
          </Routes>
          <Outlet />
        </main>
      </div>
    </SpotifyProvider>
  )
}

function Tab({to, label, end}){
  return (
    <NavLink to={to} end={end}
      className={({isActive})=>`px-3 py-2 rounded-2xl text-sm ${isActive? 'bg-emerald-600 text-white':'bg-neutral-800 hover:bg-neutral-700'}`}>
      {label}
    </NavLink>
  )
}

function AuthBar(){
  const token = getAccessToken()
  return (
    <div className="flex items-center gap-2">
      {token ? (
        <button onClick={()=>logout()} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm">로그아웃</button>
      ) : (
        <button onClick={()=>startLogin()} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm">Spotify 로그인</button>
      )}
    </div>
  )
}

async function startLogin(){
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const redirectUri = window.location.origin + '/'
  const scope = [
    'user-read-email',
    'user-read-private',
    'streaming',
    'user-modify-playback-state',
    'user-read-playback-state',
    'playlist-modify-private',
    'playlist-modify-public'
  ].join(' ')

  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  const codeVerifier = Array.from(array, x => ('0'+x.toString(16)).slice(-2)).join('')
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  sessionStorage.setItem('pkce_verifier', codeVerifier)

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('scope', scope)
  window.location.href = authUrl.toString()
}