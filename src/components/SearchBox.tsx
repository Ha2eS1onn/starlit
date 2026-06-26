import { useState, useRef, useEffect, useCallback } from 'react'
import { useStarStore } from '../store/useStarStore'
import { equatorialToXYZ } from '../utils/coordinates'
import type { StarData } from '../types'

/** 搜索框组件：支持星名和星座搜索，debounce 200ms */
export default function SearchBox() {
  const allStars = useStarStore((s) => s.allStars)
  const starsLoaded = useStarStore((s) => s.starsLoaded)
  const setSelectedStar = useStarStore((s) => s.setSelectedStar)
  const setSelectedConstellation = useStarStore((s) => s.setSelectedConstellation)
  const setCameraTarget = useStarStore((s) => s.setCameraTarget)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StarData[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // 实时过滤（debounce 200ms）
  const handleInput = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(() => {
        const trimmed = value.trim().toLowerCase()
        if (!trimmed) {
          setResults([])
          setIsOpen(false)
          return
        }

        const filtered = allStars.filter((star) => {
          const name = (star.name || '').toLowerCase()
          const nameEn = (star.nameEn || '').toLowerCase()
          const constellation = (star.constellation || '').toLowerCase()
          return (
            name.includes(trimmed) ||
            nameEn.includes(trimmed) ||
            constellation.includes(trimmed)
          )
        })

        setResults(filtered.slice(0, 10))
        setSelectedIndex(-1)
        setIsOpen(filtered.length > 0)
      }, 200)
    },
    [allStars],
  )

  // 飞行到选中星点
  const flyToStar = useCallback(
    (star: StarData) => {
      setSelectedStar(star)
      setSelectedConstellation(star.constellation)
      // 计算星点 3D 坐标作为相机目标
      const { x, y, z } = equatorialToXYZ(star.ra, star.dec, star.dist)
      setCameraTarget({ x, y, z })
      setQuery('')
      setResults([])
      setIsOpen(false)
      inputRef.current?.blur()
    },
    [setSelectedStar, setSelectedConstellation, setCameraTarget],
  )

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const idx = selectedIndex >= 0 ? selectedIndex : 0
        if (results[idx]) flyToStar(results[idx])
      } else if (e.key === 'Escape') {
        setQuery('')
        setResults([])
        setIsOpen(false)
        inputRef.current?.blur()
      }
    },
    [isOpen, results, selectedIndex, flyToStar],
  )

  // 清理
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  /** 检测是否为触控设备（用于响应式宽度） */
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

  if (!starsLoaded) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        width: isTouchDevice ? '90vw' : 340,
        maxWidth: 400,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      {/* 搜索框 */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true)
        }}
        placeholder="搜索星名或星座..."
        style={{
          width: '100%',
          padding: '10px 16px',
          fontSize: 14,
          color: '#e2e8f0',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: 12,
          outline: 'none',
          boxSizing: 'border-box',
          letterSpacing: '0.3px',
        }}
      />

      {/* 下拉结果 */}
      {isOpen && results.length > 0 && (
        <div
          style={{
            marginTop: 4,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: 12,
            overflow: 'hidden',
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {results.map((star, idx) => (
            <div
              key={star.id || idx}
              onClick={() => flyToStar(star)}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background:
                  idx === selectedIndex
                    ? 'rgba(148, 163, 184, 0.1)'
                    : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                {star.name || star.nameEn}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(148, 163, 184, 0.6)',
                  marginLeft: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                {star.constellation}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}