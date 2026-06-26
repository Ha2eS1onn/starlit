import { useRef, useCallback, useEffect } from 'react'
import { joystickInput } from '../utils/joystickInput'
import styles from './VirtualJoystick.module.css'

/** 摇杆拇指最大偏移半径 */
const THUMB_RADIUS = 30

/**
 * 虚拟摇杆组件（仅移动端显示）
 * 拖拽控制相机移动方向，松手回中
 */
export default function VirtualJoystick() {
  const baseRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const baseRectRef = useRef<DOMRect | null>(null)

  /** 更新拇指位置和输入值 */
  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const rect = baseRectRef.current
    if (!rect) return

    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let dx = clientX - cx
    let dy = clientY - cy

    // 钳制到拇指半径内
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > THUMB_RADIUS) {
      dx = (dx / dist) * THUMB_RADIUS
      dy = (dy / dist) * THUMB_RADIUS
    }

    // 更新拇指位置
    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate(${dx}px, ${dy}px)`
    }

    // 归一化输出到共享 ref
    joystickInput.x = dx / THUMB_RADIUS
    joystickInput.y = -dy / THUMB_RADIUS
  }, [])

  /** 重置摇杆回中 */
  const resetJoystick = useCallback(() => {
    isDragging.current = false
    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate(0, 0)'
    }
    joystickInput.x = 0
    joystickInput.y = 0
  }, [])

  // 触摸事件
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const rect = baseRef.current?.getBoundingClientRect()
    if (!rect) return
    baseRectRef.current = rect
    isDragging.current = true

    const t = e.touches[0]
    updateJoystick(t.clientX, t.clientY)
  }, [updateJoystick])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return
    e.preventDefault()
    const t = e.touches[0]
    updateJoystick(t.clientX, t.clientY)
  }, [updateJoystick])

  const onTouchEnd = useCallback(() => {
    resetJoystick()
  }, [resetJoystick])

  // 监听窗口尺寸变化时更新底座位置
  useEffect(() => {
    const onResize = () => {
      if (baseRef.current) {
        baseRectRef.current = baseRef.current.getBoundingClientRect()
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className={styles.container}>
      <div
        ref={baseRef}
        className={styles.base}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div ref={thumbRef} className={styles.thumb} />
      </div>
    </div>
  )
}