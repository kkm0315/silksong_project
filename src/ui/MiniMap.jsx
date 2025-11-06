import { useNavigate } from 'react-router-dom'

export function MiniMap({data, game}){
  const nav = useNavigate()
  return (
    <div className="relative border border-neutral-800 rounded-2xl overflow-hidden">
      <svg viewBox={`0 0 ${data.width} ${data.height}`} className="w-full h-auto block bg-neutral-950">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#222" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={data.width} height={data.height} fill="url(#grid)" />
        {data.regions.map(r => (
          <g key={r.id}>
            <rect x={r.coords[0]} y={r.coords[1]} width={r.coords[2]} height={r.coords[3]}
              rx={8}
              className="cursor-pointer"
              onClick={()=> nav(`/recommend?game=${game}&id=${r.id}`)}
              fill="#123" stroke="#1e90ff" opacity={0.3}
            />
            <text x={r.coords[0]+8} y={r.coords[1]+20} fill="#9be" fontSize={12}>{r.label}</text>
            <text x={r.coords[0]+8} y={r.coords[1]+36} fill="#89b" fontSize={10}>{r.ost}</text>
          </g>
        ))}
      </svg>
      <p className="p-3 text-sm text-neutral-300">사각형 = BGM 경계(대략). 클릭하면 해당 OST 기반 Spotify 추천으로 이동합니다.</p>
    </div>
  )
}