import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useStarStore } from '../store/useStarStore'

/** 固定观察距离：相机停在星点前方 FOCUS_DISTANCE 单位处 */
const FOCUS_DISTANCE = 6

/** 自定义 Hook：诗云式自由飞行相机控制 */
export default function useFlightControls() {
  const { gl, camera } = useThree()
  const setFlightInfo = useStarStore((s) => s.setFlightInfo)
  const cameraTarget = useStarStore((s) => s.cameraTarget)
  const setCameraTarget = useStarStore((s) => s.setCameraTarget)

  // ---- 内部状态（ref，不触发重渲染） ----
  // 太阳系中心视角：置身星海
  const position = useRef(new THREE.Vector3(0, 0, 10))
  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const speedMultiplier = useRef(1.0)

  // 视角欧拉角（弧度）
  // 初始朝向：平视任意方向
  const yaw = useRef(0) // 水平旋转
  const pitch = useRef(0) // 垂直旋转，平视

  // 键盘状态
  const keys = useRef<Record<string, boolean>>({})
  // 鼠标拖拽状态
  const isDragging = useRef(false)
  const lastPointerX = useRef(0)
  const lastPointerY = useRef(0)
  const pointerDownX = useRef(0)
  const pointerDownY = useRef(0)
  const pointerDownTime = useRef(0)

  // 飞行门控：GSAP 动画期间永久阻止 useFrame
  const isFlyingRef = useRef(0)

  // 缓存 direction / right 向量
  const direction = useRef(new THREE.Vector3(0, 0, -1))
  const right = useRef(new THREE.Vector3(1, 0, 0))

  // 物理参数
  const FRICTION = 0.03
  // FOV 45 视野收窄后，提高加速度补偿飞行手感
  const ACCELERATION = 120
  const SCROLL_FACTOR = 1.5

  // 灵敏度 ref（从 localStorage 初始化，不触发重渲染）
  const DEFAULT_SENSITIVITY = 0.006
  const saved = typeof window !== 'undefined'
    ? localStorage.getItem('starlit-camera-sensitivity')
    : null
  const sensitivityRef = useRef(
    saved ? parseFloat(saved) : DEFAULT_SENSITIVITY,
  )
  const setCameraSensitivity = useStarStore((s) => s.setCameraSensitivity)

  // ---- 计算方向向量 ----
  const updateDirection = () => {
    const sp = Math.sin(pitch.current)
    const cp = Math.cos(pitch.current)
    const sy = Math.sin(yaw.current)
    const cy = Math.cos(yaw.current)

    direction.current.set(cp * sy, sp, cp * cy).normalize()
    right.current.set(-cy, 0, sy).normalize()
  }

  // ---- 应用相机矩阵 ----
  const applyCamera = (cam: THREE.Camera) => {
    cam.position.copy(position.current)
    cam.lookAt(
      position.current.x + direction.current.x,
      position.current.y + direction.current.y,
      position.current.z + direction.current.z,
    )
    cam.up.set(0, 1, 0)
  }

  // ---- GSAP 飞向目标（点击星点时调用） ----
  // 使用 quaternion slerp 替代 lookAt，避免与自由飞行方向系统冲突
  useEffect(() => {
    if (!cameraTarget) return

    // 标记飞行中，禁止 useFrame
    isFlyingRef.current = 1
    velocity.current.set(0, 0, 0)

    const starPos = new THREE.Vector3(
      cameraTarget.x,
      cameraTarget.y,
      cameraTarget.z,
    )

    // ---- 记录起止 quaternion ----
    const startQuat = camera.quaternion.clone()

    // 临时 lookAt 计算目标朝向
    camera.lookAt(starPos)
    const endQuat = camera.quaternion.clone()

    // 恢复
    camera.quaternion.copy(startQuat)

    // ---- 计算停靠点：从星点到相机的方向 × FOCUS_DISTANCE ----
    const toStar = starPos.clone().sub(camera.position).normalize()
    const targetPos = starPos.clone().sub(toStar.multiplyScalar(FOCUS_DISTANCE))

    const qTemp = new THREE.Quaternion()

    const tween = gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.7,
      ease: 'power1.out',
      onUpdate: () => {
        const t = tween.progress()
        // quaternion slerp：不触碰 lookAt/direction/yaw/pitch
        qTemp.slerpQuaternions(startQuat, endQuat, t)
        camera.quaternion.copy(qTemp)
      },
      onComplete: () => {
        // 精确对齐
        camera.position.copy(targetPos)
        camera.quaternion.copy(endQuat)

        // 从相机反向同步 direction/yaw/pitch
        const worldDir = new THREE.Vector3()
        camera.getWorldDirection(worldDir)
        direction.current.copy(worldDir)
        position.current.copy(targetPos)
        yaw.current = Math.atan2(worldDir.x, worldDir.z)
        pitch.current = Math.asin(
          Math.max(-1, Math.min(1, worldDir.y)),
        )
        updateDirection()

        // 释放门控
        isFlyingRef.current = 0
        setCameraTarget(null)
      },
    })

    // React 18 StrictMode 清理
    return () => {
      tween.kill()
      isFlyingRef.current = 0
    }
  }, [cameraTarget]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- 键盘事件 ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true

      if (e.key.toLowerCase() === 'r') {
        // R 键重置到太阳系中心视角
        position.current.set(0, 0, 10)
        velocity.current.set(0, 0, 0)
        yaw.current = 0
        pitch.current = 0
        updateDirection()
      }

      // [ 降低灵敏度 / ] 提高灵敏度
      if (e.key === '[') {
        const prev = sensitivityRef.current
        sensitivityRef.current = Math.max(0.001, prev * 0.8)
        localStorage.setItem(
          'starlit-camera-sensitivity',
          String(sensitivityRef.current),
        )
        setCameraSensitivity(sensitivityRef.current)
      }
      if (e.key === ']') {
        const prev = sensitivityRef.current
        sensitivityRef.current = Math.min(0.1, prev * 1.25)
        localStorage.setItem(
          'starlit-camera-sensitivity',
          String(sensitivityRef.current),
        )
        setCameraSensitivity(sensitivityRef.current)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [setCameraSensitivity])

  // ---- 鼠标交互（通过 gl.domElement 捕获） ----
  useEffect(() => {
    const domElement = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX.current = e.clientX
      pointerDownY.current = e.clientY
      pointerDownTime.current = performance.now()
      lastPointerX.current = e.clientX
      lastPointerY.current = e.clientY
      isDragging.current = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons !== 1) {
        isDragging.current = false
        return
      }

      const dx = e.clientX - lastPointerX.current
      const dy = e.clientY - lastPointerY.current

      const totalDx = Math.abs(e.clientX - pointerDownX.current)
      const totalDy = Math.abs(e.clientY - pointerDownY.current)
      if (!isDragging.current && totalDx + totalDy < 3) {
        lastPointerX.current = e.clientX
        lastPointerY.current = e.clientY
        return
      }

      isDragging.current = true

      yaw.current -= dx * sensitivityRef.current
      pitch.current -= dy * sensitivityRef.current
      pitch.current = Math.max(
        -85 * (Math.PI / 180),
        Math.min(85 * (Math.PI / 180), pitch.current),
      )

      lastPointerX.current = e.clientX
      lastPointerY.current = e.clientY
    }

    const onPointerUp = (e: PointerEvent) => {
      const dt = performance.now() - pointerDownTime.current
      const dx = Math.abs(e.clientX - pointerDownX.current)
      const dy = Math.abs(e.clientY - pointerDownY.current)

      if (dx < 5 && dy < 5 && dt < 200) {
        // 点击，放行给 R3F onClick
      } else {
        pointerDownX.current = -9999
      }
      isDragging.current = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) {
        speedMultiplier.current = Math.min(
          100,
          speedMultiplier.current * SCROLL_FACTOR,
        )
      } else {
        speedMultiplier.current = Math.max(
          1,
          speedMultiplier.current / SCROLL_FACTOR,
        )
      }
    }

    domElement.addEventListener('pointerdown', onPointerDown)
    domElement.addEventListener('pointermove', onPointerMove)
    domElement.addEventListener('pointerup', onPointerUp)
    domElement.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown)
      domElement.removeEventListener('pointermove', onPointerMove)
      domElement.removeEventListener('pointerup', onPointerUp)
      domElement.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  // ---- 初始化：同步灵敏度到 store（解决 UI 显示默认值问题） ----
  useEffect(() => {
    setCameraSensitivity(sensitivityRef.current)
  }, [setCameraSensitivity])

  // ---- 初始化方向 ----
  useEffect(() => {
    updateDirection()
  }, [])

  // ---- 每帧更新（自由飞行） ----
  useFrame((state, delta) => {
    // GSAP 飞行动画期间完全暂停
    if (isFlyingRef.current) return

    // 飞行音效已禁用（保留 audio.ts 中的函数定义以备后用）
    const cam = state.camera
    const dt = Math.min(delta, 0.1)

    // 键盘 → 加速度
    if (keys.current['w']) {
      velocity.current.addScaledVector(direction.current, ACCELERATION * dt)
    }
    if (keys.current['s']) {
      velocity.current.addScaledVector(direction.current, -ACCELERATION * dt)
    }
    if (keys.current['a']) {
      velocity.current.addScaledVector(right.current, -ACCELERATION * dt)
    }
    if (keys.current['d']) {
      velocity.current.addScaledVector(right.current, ACCELERATION * dt)
    }

    // 摩擦力
    velocity.current.multiplyScalar(1 - FRICTION)

    const speed = velocity.current.length()
    if (speed < 0.001) {
      velocity.current.set(0, 0, 0)
    }

    // 更新位置
    position.current.addScaledVector(velocity.current, dt * speedMultiplier.current)

    // 更新方向 + 应用相机
    updateDirection()
    applyCamera(cam)

    // 通知 R3F
    state.invalidate()

    // HUD
    setFlightInfo(speed * speedMultiplier.current, speedMultiplier.current)
  })
}
