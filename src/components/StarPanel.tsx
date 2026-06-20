import { useStarStore } from '../store/useStarStore'
import mythologyData from '../data/mythology.json'
import type { MythData } from '../types'
import styles from './StarPanel.module.css'

/** 恒星信息面板：展示天文数据与人文典故 */
export default function StarPanel() {
  const selectedStar = useStarStore((s) => s.selectedStar)
  const setSelectedStar = useStarStore((s) => s.setSelectedStar)
  const setSelectedConstellation = useStarStore((s) => s.setSelectedConstellation)

  if (!selectedStar) return null

  // 获取典故数据（可能不存在）
  const myth = (mythologyData as Record<string, MythData>)[selectedStar.id]

  return (
    <div className={styles.panel}>
      {/* 头部：星名 + 关闭按钮 */}
      <div className={styles.panel__header}>
        <div className={styles.panel__titleGroup}>
          <h2 className={styles.panel__name}>{selectedStar.name}</h2>
          <p className={styles.panel__nameEn}>{selectedStar.nameEn}</p>
        </div>
        <button
          className={styles.panel__close}
          onClick={() => {
            setSelectedStar(null)
            setSelectedConstellation(null)
          }}
          title="关闭面板"
        >
          ✕
        </button>
      </div>

      {/* 天文数据 */}
      <div>
        <h3 className={styles.panel__sectionTitle}>天文数据</h3>
        <div className={styles.panel__data}>
          <div className={styles.panel__dataItem}>
            <span className={styles.panel__dataLabel}>星座</span>
            <span className={styles.panel__dataValue}>
              {selectedStar.constellation}
            </span>
          </div>
          <div className={styles.panel__dataItem}>
            <span className={styles.panel__dataLabel}>光谱类型</span>
            <span className={styles.panel__dataValue}>{selectedStar.spect}</span>
          </div>
          <div className={styles.panel__dataItem}>
            <span className={styles.panel__dataLabel}>视星等</span>
            <span className={styles.panel__dataValue}>{selectedStar.mag}</span>
          </div>
          <div className={styles.panel__dataItem}>
            <span className={styles.panel__dataLabel}>距离</span>
            <span className={styles.panel__dataValue}>
              {selectedStar.dist.toFixed(1)} pc
            </span>
          </div>
          <div className={styles.panel__dataItem}>
            <span className={styles.panel__dataLabel}>赤经 (RA)</span>
            <span className={styles.panel__dataValue}>
              {selectedStar.ra.toFixed(3)}h
            </span>
          </div>
          <div className={styles.panel__dataItem}>
            <span className={styles.panel__dataLabel}>赤纬 (Dec)</span>
            <span className={styles.panel__dataValue}>
              {selectedStar.dec.toFixed(3)}°
            </span>
          </div>
        </div>
      </div>

      {/* 人文典故 */}
      <div>
        <h3 className={styles.panel__sectionTitle}>人文典故</h3>
        {myth && myth.entries.length > 0 ? (
          myth.entries.map((entry, idx) => (
            <div key={idx} className={styles.panel__mythEntry}>
              <p className={styles.panel__mythCulture}>{entry.culture}</p>
              <h4 className={styles.panel__mythTitle}>{entry.title}</h4>
              {entry.source && (
                <p className={styles.panel__mythSource}>
                  出处：{entry.source}
                </p>
              )}
              {entry.quote && (
                <blockquote className={styles.panel__mythQuote}>
                  「{entry.quote}」
                </blockquote>
              )}
              <p className={styles.panel__mythContext}>{entry.context}</p>
              {entry.era && (
                <p className={styles.panel__mythEra}>年代：{entry.era}</p>
              )}
            </div>
          ))
        ) : (
          <p className={styles.panel__emptyMyth}>
            这颗星尚未收录人文典故。
          </p>
        )}
      </div>
    </div>
  )
}