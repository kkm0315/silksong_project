import regions from '../data/silksong_regions.json'
import { MiniMap } from '../ui/MiniMap.jsx'
export default function Silksong(){
  return (
    <section>
      <h2 className="text-lg mb-3 font-semibold">실크송 미니맵 (BGM 구역 클릭)</h2>
      <MiniMap data={regions} game="SS" />
    </section>
  )
}