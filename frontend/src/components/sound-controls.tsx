"use client";

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, SlidersHorizontal, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { soundManager } from '@/lib/sound';
import { AudioConfigModal } from './audio-config-modal';

interface SoundControlsProps {
  className?: string;
  showCustomAudiosButton?: boolean;
}

export function SoundControls({ className = '', showCustomAudiosButton = true }: SoundControlsProps) {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(35);
  const [showPanel, setShowPanel] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  useEffect(() => {
    setMuted(soundManager.getMuted());
  }, []);

  const handleToggleMute = () => {
    const isMuted = soundManager.toggleMute();
    setMuted(isMuted);
  };

  const handleVolumeChange = (vals: number[]) => {
    const v = vals[0];
    setVolume(v);
    soundManager.setBgVolume(v / 100);
    soundManager.setSfxVolume(Math.min(1, (v * 1.5) / 100));
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleToggleMute}
            title={muted ? "Ativar Áudio" : "Silenciar Áudio"}
          >
            {muted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4 text-[#3702B3]" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => setShowPanel(!showPanel)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#3702B3]" />
            <span>Volume</span>
          </Button>

          {showCustomAudiosButton && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 border-[#3702B3]/30 text-[#3702B3] hover:bg-[#3702B3]/5"
              onClick={() => setIsAudioModalOpen(true)}
              title="Cadastrar e Gerenciar Áudios Próprios"
            >
              <Music className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Meus Áudios</span>
            </Button>
          )}
        </div>

        {showPanel && (
          <div className="absolute right-0 top-10 z-50 w-64 p-3.5 bg-popover text-popover-foreground border rounded-lg shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-semibold">Volume do Áudio</span>
              <span className="text-xs text-muted-foreground">{volume}%</span>
            </div>

            <div className="pt-1">
              <Slider
                value={[volume]}
                max={100}
                onValueChange={(val: any) => {
                  const v = Array.isArray(val) ? val[0] : Number(val);
                  handleVolumeChange([v]);
                }}
              />
            </div>

            <div className="pt-1 space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7 text-[#3702B3] border-[#3702B3]/30 hover:bg-[#3702B3]/5"
                onClick={() => {
                  setShowPanel(false);
                  setIsAudioModalOpen(true);
                }}
              >
                <Music className="h-3.5 w-3.5 mr-1" />
                Configurar / Adicionar Meus Áudios
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7 text-muted-foreground"
                onClick={() => soundManager.playCorrectAnswer()}
              >
                Testar Som Atual
              </Button>
            </div>
          </div>
        )}
      </div>

      <AudioConfigModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />
    </>
  );
}
