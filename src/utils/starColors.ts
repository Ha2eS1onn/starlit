/**
 * 光谱类型到颜色的映射表
 * 参考哈佛光谱分类系统（O-B-A-F-G-K-M）
 */
const SPECTRUM_COLORS: Record<string, string> = {
  O: '#9bb0ff',
  B: '#aabfff',
  A: '#cad7ff',
  F: '#f8f7ff',
  G: '#fff4ea',
  K: '#ffd2a1',
  M: '#ffcc6f',
}

/**
 * 根据光谱类型获取恒星颜色
 * @param spect 光谱类型字符串（如 "A1V"、"K5III"）
 * @returns 十六进制颜色字符串
 */
export function getStarColor(spect: string): string {
  const key = spect.charAt(0).toUpperCase()
  return SPECTRUM_COLORS[key] || '#ffffff'
}

/**
 * 根据视星等计算粒子大小
 * 星等越小（越亮），粒子越大
 * 基础大小乘以 1.3 提升亮感
 * 亮星（mag < 2）额外放大增强区分度
 * @param mag 视星等
 * @returns 粒子大小
 */
export function getStarSize(mag: number): number {
  const base = Math.max(0.15, 2.0 - mag * 0.3) * 1.3
  // 亮星（mag < 2）额外放大：天狼星 -1.46 约放大 1.8×
  if (mag < 2) {
    return base * (1.0 + (2.0 - mag) * 0.3)
  }
  return base
}
