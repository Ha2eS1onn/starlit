import GREEK_LETTERS from '../data/greekLetters'
import starNamesCN from '../data/starNamesCN.json'

/**
 * 根据 Bayer/Flamsteed 前缀和星座缩写生成显示名
 * 例如: "Alp" + "大犬座" → "大犬座 α"
 * 例如: "19" + "大犬座" → "大犬座 19"
 */
export function parseBayerFlamsteed(bf: string, constellationCN: string): string {
  if (!bf) return ''

  // 尝试解析为 Bayer 前缀
  const greek = GREEK_LETTERS[bf]
  if (greek) {
    return `${constellationCN} ${greek}`
  }

  // 尝试解析为数字（Flamsteed）
  const num = parseInt(bf, 10)
  if (!isNaN(num)) {
    return `${constellationCN} ${num}`
  }

  // 兜底：直接返回原始字符串
  return `${constellationCN} ${bf}`
}

/**
 * 获取恒星显示名（优先级：中文名 > Bayer/Flamsteed > 英文名 > 未知）
 */
export function getDisplayName(star: {
  nameEn?: string
  name?: string
  bf?: string
  constellation?: string
}): string {
  const nameMap = starNamesCN as Record<string, string>

  // 优先级 1：有中文名（通过 nameEn 查找）
  if (star.nameEn && nameMap[star.nameEn]) {
    return nameMap[star.nameEn]
  }

  // 优先级 2：有 Bayer/Flamsteed 编号
  if (star.bf && star.constellation) {
    const bfName = parseBayerFlamsteed(star.bf, star.constellation)
    if (bfName) return bfName
  }

  // 优先级 3：有英文名
  if (star.nameEn) return star.nameEn

  // 兜底
  return '未知星'
}