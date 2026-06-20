import { Canvas } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import StarField from './StarField'
import ConstellationLines from './ConstellationLines'
import VoidNoise from './VoidNoise'
import { useStarStore } from '../store/useStarStore'
import useFlightControls from '../hooks/useFlightControls'

/** 飞行控制内部组件：调用 useFlightControls Hook */
function FlightController() {
  useFlightControls()
  return null
}

/** 悬停星名标签：使用 Html 组件在 3D 位置渲染 */
function StarLabel() {
  const hoveredStar = useStarStore((s) => s.hoveredStar)
  const hoveredPosition = useStarStore((s) => s.hoveredPosition)

  if (!hoveredStar || !hoveredPosition) return null

  return (
    <Html
      position={[hoveredPosition.x, hoveredPosition.y, hoveredPosition.z]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          color: '#e2e8f0',
          fontSize: '13px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          textShadow: '0 0 8px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.6)',
          transform: 'translate(12px, -12px)',
          letterSpacing: '0.3px',
          userSelect: 'none',
        }}
      >
        {hoveredStar.name}
      </div>
    </Html>
  )
}

/** 内部组件：读取 store 中的 selectedConstellation 传递给 ConstellationLines */
function ConstellationController() {
  const selectedConstellation = useStarStore((s) => s.selectedConstellation)
  return <ConstellationLines selectedConstellation={selectedConstellation} />
}

/** 3D 场景根组件 */
export default function Scene() {
  return (
    <Canvas
      // 太阳系中心视角：置身星海，环顾四周
      camera={{ position: [0, 0, 10], fov: 60, near: 0.1, far: 20000 }}
      gl={{ antialias: true, alpha: false }}
      // 极深蓝色背景，增强冷色调氛围
      style={{ background: '#000011' }}
    >
      {/* 环境光 */}
      <ambientLight intensity={0.1} />
      {/* 点光源 */}
      <pointLight position={[0, 0, 500]} intensity={0.5} color="#ffffff" />

      {/* 虚空噪声背景 */}
      <VoidNoise />

      {/* 星空 */}
      <StarField />

      {/* 星座连线（仅选中星座时显示） */}
      <ConstellationController />

      {/* 悬停标签 */}
      <StarLabel />

      {/* 飞行控制（自由飞行 + GSAP 飞向目标） */}
      <FlightController />

      {/* Bloom 后期处理 */}
      <EffectComposer>
        <Bloom
          intensity={2.0}
          luminanceThreshold={0.0}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </Canvas>
  )
}