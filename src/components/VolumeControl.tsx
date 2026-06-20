import { useCallback } from 'react'
import { audio } from '../utils/audio'
import { useStarStore } from '../store/useStarStore'

/** 音量滑块：右下角，控制所有音效音量 */
export default function VolumeControl() {
  const audioVolume = useStarStore((s) => s.audioVolume)
  const setAudioVolume = useStarStore((s) => s.setAudioVolume)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value)
      setAudioVolume(v)
      audio.setVolume(v)
    },
    [setAudioVolume],
  )

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 60,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 200,
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* 音量图标 */}
      <span
        style={{
          color: 'rgba(148, 163, 184, 0.5)',
          fontSize: 11,
          fontFamily:
            'ui-monospace, Consolas, monospace',
        }}
      >
        ♪
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={audioVolume}
        onChange={handleChange}
        style={{
          width: 80,
          height: 4,
          appearance: 'none',
          background: `linear-gradient(to right, rgba(148,163,184,0.6) ${audioVolume * 100}%, rgba(148,163,184,0.15) ${audioVolume * 100}%)`,
          borderRadius: 2,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          color: 'rgba(148, 163, 184, 0.5)',
          fontSize: 10,
          fontFamily:
            'ui-monospace, Consolas, monospace',
          width: 32,
          textAlign: 'right',
        }}
      >
        {Math.round(audioVolume * 100)}
      </span>
    </div>
  )
}