/**
 * 赤道坐标转 3D 直角坐标
 * @param ra  赤经（单位：小时，0-24）
 * @param dec 赤纬（单位：度，-90~+90）
 * @param dist 距离（单位：秒差距）
 * @returns 右手系直角坐标 {x, y, z}
 */
export function equatorialToXYZ(
  ra: number,
  dec: number,
  dist: number
): { x: number; y: number; z: number } {
  const raRad = ra * 15.0 * (Math.PI / 180.0) // 小时 → 度 → 弧度
  const decRad = dec * (Math.PI / 180.0)
  const d = dist > 0 ? dist : 100 // 距离为 0 时使用默认值

  return {
    x: d * Math.cos(decRad) * Math.cos(raRad),
    y: d * Math.sin(decRad),
    z: d * Math.cos(decRad) * Math.sin(raRad),
  }
}