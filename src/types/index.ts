/** 恒星天文数据 */
export interface StarData {
  id: string
  name: string
  nameEn: string
  /** Bayer/Flamsteed 命名前缀（如 "Alp", "Bet", "19"） */
  bf?: string
  /** 星座 3字母缩写（如 "CMa", "Ori"） */
  con?: string
  ra: number
  dec: number
  dist: number
  mag: number
  spect: string
  constellation: string
}

/** 典故条目 */
export interface MythEntry {
  culture: string
  title: string
  source?: string
  quote?: string
  context: string
  era?: string
}

/** 典故数据（按星索引） */
export interface MythData {
  entries: MythEntry[]
}