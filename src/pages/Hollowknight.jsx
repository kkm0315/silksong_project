import regions from '../data/hk_regions.json'
import { MiniMap } from '../ui/MiniMap.jsx'
export default function HollowKnight(){
  return (
    <section>
      <h2 className="text-lg mb-3 font-semibold">할로우나이트 미니맵 (BGM 구역 클릭)</h2>
      <MiniMap data={regions} game="HK" />
    </section>
  )
}
