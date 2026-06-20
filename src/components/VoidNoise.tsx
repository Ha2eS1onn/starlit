import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** 虚空噪声背景：大量微小灰点，不响应交互 */
export default function VoidNoise() {
  const pointsRef = useRef<THREE.Points>(null)

  const [geometry, material] = useMemo(() => {
    const count = 50000
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // 球面均匀分布，半径 1000-5000
      const radius = 1000 + Math.random() * 4000
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      const i3 = i * 3
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(0.06, 0.06, 0.12),
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      sizeAttenuation: true,
    })

    return [geo, mat]
  }, [])

  // 极缓慢自转
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.0005
      pointsRef.current.rotation.x += delta * 0.0002
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}