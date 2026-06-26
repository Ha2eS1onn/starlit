import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useStarStore } from '../store/useStarStore'
import { joystickInput } from '../utils/joystickInput'

/** 固定观察距离：相机停在星点前方 FOCUS_DISTANCE 单位处 */
const FOCUS_DISTANCE = 6

/** 触控灵敏度倍率（略高于鼠标，兼顾精度与跟手感） */
const TOUCH_SENSITIVITY = 0.01

/** 自定义 Hook：诗云式自由飞行相机控制（支持鼠标 + 触控） */
export default function useFlightControls() {
  const { gl, camera } = useThree()
  const setFlightInfo = useStarStore((s) => s.setFlightInfo)
  const cameraTarget = useStarStore((s) => s.cameraTarget)
  const setCameraTarget = useStarStore((s) => s.setCameraTarget)

  // ---- 内部状态（ref，不触发重渲染） ----
  const position = useRef(new THREE.Vector3(0, 0, 10))
  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const speedMultiplier = useRef(1.0)

  // 视角欧拉角（弧度）
  const yaw = useRef(0)
  const pitch = useRef(0)

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
  const ACCELERATION = 120
  const SCROLL_FACTOR = 1.5

  // 灵敏度 ref
  const DEFAULT_SENSITIVITY = 0.006
  const saved = typeof window !== 'undefined'
    ? localStorage.getItem('starlit-camera-sensitivity')
    : null
  const sensitivityRef = useRef(
    saved ? parseFloat(saved) : DEFAULT_SENSITIVITY,
  )
  const setCameraSensitivity = useStarStore((s) => s.setCameraSensitivity)

  // ---- 触控手势状态 ----
  const prevTouchPosRef = useRef({ x: 0, y: 0 })

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
  useEffect(() => {
    if (!cameraTarget) return

    isFlyingRef.current = 1
    velocity.current.set(0, 0, 0)

    const starPos = new THREE.Vector3(
      cameraTarget.x,
      cameraTarget.y,
      cameraTarget.z,
    )

    const startQuat = camera.quaternion.clone()
    camera.lookAt(starPos)
    const endQuat = camera.quaternion.clone()
    camera.quaternion.copy(startQuat)

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
        qTemp.slerpQuaternions(startQuat, endQuat, t)
        camera.quaternion.copy(qTemp)
      },
      onComplete: () => {
        camera.position.copy(targetPos)
        camera.quaternion.copy(endQuat)

        const worldDir = new THREE.Vector3()
        camera.getWorldDirection(worldDir)
        direction.current.copy(worldDir)
        position.current.copy(targetPos)
        yaw.current = Math.atan2(worldDir.x, worldDir.z)
        pitch.current = Math.asin(
          Math.max(-1, Math.min(1, worldDir.y)),
        )
        updateDirection()

        isFlyingRef.current = 0
        setCameraTarget(null)
      },
    })

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
        position.current.set(0, 0, 10)
        velocity.current.set(0, 0, 0)
        yaw.current = 0
        pitch.current = 0
        updateDirection()
      }

      if (e.key === '[') {
        const prev = sensitivityRef.current
        sensitivityRef.current = Math.max(0.001, prev * 0.8)
        localStorage.setItem('starlit-camera-sensitivity', String(sensitivityRef.current))
        setCameraSensitivity(sensitivityRef.current)
      }
      if (e.key === ']') {
        const prev = sensitivityRef.current
        sensitivityRef.current = Math.min(0.1, prev * 1.25)
        localStorage.setItem('starlit-camera-sensitivity', String(sensitivityRef.current))
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

  // ---- 鼠标交互 ----
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
        speedMultiplier.current = Math.min(100, speedMultiplier.current * SCROLL_FACTOR)
      } else {
        speedMultiplier.current = Math.max(1, speedMultiplier.current / SCROLL_FACTOR)
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

  // ---- 触控手势（移动端：仅处理单指旋转，摇杆由 VirtualJoystick 组件处理） ----
  useEffect(() => {
    const domElement = gl.domElement

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0]
        prevTouchPosRef.current = { x: t.clientX, y: t.clientY }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && !isFlyingRef.current) {
        e.preventDefault()
        const t = e.touches[0]
        const dx = t.clientX - prevTouchPosRef.current.x
        const dy = t.clientY - prevTouchPosRef.current.y

        if (Math.abs(dx) + Math.abs(dy) >= 1) {
          yaw.current -= dx * TOUCH_SENSITIVITY
          pitch.current -= dy * TOUCH_SENSITIVITY
          pitch.current = Math.max(
            -85 * (Math.PI / 180),
            Math.min(85 * (Math.PI / 180), pitch.current),
          )
        }
        prevTouchPosRef.current = { x: t.clientX, y: t.clientY }
      }
    }

    domElement.addEventListener('touchstart', onTouchStart, { passive: true })
    domElement.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      domElement.removeEventListener('touchstart', onTouchStart)
      domElement.removeEventListener('touchmove', onTouchMove)
    }
  }, [gl])

  // ---- 初始化 ----
  useEffect(() => {
    setCameraSensitivity(sensitivityRef.current)
  }, [setCameraSensitivity])

  useEffect(() => {
    updateDirection()
  }, [])

  // ---- 每帧更新（自由飞行 + 摇杆输入） ----
  useFrame((state, delta) => {
    if (isFlyingRef.current) return

    const cam = state.camera
    const dt = Math.min(delta, 0.1)

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

    // 虚拟摇杆 → 加速度（移动端替代 WASD）
    const jx = joystickInput.x
    const jy = joystickInput.y
    if (Math.abs(jx) > 0.1 || Math.abs(jy) > 0.1) {
      velocity.current.addScaledVector(direction.current, jy * ACCELERATION * dt)
      velocity.current.addScaledVector(right.current, jx * ACCELERATION * dt)
    }

    velocity.current.multiplyScalar(1 - FRICTION)

    const speed = velocity.current.length()
    if (speed < 0.001) {
      velocity.current.set(0, 0, 0)
    }

    position.current.addScaledVector(velocity.current, dt * speedMultiplier.current)

    updateDirection()
    applyCamera(cam)

    state.invalidate()

    setFlightInfo(speed * speedMultiplier.current, speedMultiplier.current)
  })
}