# 星辞 / StarLit

沉浸式 3D 天球星图 · 将天文数据与人文典故映射至真实恒星三维空间

> https://starlit.xn--r8q546c.top

---

## 项目介绍

星辞是一个纯前端的 3D 天球星图 Web 应用，基于 HYG 星表数据，将近 12 万颗真实恒星渲染在三维球面空间中。用户可在深空场景中自由飞行探索，点击恒星查看天文数据与多文化典故（中国星官、希腊神话、古埃及天文学等）。

核心交互：WASD 自由飞行、鼠标拖拽旋转视角、滚轮调节速度、星名/星座实时搜索、恒星悬停预览与点击详情面板。

## 技术栈

**前端框架**: Vite 8 + React 19 + TypeScript 6  
**3D 渲染**: Three.js 0.184 + @react-three/fiber 9 + @react-three/drei 10 + @react-three/postprocessing 3 (Bloom)  
**状态管理与动画**: zustand 5 (全局状态) + GSAP 3 (相机飞行动画)  
**样式**: CSS Modules

---

## Project Introduction

StarLit is a fully client-side 3D celestial sphere web application. Built on the HYG star catalog, it renders nearly 120,000 real stars in three-dimensional space. Users can freely navigate the deep-space scene, click on any star to view astronomical data alongside cultural and mythological references spanning Chinese star lore, Greek mythology, and ancient Egyptian astronomy.

Core interactions: WASD free-flight, drag-to-rotate, scroll-wheel speed control, real-time star/constellation search, hover preview, and click-to-inspect detail panel.

## Tech Stack

**Frontend**: Vite 8 + React 19 + TypeScript 6  
**3D Rendering**: Three.js 0.184 + @react-three/fiber 9 + @react-three/drei 10 + @react-three/postprocessing 3 (Bloom)  
**State & Animation**: zustand 5 (global state) + GSAP 3 (camera flight animation)  
**Styling**: CSS Modules

---

## 项目结构

```
src/
├── components/
│   ├── Scene.tsx                  # 3D 场景根组件
│   ├── StarField.tsx              # GPU 粒子星场
│   ├── StarPanel.tsx              # 恒星详情面板
│   ├── SearchBox.tsx              # 搜索框
│   ├── ConstellationLines.tsx     # 星座连线
│   ├── VoidNoise.tsx              # 虚空背景
│   ├── LoadingScreen.tsx          # 加载界面
│   └── VolumeControl.tsx          # 音量控制
├── hooks/
│   └── useFlightControls.ts       # 飞行相机控制
├── store/
│   └── useStarStore.ts            # zustand 全局状态
├── utils/
│   ├── coordinates.ts             # 赤道坐标转换
│   ├── starColors.ts              # 光谱着色
│   ├── parseStarName.ts           # 星名解析
│   └── audio.ts                   # Web Audio 音效引擎
├── data/
│   ├── stars.json                 # 恒星数据
│   ├── starNamesCN.json           # 中国星名对照
│   ├── mythology.json             # 多文化典故
│   ├── constellationLines.json    # 星座连线
│   └── greekLetters.ts            # Bayer 前缀映射
└── types/
    └── index.ts                   # TypeScript 类型定义
```

---

## 数据来源

- **HYG Database v3** — 恒星天文数据（位置、星等、光谱类型）
- **starNamesCN.json** — 中国星名对照表
- **mythology.json** — 多文化典故条目（中国、希腊、埃及等）
- **constellationLines.json** — 星座连线数据

## Data Sources

- **HYG Database v3** — stellar positions, magnitudes, spectral types
- **starNamesCN.json** — Chinese star name mapping
- **mythology.json** — cultural and mythological references (Chinese, Greek, Egyptian, etc.)
- **constellationLines.json** — constellation line segment data

---

## License

MIT