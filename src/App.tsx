import Scene from './components/Scene'
import StarPanel from './components/StarPanel'
import LoadingScreen from './components/LoadingScreen'
import SearchBox from './components/SearchBox'
import VolumeControl from './components/VolumeControl'
import { useStarStore } from './store/useStarStore'
import './App.css'

/** HUD：左下角显示实时速度与灵敏度 */
function FlightHUD() {
  const flightSpeed = useStarStore((s) => s.flightSpeed)
  const flightMultiplier = useStarStore((s) => s.flightMultiplier)
  const cameraSensitivity = useStarStore((s) => s.cameraSensitivity)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        color: 'rgba(148, 163, 184, 0.6)',
        fontSize: 12,
        fontFamily: 'ui-monospace, Consolas, monospace',
        letterSpacing: '0.3px',
        pointerEvents: 'none',
        zIndex: 200,
        textShadow: '0 0 8px rgba(0,0,0,0.8)',
        userSelect: 'none',
        lineHeight: 1.7,
      }}
    >
      <div>
        速度 ×{flightMultiplier.toFixed(1)} · {flightSpeed.toFixed(1)} 单位/秒
      </div>
      <div>
        灵敏度 ×{(cameraSensitivity / 0.006).toFixed(2)}
      </div>
    </div>
  )
}

/** 键位操作提示：右下角（桌面端显示键盘/鼠标，移动端显示触控） */
function ControlsHint() {
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        color: 'rgba(148, 163, 184, 0.5)',
        fontSize: isTouch ? 9 : 10,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        letterSpacing: '0.3px',
        pointerEvents: 'none',
        zIndex: 200,
        textShadow: '0 0 8px rgba(0,0,0,0.8)',
        userSelect: 'none',
        lineHeight: 1.6,
        textAlign: 'right',
      }}
    >
      {isTouch ? (
        <>单指滑动旋转 · 双指捏合飞行<br />点击星点查看详情</>
      ) : (
        <>WASD 飞行 · 拖拽转向 · 滚轮调速<br />点击星点查看 · 悬停显示名称</>
      )}
    </div>
  )
}

function App() {
  const selectedStar = useStarStore((s) => s.selectedStar)
  const starsLoaded = useStarStore((s) => s.starsLoaded)

  return (
    <div className="app">
      {!starsLoaded && <LoadingScreen />}
      <SearchBox />
      <div className="app__canvas">
        <Scene />
      </div>
      {selectedStar && <StarPanel />}
      <FlightHUD />
      <VolumeControl />
      <ControlsHint />
    </div>
  )
}

export default App
