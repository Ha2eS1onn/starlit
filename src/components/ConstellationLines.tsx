import { useEffect, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import lineData from '../data/constellationLines.json'
import { equatorialToXYZ } from '../utils/coordinates'
import { useStarStore } from '../store/useStarStore'

interface LineDef {
  constellation: string
  lines: [string, string][]
}

/** 星座连线组件：用 ShaderMaterial 实现脉冲呼吸动画 */
interface ConstellationLinesProps {
  selectedConstellation: string | null
}

export default function ConstellationLines({
  selectedConstellation,
}: ConstellationLinesProps) {
  const allStars = useStarStore((s) => s.allStars)
  const { scene } = useThree()
  const lineObjRef = useRef<THREE.LineSegments | null>(null)

  // 生成顶点数据
  const geometry = useMemo(() => {
    if (!selectedConstellation || allStars.length === 0) {
      const empty = new THREE.BufferGeometry()
      empty.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
      return empty
    }

    const starMap = new Map<string, THREE.Vector3>()
    allStars.forEach((star) => {
      const { x, y, z } = equatorialToXYZ(star.ra, star.dec, star.dist)
      if (star.id) starMap.set(star.id, new THREE.Vector3(x, y, z))
    })

    const vertices: number[] = []
    ;(lineData as LineDef[])
      .filter((c) => c.constellation === selectedConstellation)
      .forEach((constellation) => {
        constellation.lines.forEach(([startId, endId]) => {
          const start = starMap.get(startId)
          const end = starMap.get(endId)
          if (start && end) {
            vertices.push(start.x, start.y, start.z)
            vertices.push(end.x, end.y, end.z)
          }
        })
      })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geo
  }, [selectedConstellation, allStars])

  // 用原生 THREE.LineSegments 直接操作场景
  useEffect(() => {
    if (lineObjRef.current) {
      scene.remove(lineObjRef.current)
      lineObjRef.current.geometry.dispose()
      lineObjRef.current = null
    }

    const count = geometry.attributes.position.count
    if (count === 0) return

    // 创建线段材质：极淡青蓝，接近不可见
    const material = new THREE.LineBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.03,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const lines = new THREE.LineSegments(geometry, material)
    lines.renderOrder = 999
    scene.add(lines)
    lineObjRef.current = lines

    return () => {
      if (lineObjRef.current) {
        scene.remove(lineObjRef.current)
        lineObjRef.current.geometry.dispose()
        lineObjRef.current = null
      }
    }
  }, [scene, geometry])

  // 脉冲透明度动画：极轻微呼吸
  useFrame(() => {
    if (lineObjRef.current) {
      const mat = lineObjRef.current.material as THREE.LineBasicMaterial
      const t = performance.now() / 1000
      mat.opacity = 0.02 + Math.sin(t * 0.5) * 0.015
    }
  })

  return null
}