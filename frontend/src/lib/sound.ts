// Web Audio API procedural synthesizer + Custom Audio Player for Show do Milhão & Interactive TV Quiz

export type AudioCategory = 'bgMusic' | 'correct' | 'wrong' | 'timeUp' | 'ticking' | 'countdown' | 'fiftyFifty';

export interface CustomAudioItem {
  id: string;
  name: string;
  type: AudioCategory;
  sourceType: 'file' | 'url' | 'youtube';
  url: string; // base64 data URL or external URL
  createdAt: number;
}

export interface CustomAudioConfig {
  activeBgMusicId?: string | null;
  activeCorrectId?: string | null;
  activeWrongId?: string | null;
  activeTimeUpId?: string | null;
  activeTickingId?: string | null;
  activeCountdownId?: string | null;
  activeFiftyFiftyId?: string | null;
  items: CustomAudioItem[];
}

const STORAGE_KEY = 'revisao_custom_audios';
export const YOUTUBE_AUDIO_EVENT = 'revisao:youtube-audio';

export function getYoutubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    let videoId: string | null = null;

    if (hostname === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || null;
    } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(hostname)) {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v');
      } else {
        const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
        videoId = match?.[1] || null;
      }
    }

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

function emitYoutubeAudio(detail: {
  action: 'play' | 'stop' | 'volume';
  channel?: 'bg' | 'sfx' | 'all';
  videoId?: string;
  loop?: boolean;
  volume?: number;
}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(YOUTUBE_AUDIO_EVENT, { detail }));
  }
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private bgGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private bgInterval: any = null;
  private isMuted: boolean = false;
  private bgVolume: number = 0.35;
  private sfxVolume: number = 0.6;
  private currentTrack: string | null = null;
  private currentCustomUrl: string | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private previewAudioEl: HTMLAudioElement | null = null;
  private previewingYoutube = false;
  private youtubeAudioKind: 'bg' | 'sfx' | 'preview' | null = null;
  private config: CustomAudioConfig | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadConfig();
    }
  }

  // --- CUSTOM AUDIO CONFIGURATION & PERSISTENCE ---

  public loadConfig(): CustomAudioConfig {
    if (typeof window === 'undefined') {
      return { items: [] };
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.config = JSON.parse(saved);
        return this.config!;
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações de áudio:', e);
    }
    this.config = { items: [] };
    return this.config;
  }

  public saveConfig(config: CustomAudioConfig) {
    this.config = config;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch (e) {
        console.warn('Erro ao salvar configurações de áudio no localStorage:', e);
      }
    }
  }

  public getConfig(): CustomAudioConfig {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  public addCustomAudio(data: Omit<CustomAudioItem, 'id' | 'createdAt'>): CustomAudioItem {
    const config = this.getConfig();
    const newItem: CustomAudioItem = {
      ...data,
      id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
    };
    config.items.push(newItem);

    // If no active audio for this type yet, set it as active
    const activeKey = this.getActiveKey(newItem.type);
    if (!config[activeKey]) {
      config[activeKey] = newItem.id;
    }

    this.saveConfig(config);
    return newItem;
  }

  public deleteCustomAudio(id: string) {
    const config = this.getConfig();
    const item = config.items.find(i => i.id === id);
    if (!item) return;

    config.items = config.items.filter(i => i.id !== id);
    const activeKey = this.getActiveKey(item.type);
    if (config[activeKey] === id) {
      // Revert to null (default procedural sound) or next available
      config[activeKey] = null;
    }
    this.saveConfig(config);
  }

  public setActiveAudio(category: AudioCategory, id: string | null) {
    const config = this.getConfig();
    const activeKey = this.getActiveKey(category);
    config[activeKey] = id;
    this.saveConfig(config);
  }

  public getActiveAudioUrl(category: AudioCategory): string | null {
    const config = this.getConfig();
    const activeKey = this.getActiveKey(category);
    const activeId = config[activeKey];
    if (!activeId) return null;
    const item = config.items.find(i => i.id === activeId);
    return item ? item.url : null;
  }

  private getActiveKey(category: AudioCategory): 'activeBgMusicId' | 'activeCorrectId' | 'activeWrongId' | 'activeTimeUpId' | 'activeTickingId' | 'activeCountdownId' | 'activeFiftyFiftyId' {
    switch (category) {
      case 'bgMusic': return 'activeBgMusicId';
      case 'correct': return 'activeCorrectId';
      case 'wrong': return 'activeWrongId';
      case 'timeUp': return 'activeTimeUpId';
      case 'ticking': return 'activeTickingId';
      case 'countdown': return 'activeCountdownId';
      case 'fiftyFifty': return 'activeFiftyFiftyId';
    }
  }

  // --- AUDIO PREVIEW ---

  public previewAudio(url: string, onEnded?: () => void) {
    this.stopPreview();
    const youtubeVideoId = getYoutubeVideoId(url);
    if (youtubeVideoId) {
      this.previewingYoutube = true;
      this.youtubeAudioKind = 'preview';
      emitYoutubeAudio({
        action: 'play',
        videoId: youtubeVideoId,
        volume: this.sfxVolume,
      });
      return;
    }

    try {
      this.previewAudioEl = new Audio(url);
      this.previewAudioEl.volume = this.sfxVolume;
      this.previewAudioEl.play().catch(e => console.warn('Preview blocked:', e));
      this.previewAudioEl.onended = () => {
        this.previewAudioEl = null;
        if (onEnded) onEnded();
      };
    } catch (e) {
      console.warn('Erro ao reproduzir preview:', e);
    }
  }

  public stopPreview() {
    if (this.previewingYoutube) {
      emitYoutubeAudio({ action: 'stop' });
      this.previewingYoutube = false;
      this.youtubeAudioKind = null;
    }
    if (this.previewAudioEl) {
      this.previewAudioEl.pause();
      this.previewAudioEl.currentTime = 0;
      this.previewAudioEl = null;
    }
  }

  // --- CONTEXT & VOLUME ---

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bgGainNode = this.ctx.createGain();
        this.sfxGainNode = this.ctx.createGain();
        
        this.bgGainNode.gain.setValueAtTime(this.bgVolume, this.ctx.currentTime);
        this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        
        this.bgGainNode.connect(this.ctx.destination);
        this.sfxGainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private isBgZeroed: boolean = false;

  public zeroBackgroundMusic() {
    this.isBgZeroed = true;
    if (this.bgGainNode && this.ctx) {
      this.bgGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.customAudio) {
      this.customAudio.volume = 0;
    }
    if (this.youtubeAudioKind === 'bg') {
      emitYoutubeAudio({ action: 'volume', channel: 'bg', volume: 0 });
    }
  }

  public restoreBackgroundMusic() {
    this.isBgZeroed = false;
    const effectiveVol = this.isMuted ? 0 : this.bgVolume;
    if (this.bgGainNode && this.ctx) {
      this.bgGainNode.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
    }
    if (this.customAudio) {
      this.customAudio.volume = effectiveVol;
    }
    if (this.youtubeAudioKind === 'bg') {
      emitYoutubeAudio({ action: 'volume', channel: 'bg', volume: effectiveVol });
    }
  }

  public setBgVolume(vol: number) {
    this.bgVolume = Math.max(0, Math.min(1, vol));
    const effectiveVol = (this.isMuted || this.isBgZeroed) ? 0 : this.bgVolume;
    if (this.bgGainNode && this.ctx) {
      this.bgGainNode.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
    }
    if (this.customAudio) {
      this.customAudio.volume = effectiveVol;
    }
    if (this.youtubeAudioKind === 'bg') {
      emitYoutubeAudio({ action: 'volume', channel: 'bg', volume: effectiveVol });
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    const effectiveVol = this.isMuted ? 0 : this.sfxVolume;
    if (this.sfxGainNode && this.ctx) {
      this.sfxGainNode.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
    }
    if (this.youtubeAudioKind === 'sfx' || this.youtubeAudioKind === 'preview') {
      emitYoutubeAudio({ action: 'volume', channel: 'sfx', volume: effectiveVol });
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setBgVolume(this.bgVolume);
    this.setSfxVolume(this.sfxVolume);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public stopYoutubeAudio(channel?: 'bg' | 'sfx' | 'all') {
    emitYoutubeAudio({ action: 'stop', channel: channel || 'all' });
    if (!channel || channel === 'all' || channel === 'sfx') {
      this.previewingYoutube = false;
      this.youtubeAudioKind = null;
    }
  }

  public playOneShotAudio(url: string) {
    if (this.isMuted) return;
    const youtubeVideoId = getYoutubeVideoId(url);
    if (youtubeVideoId) {
      this.youtubeAudioKind = 'sfx';
      emitYoutubeAudio({
        action: 'play',
        channel: 'sfx',
        videoId: youtubeVideoId,
        loop: false,
        volume: this.sfxVolume,
      });
      return;
    }

    try {
      const audio = new Audio(url);
      audio.volume = this.sfxVolume;
      audio.play().catch(e => console.warn('Erro ao tocar áudio personalizado:', e));
    } catch (e) {
      console.warn('Erro ao criar áudio:', e);
    }
  }

  // --- BACKGROUND MUSIC ---

  public isBackgroundMusicPlaying(): boolean {
    if (this.customAudio && !this.customAudio.paused) return true;
    if (this.youtubeAudioKind === 'bg') return true;
    if (this.bgInterval !== null) return true;
    return false;
  }

  public stopBackgroundMusic() {
    this.isBgZeroed = false;
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.currentTime = 0;
      this.customAudio = null;
    }
    if (this.youtubeAudioKind === 'bg') {
      emitYoutubeAudio({ action: 'stop', channel: 'bg' });
      this.youtubeAudioKind = null;
    }
    this.currentTrack = null;
    this.currentCustomUrl = null;
  }

  public startBackgroundMusic(type: string = 'suspense', customUrl?: string) {
    if (type === 'none') {
      this.stopBackgroundMusic();
      return;
    }

    const activeCustomBg = customUrl || this.getActiveAudioUrl('bgMusic');

    // Se a mesma música de fundo já estiver tocando, mantém tocando sem interrupção nem reinício
    if (
      this.isBackgroundMusicPlaying() &&
      this.currentTrack === type &&
      this.currentCustomUrl === (activeCustomBg || null)
    ) {
      return;
    }

    this.initContext();
    this.stopBackgroundMusic();
    this.isBgZeroed = false;
    this.currentTrack = type;
    this.currentCustomUrl = activeCustomBg || null;

    if (activeCustomBg && activeCustomBg.trim().length > 0) {
      const youtubeVideoId = getYoutubeVideoId(activeCustomBg);
      if (youtubeVideoId) {
        this.youtubeAudioKind = 'bg';
        emitYoutubeAudio({
          action: 'play',
          channel: 'bg',
          videoId: youtubeVideoId,
          loop: true,
          volume: this.isMuted ? 0 : this.bgVolume,
        });
        return;
      }

      try {
        this.customAudio = new Audio(activeCustomBg);
        this.customAudio.loop = true;
        this.customAudio.volume = this.isMuted ? 0 : this.bgVolume;
        this.customAudio.play().catch(e => console.warn('Custom audio playback blocked:', e));
        return;
      } catch (err) {
        console.warn('Erro ao carregar áudio personalizado, usando sintetizador nativo:', err);
      }
    }

    if (type === 'suspense') {
      this.playSuspenseDrone();
    } else if (type === 'kahoot') {
      this.playKahootUpbeat();
    } else if (type === 'epic') {
      this.playEpicTheme();
    } else if (type === 'ticking') {
      this.playTickingLoop();
    }
  }

  // Procedural Suspense Drone
  private playSuspenseDrone() {
    if (!this.ctx || !this.bgGainNode) return;
    
    let step = 0;
    const chords = [
      [65.41, 130.81, 196.00], // C low suspense
      [61.74, 123.47, 185.00], // B low suspense
      [58.27, 116.54, 174.61], // Bb low suspense
      [61.74, 123.47, 185.00],
    ];

    const playPulse = () => {
      if (!this.ctx || !this.bgGainNode) return;
      const t = this.ctx.currentTime;
      const currentChord = chords[step % chords.length];
      step++;

      currentChord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

        osc.connect(gain);
        gain.connect(this.bgGainNode!);
        osc.start(t);
        osc.stop(t + 2.0);
      });

      // Ticking sub-beat
      const tickOsc = this.ctx.createOscillator();
      const tickGain = this.ctx.createGain();
      tickOsc.type = 'sawtooth';
      tickOsc.frequency.setValueAtTime(440, t + 0.5);
      tickGain.gain.setValueAtTime(0.02, t + 0.5);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      tickOsc.connect(tickGain);
      tickGain.connect(this.bgGainNode);
      tickOsc.start(t + 0.5);
      tickOsc.stop(t + 0.65);
    };

    playPulse();
    this.bgInterval = setInterval(playPulse, 1800);
  }

  // Procedural Kahoot Upbeat Synth
  private playKahootUpbeat() {
    if (!this.ctx || !this.bgGainNode) return;

    const bassNotes = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63];
    let noteIndex = 0;

    const playBeat = () => {
      if (!this.ctx || !this.bgGainNode) return;
      const t = this.ctx.currentTime;
      const freq = bassNotes[noteIndex % bassNotes.length];
      noteIndex++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.bgGainNode);
      osc.start(t);
      osc.stop(t + 0.25);

      if (noteIndex % 2 === 0) {
        const noise = this.ctx.createOscillator();
        const nGain = this.ctx.createGain();
        noise.type = 'square';
        noise.frequency.setValueAtTime(800, t);
        nGain.gain.setValueAtTime(0.03, t);
        nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        noise.connect(nGain);
        nGain.connect(this.bgGainNode);
        noise.start(t);
        noise.stop(t + 0.1);
      }
    };

    playBeat();
    this.bgInterval = setInterval(playBeat, 240);
  }

  // Procedural Epic Theme
  private playEpicTheme() {
    if (!this.ctx || !this.bgGainNode) return;
    const notes = [146.83, 174.61, 220.00, 261.63, 293.66];
    let i = 0;

    const step = () => {
      if (!this.ctx || !this.bgGainNode) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(notes[i % notes.length], t);
      i++;

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.bgGainNode);
      osc.start(t);
      osc.stop(t + 1.3);
    };

    step();
    this.bgInterval = setInterval(step, 1200);
  }

  // Procedural Ticking Loop
  private playTickingLoop() {
    if (!this.ctx || !this.bgGainNode) return;

    const tick = () => {
      if (!this.ctx || !this.bgGainNode) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.bgGainNode);
      osc.start(t);
      osc.stop(t + 0.06);
    };

    tick();
    this.bgInterval = setInterval(tick, 1000);
  }

  // --- SOUND EFFECTS (WITH CUSTOM OVERRIDES) ---

  // SFX: Heartbeat (Double thump for last seconds urgency)
  public playHeartbeat() {
    const custom = this.getActiveAudioUrl('ticking');
    if (custom) {
      this.playOneShotAudio(custom);
      return;
    }

    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    
    // Thump 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(75, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    gain1.gain.setValueAtTime(0.18, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc1.connect(gain1);
    gain1.connect(this.sfxGainNode);
    osc1.start(t);
    osc1.stop(t + 0.2);

    // Thump 2
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(65, t + 0.22);
    osc2.frequency.exponentialRampToValueAtTime(35, t + 0.38);
    gain2.gain.setValueAtTime(0.14, t + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc2.connect(gain2);
    gain2.connect(this.sfxGainNode);
    osc2.start(t + 0.22);
    osc2.stop(t + 0.42);
  }

  // SFX: Urgent Ticking for remaining seconds
  public playTickingSound(pitch = 1) {
    const custom = this.getActiveAudioUrl('ticking');
    if (custom) {
      this.playOneShotAudio(custom);
      return;
    }

    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700 * pitch, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playCountdownSound(customUrl?: string) {
    const custom = customUrl || this.getActiveAudioUrl('countdown');
    if (custom) {
      this.playOneShotAudio(custom);
      return;
    }

    this.playHeartbeat();
  }

  // SFX: Time Up Buzzer
  public playTimeUpBuzzer(customUrl?: string) {
    const custom = customUrl || this.getActiveAudioUrl('timeUp');
    if (custom) {
      this.playOneShotAudio(custom);
      return;
    }

    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.8);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.9);
  }

  // SFX: Correct Answer Fanfare / Chime
  public playCorrectAnswer(customUrl?: string) {
    const custom = customUrl || this.getActiveAudioUrl('correct');
    if (custom) {
      this.playOneShotAudio(custom);
      return;
    }

    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.001, t + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, t + idx * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.1 + 0.9);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 1.0);
    });
  }

  // SFX: Confetti Celebration / Time Up Celebration
  public playConfettiSound(customUrl?: string) {
    const custom = customUrl || this.getActiveAudioUrl('confetti' as any) || this.getActiveAudioUrl('timeUp');
    if (custom) {
      this.playOneShotAudio(custom);
      return;
    }

    this.playCorrectAnswer();
  }

  // SFX: Wrong Answer Buzzer
  public playWrongAnswer() {
    const custom = this.getActiveAudioUrl('wrong');
    if (custom) {
      this.playOneShotAudio(custom);
      return;
    }

    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;
    const t = this.ctx.currentTime;

    [220, 233.08].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  }

  // SFX: Suspense Reveal Swell
  public playRevealSuspense() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.6);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  // SFX: 50:50 Eliminator Whoosh
  public playFiftyFifty() {
    const custom = this.getActiveAudioUrl('fiftyFifty');
    if (custom) {
      this.playOneShotAudio(custom);
      return;
    }

    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.4);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // SFX: Broadcast Opening Chime for Intro Entrance
  public playIntroChime() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;
    const t = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.001, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.09, t + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.75);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.8);
    });
  }

  // SFX: Cinematic Intro Whoosh & Chord for Opening Fly-Through
  public playIntroWhoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxGainNode) return;
    const t = this.ctx.currentTime;

    // Harmonic chords
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25];
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.001, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.08 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 2.2);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 2.3);
    });

    // Deep cinematic bass swell
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(65.41, t); // C2
    subOsc.frequency.linearRampToValueAtTime(130.81, t + 1.2);

    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.2, t + 0.4);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGainNode);
    subOsc.start(t);
    subOsc.stop(t + 2.5);
  }
}

export const soundManager = new SoundManager();
