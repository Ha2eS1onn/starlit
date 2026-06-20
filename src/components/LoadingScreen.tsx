/** 全屏加载界面 */
export default function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: 'rgba(148, 163, 184, 0.6)',
        fontSize: 13,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        letterSpacing: '0.5px',
        userSelect: 'none',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="rgba(148,163,184,0.2)" strokeWidth="2" />
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="rgba(148,163,184,0.6)"
            strokeWidth="2"
            strokeDasharray="88"
            strokeDashoffset="88"
            style={{
              animation: 'spin 1.5s linear infinite',
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
            }}
          />
        </svg>
        <style>{`@keyframes spin { to { stroke-dashoffset: 0; } }`}</style>
      </div>
      <div>正在加载星图数据...</div>
    </div>
  )
}