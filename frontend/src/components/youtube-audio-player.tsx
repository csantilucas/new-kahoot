"use client";

import { useEffect, useRef, useState } from 'react';
import { YOUTUBE_AUDIO_EVENT } from '@/lib/sound';

interface YoutubeAudioRequest {
  action: 'play' | 'stop' | 'volume' | 'pause' | 'resume';
  channel?: 'bg' | 'sfx' | 'all';
  videoId?: string;
  loop?: boolean;
  volume?: number;
}

interface YoutubePlayback {
  videoId: string;
  loop: boolean;
  volume: number;
  playId: number;
  isPaused?: boolean;
}

export function YoutubeAudioPlayer() {
  const [bgPlayback, setBgPlayback] = useState<YoutubePlayback | null>(null);
  const [sfxPlayback, setSfxPlayback] = useState<YoutubePlayback | null>(null);
  const bgPlayerRef = useRef<HTMLIFrameElement | null>(null);
  const sfxPlayerRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleYoutubeAudio = (event: Event) => {
      const request = (event as CustomEvent<YoutubeAudioRequest>).detail;
      const channel = request.channel || (request.loop ? 'bg' : 'sfx');

      // Executa de forma assíncrona fora da árvore de reconciliação do React
      setTimeout(() => {
        if (request.action === 'stop') {
          if (channel === 'bg' || channel === 'all') {
            try {
              bgPlayerRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'stopVideo', args: '' }),
                '*'
              );
            } catch {}
            setBgPlayback(null);
          }
          if (channel === 'sfx' || channel === 'all') {
            try {
              sfxPlayerRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'stopVideo', args: '' }),
                '*'
              );
            } catch {}
            setSfxPlayback(null);
          }
          return;
        }

        if (request.action === 'pause') {
          if (channel === 'bg' || channel === 'all') {
            const sendPause = () => {
              try {
                bgPlayerRef.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: 'command', func: 'mute', args: '' }),
                  '*'
                );
                bgPlayerRef.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: 'command', func: 'setVolume', args: [0] }),
                  '*'
                );
                bgPlayerRef.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
                  '*'
                );
              } catch {}
            };
            sendPause();
            setTimeout(sendPause, 150);
            setBgPlayback((curr) => curr && { ...curr, isPaused: true, volume: 0 });
          }
          return;
        }

        if (request.action === 'resume') {
          if (channel === 'bg' || channel === 'all') {
            const targetVol = request.volume ?? 0.35;
            const sendResume = () => {
              try {
                bgPlayerRef.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: 'command', func: 'unMute', args: '' }),
                  '*'
                );
                bgPlayerRef.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(targetVol * 100)] }),
                  '*'
                );
                bgPlayerRef.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
                  '*'
                );
              } catch {}
            };
            sendResume();
            setTimeout(sendResume, 150);
            setBgPlayback((curr) => curr && { ...curr, isPaused: false, volume: targetVol });
          }
          return;
        }

        if (request.action === 'volume') {
          if (channel === 'bg' || channel === 'all') {
            const targetVol = request.volume ?? 0;
            const sendVol = () => {
              try {
                if (targetVol === 0) {
                  bgPlayerRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ event: 'command', func: 'mute', args: '' }),
                    '*'
                  );
                  bgPlayerRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
                    '*'
                  );
                } else {
                  bgPlayerRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ event: 'command', func: 'unMute', args: '' }),
                    '*'
                  );
                  bgPlayerRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
                    '*'
                  );
                }
                bgPlayerRef.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(targetVol * 100)] }),
                  '*'
                );
              } catch {}
            };
            sendVol();
            setTimeout(sendVol, 150);
            setBgPlayback((curr) => curr && { ...curr, volume: targetVol, isPaused: targetVol === 0 });
          }
          if (channel === 'sfx' || channel === 'all') {
            const sfxVol = request.volume ?? 0.85;
            try {
              sfxPlayerRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(sfxVol * 100)] }),
                '*'
              );
            } catch {}
            setSfxPlayback((curr) => curr && { ...curr, volume: sfxVol });
          }
          return;
        }

        if (!request.videoId) return;

        if (channel === 'bg') {
          setBgPlayback({
            videoId: request.videoId,
            loop: true,
            volume: request.volume ?? 0.35,
            playId: Date.now(),
            isPaused: false,
          });
        } else {
          setSfxPlayback({
            videoId: request.videoId,
            loop: Boolean(request.loop),
            volume: request.volume ?? 0.85,
            playId: Date.now(),
          });
        }
      }, 0);
    };

    window.addEventListener(YOUTUBE_AUDIO_EVENT, handleYoutubeAudio);
    return () => window.removeEventListener(YOUTUBE_AUDIO_EVENT, handleYoutubeAudio);
  }, []);

  // Sync BG volume when volume changes
  useEffect(() => {
    if (!bgPlayback) return;
    const sendVolume = () => {
      const vol = Math.round(bgPlayback.volume * 100);
      const cw = bgPlayerRef.current?.contentWindow;
      if (!cw) return;

      if (vol === 0 || bgPlayback.isPaused) {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: '' }), '*');
        cw.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
      } else {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
        cw.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }), '*');
        cw.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
      }
    };

    sendVolume();
    const intervals = [100, 300, 700, 1500];
    const timers = intervals.map((d) => window.setTimeout(sendVolume, d));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [bgPlayback?.volume, bgPlayback?.videoId, bgPlayback?.isPaused]);

  // Play SFX reliably as soon as iframe mounts and on player ready
  useEffect(() => {
    if (!sfxPlayback) return;
    const vol = Math.round(sfxPlayback.volume * 100);

    const sendPlay = () => {
      const cw = sfxPlayerRef.current?.contentWindow;
      if (!cw) return;
      try {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*');
        cw.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }), '*');
        cw.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
      } catch {}
    };

    sendPlay();
    const intervals = [80, 200, 450, 800, 1300, 2000, 2800];
    const timers = intervals.map((d) => window.setTimeout(sendPlay, d));

    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === 'string' && (e.data.includes('onReady') || e.data.includes('initialDelivery') || e.data.includes('infoDelivery'))) {
        sendPlay();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('message', handleMessage);
    };
  }, [sfxPlayback?.playId, sfxPlayback?.videoId, sfxPlayback?.volume]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const bgParams = bgPlayback ? new URLSearchParams({
    autoplay: '1',
    controls: '0',
    playsinline: '1',
    loop: '1',
    enablejsapi: '1',
    playlist: bgPlayback.videoId,
    ...(origin ? { origin } : {}),
  }) : null;

  const sfxParams = sfxPlayback ? new URLSearchParams({
    autoplay: '1',
    controls: '0',
    playsinline: '1',
    loop: sfxPlayback.loop ? '1' : '0',
    enablejsapi: '1',
    ...(origin ? { origin } : {}),
    ...(sfxPlayback.loop ? { playlist: sfxPlayback.videoId } : {}),
  }) : null;

  if (!bgPlayback && !sfxPlayback) return null;

  return (
    <div
      className="fixed pointer-events-none overflow-hidden z-[-1]"
      style={{ left: '-9999px', top: '-9999px', width: '320px', height: '240px', opacity: 0.01 }}
      aria-hidden="true"
    >
      {bgPlayback && (
        <iframe
          key={`bg-${bgPlayback.videoId}`}
          ref={bgPlayerRef}
          src={`https://www.youtube.com/embed/${bgPlayback.videoId}?${bgParams?.toString()}`}
          title="Background Music Player"
          style={{ width: '320px', height: '240px' }}
          allow="autoplay; encrypted-media; clipboard-write"
        />
      )}
      {sfxPlayback && (
        <iframe
          key={`sfx-${sfxPlayback.videoId}-${sfxPlayback.playId}`}
          ref={sfxPlayerRef}
          src={`https://www.youtube.com/embed/${sfxPlayback.videoId}?${sfxParams?.toString()}`}
          title="SFX Sound Player"
          style={{ width: '320px', height: '240px' }}
          allow="autoplay; encrypted-media; clipboard-write"
        />
      )}
    </div>
  );
}
