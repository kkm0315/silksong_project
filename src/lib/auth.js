const TOKEN_KEY = 'spotify_token'
const REFRESH_KEY = 'spotify_refresh'

export function getAccessToken(){
  const raw = localStorage.getItem(TOKEN_KEY)
  if(!raw) return null
  const obj = JSON.parse(raw)
  if(Date.now() > obj.expires_at){
    return null
  }
  return obj.access_token
}

export async function exchangeCodeForToken(){
  const params = new URL(window.location.href).searchParams
  const code = params.get('code')
  const verifier = sessionStorage.getItem('pkce_verifier')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: window.location.origin + '/',
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    code_verifier: verifier
  })
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body
  })
  const json = await res.json()
  if(json.access_token){
    const expires_at = Date.now() + (json.expires_in*1000 - 60_000)
    localStorage.setItem('spotify_token', JSON.stringify({access_token: json.access_token, expires_at}))
    if(json.refresh_token){
      localStorage.setItem(REFRESH_KEY, json.refresh_token)
    }
  }
}

export async function refresh(){
  const refresh_token = localStorage.getItem(REFRESH_KEY)
  if(!refresh_token) return null
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID
  })
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body
  })
  const json = await res.json()
  if(json.access_token){
    const expires_at = Date.now() + (json.expires_in*1000 - 60_000)
    localStorage.setItem('spotify_token', JSON.stringify({access_token: json.access_token, expires_at}))
    return json.access_token
  }
  return null
}

export function restoreSession(){
  // noop placeholder to match TS version; kept for symmetry
}

export function logout(){
  localStorage.removeItem('spotify_token')
  localStorage.removeItem(REFRESH_KEY)
  window.location.reload()
}