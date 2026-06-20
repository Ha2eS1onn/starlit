import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { equatorialToXYZ } from '../utils/coordinates'
import { getStarColor, getStarSize } from '../utils/starColors'
import { useStarStore } from '../store/useStarStore'
import type { StarData } from '../types'
import { getDisplayName } from '../utils/parseStarName'
import { audio } from '../utils/audio'

/** 异步加载恒星数据 */
async function loadStarData(): Promise<StarData[]> {
  const res = await fetch('/stars-full.json')
  if (!res.ok) {
    throw new Error(`Failed to load star data: ${res.status}`)
  }
  return res.json()
}

/** 星场组件 */
export default function StarField() {
  const pointsRef = useRef<THREE.Points>(null)
  const setSelectedStar = useStarStore((s) => s.setSelectedStar)
  const setCameraTarget = useStarStore((s) => s.setCameraTarget)
  const setHovered = useStarStore((s) => s.setHovered)
  const setSelectedConstellation = useStarStore((s) => s.setSelectedConstellation)
  const setLoaded = useStarStore((s) => s.setStarsLoaded)

  const [stars, setStars] = useState<StarData[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 缓存数据
  const starPositionsRef = useRef<Float32Array | null>(null)
  const starItemsRef = useRef<{ pos: THREE.Vector3; data: StarData }[]>([])
  const hoveredIdxRef = useRef<number | null>(null)

  const setAllStars = useStarStore((s) => s.setAllStars)

  const { camera } = useThree()

  // 异步加载
  useEffect(() => {
    loadStarData()
      .then((data) => {
        const mapped = data.map((star) => {
          const displayName = getDisplayName(star)
          return { ...star, name: displayName }
        })
        setStars(mapped)
        setAllStars(mapped)
        setLoaded(true)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoaded(true)
      })
  }, [setLoaded])

  // 构建粒子数据
  const { geometry } = useMemo(() => {
    if (!stars) return { geometry: null }

    const pos: number[] = []
    const col: number[] = []
    const sz: number[] = []
    const items: { pos: THREE.Vector3; data: StarData }[] = []

    stars.forEach((star) => {
      const { x, y, z } = equatorialToXYZ(star.ra, star.dec, star.dist)
      pos.push(x, y, z)
      const color = new THREE.Color(getStarColor(star.spect))
      col.push(color.r, color.g, color.b)
      sz.push(getStarSize(star.mag))
      items.push({ pos: new THREE.Vector3(x, y, z), data: star })
    })

    const posArr = new Float32Array(pos)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3))
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sz), 1))

    starPositionsRef.current = posArr
    starItemsRef.current = items

    return { geometry: geo }
  }, [stars])

  const vertexShader = `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      float dist = length(mvPosition.xyz);
      float scale = 300.0 / max(10.0, dist);
      gl_PointSize = size * scale;
      gl_Position = projectionMatrix * mvPosition;
    }
  `
  const fragmentShader = `
    varying vec3 vColor;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5);
      // 亮度增益 1.5 倍，使星点更突出
      gl_FragColor = vec4(vColor * 1.5, strength);
    }
  `

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // 每帧更新 time uniform（星点闪烁）
  const timeRef = useRef(0)
  useFrame((_, delta) => {
    timeRef.current += delta
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.ShaderMaterial
      mat.uniforms.time.value = timeRef.current
    }
  })

  // 屏幕投影检测：将 3D 星点投影到屏幕坐标，计算与鼠标的像素距离
  const screenVec = new THREE.Vector3()
  const MAX_PROJECT_DIST = 800

  const detectStar = useCallback(
    (clientX: number, clientY: number) => {
      const positions = starPositionsRef.current
      const items = starItemsRef.current
      if (!positions || items.length === 0) return

      const posArr = positions
      const count = posArr.length / 3
      const camPos = camera.position

      let minPixels = Infinity
      let closestIdx = -1

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        screenVec.set(posArr[i3], posArr[i3 + 1], posArr[i3 + 2])

        // 距离裁剪：跳过太远的星
        if (screenVec.distanceTo(camPos) > MAX_PROJECT_DIST) continue

        // 投影到屏幕空间
        screenVec.project(camera)

        // 裁剪视野外的星
        if (screenVec.x < -1 || screenVec.x > 1 || screenVec.y < -1 || screenVec.y > 1) continue
        if (screenVec.z > 1) continue // 在相机后方

        // 转换到屏幕像素坐标
        const sx = (screenVec.x + 1) / 2 * window.innerWidth
        const sy = -(screenVec.y - 1) / 2 * window.innerHeight

        // 像素距离
        const dx = sx - clientX
        const dy = sy - clientY
        const pixels = Math.sqrt(dx * dx + dy * dy)

        if (pixels < minPixels) {
          minPixels = pixels
          closestIdx = i
        }
      }

      const PIXEL_THRESHOLD = 15
      const prevIdx = hoveredIdxRef.current
      if (closestIdx >= 0 && minPixels < PIXEL_THRESHOLD) {
        if (prevIdx !== closestIdx) {
          hoveredIdxRef.current = closestIdx
          const star = items[closestIdx]
          setHovered(star.data, { x: star.pos.x, y: star.pos.y, z: star.pos.z })
          document.body.style.cursor = 'pointer'
          audio.init()
          audio.playHover()
        }
      } else {
        if (prevIdx !== null) {
          hoveredIdxRef.current = null
          setHovered(null)
          document.body.style.cursor = 'default'
        }
      }
    },
    [camera, setHovered],
  )

  // 卸载时恢复
  useEffect(() => {
    return () => {
      setHovered(null)
      document.body.style.cursor = 'default'
    }
  }, [setHovered])

  if (!stars || error || !geometry) return null

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onPointerMove={(e) => {
        e.stopPropagation()
        detectStar(e.clientX, e.clientY)
      }}
      onClick={(e) => {
        e.stopPropagation()
        const idx = hoveredIdxRef.current
        if (idx === null || idx < 0) return
        const items = starItemsRef.current
        if (idx >= items.length) return
        const star = items[idx]
        setSelectedStar(star.data)
        setSelectedConstellation(star.data.constellation)
        setCameraTarget({ x: star.pos.x, y: star.pos.y, z: star.pos.z })
        audio.init()
        audio.playClick()
      }}
    />
  )
}