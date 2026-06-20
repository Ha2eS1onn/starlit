/**
 * Web Audio API 音效引擎
 * 所有音效用合成器生成，不加载外部文件
 */

const DEFAULT_VOLUME = 0.3 // 默认 30%
const STORAGE_KEY = 'starlit-audio-volume'

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private _volume: number = DEFAULT_VOLUME
  private flightOsc: OscillatorNode | null = null
  private flightGain: GainNode | null = null
  private droneOsc: OscillatorNode | null = null
  private droneGain: GainNode | null = null
  private noiseNode: AudioBufferSourceNode | null = null
  private initialized = false

  get volume() {
    return this._volume
  }

  /** 初始化 AudioContext（首次用户交互后调用） */
  init() {
    if (this.initialized) return
    this.initialized = true
    this._volume = parseFloat(
      localStorage.getItem(STORAGE_KEY) || String(DEFAULT_VOLUME),
    )
    if (isNaN(this._volume)) this._volume = DEFAULT_VOLUME
  }

  /** 获取或创建 AudioContext（惰性） */
  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this._volume
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  /** 设置主音量（0-1） */
  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v))
    localStorage.setItem(STORAGE_KEY, String(this._volume))
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume
    }
    // 音量 0 时停掉飞行音和 drone
    if (this._volume === 0) {
      this.stopFlight()
      this.stopDrone()
    }
  }

  /** 悬停提示音：短促 800Hz sine */
  playHover() {
    if (this._volume === 0) return
    const ctx = this.getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 800
    gain.gain.setValueAtTime(0.15 * this._volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }

  /** 点击确认音：600Hz sine + 衰减 */
  playClick() {
    if (this._volume === 0) return
    const ctx = this.getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 600
    gain.gain.setValueAtTime(0.2 * this._volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  }

  /** 飞行音：低频 sawtooth，音高随速度变化 */
  playFlight(speedMultiplier: number) {
    if (this._volume === 0 || speedMultiplier < 0.1) {
      this.stopFlight()
      return
    }
    const ctx = this.getContext()
    if (!this.flightOsc) {
      this.flightOsc = ctx.createOscillator()
      this.flightGain = ctx.createGain()
      this.flightOsc.type = 'sawtooth'
      this.flightGain.gain.value = 0.03 * this._volume
      this.flightOsc.connect(this.flightGain)
      this.flightGain.connect(this.masterGain!)
      this.flightOsc.start()
    }
    // 频率随速度提升：60Hz + speedMultiplier*5
    const freq = 60 + speedMultiplier * 5
    this.flightOsc.frequency.setTargetAtTime(
      Math.min(freq, 200),
      ctx.currentTime,
      0.05,
    )
  }

  /** 停止飞行音 */
  stopFlight() {
    if (this.flightOsc) {
      try { this.flightOsc.stop() } catch (_) { /* already stopped */ }
      this.flightOsc.disconnect()
      this.flightOsc = null
    }
    if (this.flightGain) {
      this.flightGain.disconnect()
      this.flightGain = null
    }
  }

  /** 启动环境 drone：40Hz sine + 白噪声 */
  startDrone() {
    if (this._volume === 0 || this.droneOsc) return
    const ctx = this.getContext()

    // 低频 drone
    this.droneOsc = ctx.createOscillator()
    this.droneGain = ctx.createGain()
    this.droneOsc.type = 'sine'
    this.droneOsc.frequency.value = 40
    this.droneGain.gain.value = 0.015 * this._volume
    this.droneOsc.connect(this.droneGain)
    this.droneGain.connect(this.masterGain!)
    this.droneOsc.start()

    // 白噪声（AudioBuffer）
    const bufSize = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.005 * this._volume
    noise.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()
    this.noiseNode = noise
  }

  /** 停止环境音 */
  stopDrone() {
    if (this.droneOsc) {
      try { this.droneOsc.stop() } catch (_) { }
      this.droneOsc.disconnect()
      this.droneOsc = null
    }
    if (this.droneGain) {
      this.droneGain.disconnect()
      this.droneGain = null
    }
    if (this.noiseNode) {
      try { this.noiseNode.stop() } catch (_) { }
      this.noiseNode.disconnect()
      this.noiseNode = null
    }
  }

  /** 完全释放 */
  dispose() {
    this.stopFlight()
    this.stopDrone()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}

/** 单例导出 */
export const audio = new AudioEngine()