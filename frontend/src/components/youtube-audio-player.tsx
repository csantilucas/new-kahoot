"use client";

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { soundManager, YOUTUBE_AUDIO_EVENT } from '@/lib/sound';

interface YoutubeAudioRequest {
  action: 'play' | 'stop' | 'volume';
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
  const [playback, setPlayback] = useState<YoutubePlayback | null>(null);
  const playerRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleYoutubeAudio = (event: Event) => {
      const request = (event as CustomEvent<YoutubeAudioRequest>).detail;
      if (request.action === 'stop') {
        setPlayback(null);
        return;
      }

      if (request.action === 'volume') {
        setPlayback((current) => current && { ...current, volume: request.volume ?? current.volume });
        return;
      }

      if (!request.videoId) return;
      setPlayback({
        videoId: request.videoId,
        loop: Boolean(request.loop),
        volume: request.volume ?? 1,
      });
    };

    window.addEventListener(YOUTUBE_AUDIO_EVENT, handleYoutubeAudio);
    return () => window.removeEventListener(YOUTUBE_AUDIO_EVENT, handleYoutubeAudio);
  }, []);

  useEffect(() => {
    if (!playback) return;

    const setPlayerVolume = () => {
      playerRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [Math.round(playback.volume * 100)],
        }),
        'https://www.youtube-nocookie.com'
      );
    };
    const retryTimer = window.setTimeout(setPlayerVolume, 500);

    return () => window.clearTimeout(retryTimer);
  }, [playback]);

  if (!playback) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    controls: '1',
    playsinline: '1',
    loop: playback.loop ? '1' : '0',
    enablejsapi: '1',
    origin: window.location.origin,
    ...(playback.loop ? { playlist: playback.videoId } : {}),
  });

  return (
    <aside className="hidden fixed bottom-24 right-4 z-[60] w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-background shadow-xl">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs font-semibold">Player oficial do YouTube</span>
        <button
          type="button"
          onClick={() => soundManager.stopYoutubeAudio()}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Parar áudio do YouTube"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <iframe
        key={`${playback.videoId}-${playback.loop}`}
        ref={playerRef}
        src={`https://www.youtube-nocookie.com/embed/${playback.videoId}?${params.toString()}`}
        title="Player oficial do YouTube"
        className="aspect-video w-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </aside>
  );
}
