class SoundManager {
  private static instance: SoundManager
  private sounds: { [key: string]: HTMLAudioElement } = {}
  private enabled: boolean = true

  private constructor() {
    this.initSounds()
  }

  private initSounds() {
    this.sounds = {
      open: new Audio('/sounds/WindowOpen.mp3'),
      close: new Audio('/sounds/WindowClose.mp3'),
      minimize: new Audio('/sounds/WindowMinimize.mp3'),
      maximize: new Audio('/sounds/WindowMaximize.mp3'),
      restore: new Audio('/sounds/restore.mp3'),
      error: new Audio('/sounds/error.mp3'),
      click: new Audio('/sounds/click.mp3'),
    }

    // 预加载所有音效
    Object.values(this.sounds).forEach(audio => {
      audio.load()
    })
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  public play(soundName: keyof typeof this.sounds) {
    if (!this.enabled) return
    const sound = this.sounds[soundName]
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(() => {
        // 忽略自动播放策略导致的错误
      })
    }
  }

  public toggle() {
    this.enabled = !this.enabled
  }

  public isEnabled() {
    return this.enabled
  }
}

export const soundManager = SoundManager.getInstance() 