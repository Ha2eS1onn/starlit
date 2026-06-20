import { create } from 'zustand'
import type { StarData } from '../types'

interface StarState {
  /** 当前选中的恒星，null 表示未选中 */
  selectedStar: StarData | null
  /** 设置选中的恒星 */
  setSelectedStar: (star: StarData | null) => void

  /** 相机目标位置 */
  cameraTarget: { x: number; y: number; z: number } | null
  /** 设置相机目标位置 */
  setCameraTarget: (target: { x: number; y: number; z: number } | null) => void

  /** 当前悬停的恒星（显示星名标签），null 表示无悬停 */
  hoveredStar: StarData | null
  /** 悬停星点的 3D 世界坐标 */
  hoveredPosition: { x: number; y: number; z: number } | null
  /** 设置悬停信息 */
  setHovered: (star: StarData | null, pos?: { x: number; y: number; z: number }) => void

  /** 飞行实时速度（单位/秒） */
  flightSpeed: number
  /** 速度倍率（1-100） */
  flightMultiplier: number
  /** 更新飞行信息 */
  setFlightInfo: (speed: number, multiplier: number) => void

  /** 当前相机灵敏度值 */
  cameraSensitivity: number
  /** 设置相机灵敏度 */
  setCameraSensitivity: (val: number) => void

  /** 当前选中的星座名（用于显示对应连线），null 表示不显示连线 */
  selectedConstellation: string | null
  /** 设置选中的星座 */
  setSelectedConstellation: (name: string | null) => void

  /** 恒星数据是否已加载完成 */
  starsLoaded: boolean
  /** 设置加载完成 */
  setStarsLoaded: (loaded: boolean) => void

  /** 全量恒星数据（用于搜索等） */
  allStars: StarData[]
  /** 设置全量恒星数据 */
  setAllStars: (stars: StarData[]) => void

  /** 音频音量（0-1） */
  audioVolume: number
  /** 设置音频音量 */
  setAudioVolume: (v: number) => void
}

export const useStarStore = create<StarState>((set) => ({
  selectedStar: null,
  setSelectedStar: (star) => set({ selectedStar: star }),

  cameraTarget: null,
  setCameraTarget: (target) => set({ cameraTarget: target }),

  hoveredStar: null,
  hoveredPosition: null,
  setHovered: (star, pos) =>
    set({ hoveredStar: star, hoveredPosition: pos ?? null }),

  flightSpeed: 0,
  flightMultiplier: 1,
  setFlightInfo: (speed, multiplier) =>
    set({ flightSpeed: speed, flightMultiplier: multiplier }),

  cameraSensitivity: 0.006,
  setCameraSensitivity: (val) => set({ cameraSensitivity: val }),

  selectedConstellation: null,
  setSelectedConstellation: (name) => set({ selectedConstellation: name }),

  starsLoaded: false,
  setStarsLoaded: (loaded) => set({ starsLoaded: loaded }),

  allStars: [],
  setAllStars: (stars) => set({ allStars: stars }),

  audioVolume: 0.3,
  setAudioVolume: (v) => set({ audioVolume: v }),
}))
