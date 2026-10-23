"use client";

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { soundManager, YOUTUBE_AUDIO_EVENT } from '@/lib/sound';

interface YoutubeAudioRequest {
  action: 'play' | 'stop' | 'volume';
  channel?: 'bg' | 'sfx' | 'all';
  videoId?: string;
  loop?: boolean;
  volume?: number;
}

interface YoutubePlayback {
  videoId: string;
  loop: boolean;
  volume: number;
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

      if (request.action === 'stop') {
        if (channel === 'bg' || channel === 'all') {
          setBgPlayback(null);
        }
        if (channel === 'sfx' || channel === 'all') {
          setSfxPlayback(null);
        }
        return;
      }

      if (request.action === 'volume') {
        if (channel === 'bg' || channel === 'all') {
          setBgPlayback((curr) => curr && { ...curr, volume: request.volume ?? curr.volume });
        }
        if (channel === 'sfx' || channel === 'all') {
          setSfxPlayback((curr) => curr && { ...curr, volume: request.volume ?? curr.volume });
        }
        return;
      }

      if (!request.videoId) return;

      if (channel === 'bg') {
        setBgPlayback({
          videoId: request.videoId,
          loop: true,
          volume: request.volume ?? 0.35,
        });
      } else {
        setSfxPlayback({
          videoId: request.videoId,
          loop: Boolean(request.loop),
          volume: request.volume ?? 0.7,
        });
      }
    };

    window.addEventListener(YOUTUBE_AUDIO_EVENT, handleYoutubeAudio);
    return () => window.removeEventListener(YOUTUBE_AUDIO_EVENT, handleYoutubeAudio);
  }, []);

  // Sync BG volume
  useEffect(() => {
    if (!bgPlayback) return;
    const sendVolume = () => {
      const vol = Math.round(bgPlayback.volume * 100);
      const cw = bgPlayerRef.current?.contentWindow;
      if (!cw) return;

      if (vol === 0) {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
      } else {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
      }
      cw.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }), '*');
    };

    sendVolume();
    const timer = window.setTimeout(sendVolume, 200);
    return () => window.clearTimeout(timer);
  }, [bgPlayback?.volume]);

  // Sync SFX volume
  useEffect(() => {
    if (!sfxPlayback) return;
    const sendVolume = () => {
      const vol = Math.round(sfxPlayback.volume * 100);
      const cw = sfxPlayerRef.current?.contentWindow;
      if (!cw) return;

      if (vol === 0) {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
      } else {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
      }
      cw.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [vol] }), '*');
    };

    sendVolume();
    const timer = window.setTimeout(sendVolume, 200);
    return () => window.clearTimeout(timer);
  }, [sfxPlayback?.volume]);

  const bgParams = bgPlayback ? new URLSearchParams({
    autoplay: '1',
    controls: '0',
    playsinline: '1',
    loop: '1',
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    playlist: bgPlayback.videoId,
  }) : null;

  const sfxParams = sfxPlayback ? new URLSearchParams({
    autoplay: '1',
    controls: '0',
    playsinline: '1',
    loop: sfxPlayback.loop ? '1' : '0',
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    ...(sfxPlayback.loop ? { playlist: sfxPlayback.videoId } : {}),
  }) : null;

  if (!bgPlayback && !sfxPlayback) return null;

  return (
    <div className="fixed -bottom-96 -right-96 w-10 h-10 opacity-0 pointer-events-none overflow-hidden z-[-1]" aria-hidden="true">
      {bgPlayback && (
        <iframe
          key={`bg-${bgPlayback.videoId}`}
          ref={bgPlayerRef}
          src={`https://www.youtube-nocookie.com/embed/${bgPlayback.videoId}?${bgParams?.toString()}`}
          title="Background Music Player"
          className="w-1 h-1"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
      {sfxPlayback && (
        <iframe
          key={`sfx-${sfxPlayback.videoId}`}
          ref={sfxPlayerRef}
          src={`https://www.youtube-nocookie.com/embed/${sfxPlayback.videoId}?${sfxParams?.toString()}`}
          title="SFX Sound Player"
          className="w-1 h-1"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
