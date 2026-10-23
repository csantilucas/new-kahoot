"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { soundManager, AudioCategory, CustomAudioItem, CustomAudioConfig } from '@/lib/sound';
import {
  Music,
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  Sparkles,
  Upload,
  Link,
  Play,
  Square,
  Trash2,
  Volume2,
  Check,
  RotateCcw,
  PlusCircle,
  X,
  FileAudio,
} from 'lucide-react';

interface AudioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { type: AudioCategory; label: string; icon: any; desc: string }[] = [
  {
    type: 'bgMusic',
    label: 'Música de Fundo (Tensão)',
    icon: Music,
    desc: 'Trilha sonora contínua durante o tempo de exibição da questão',
  },
  {
    type: 'timeUp',
    label: 'Tempo Esgotado (Sirene / Buzzer)',
    icon: Clock,
    desc: 'Alarme tocado quando o cronômetro zera e o tempo acaba',
  },
  {
    type: 'correct',
    label: 'Resposta Certa (Revelação)',
    icon: CheckCircle2,
    desc: 'Áudio festivo tocado logo após o tempo finalizar revelando a alternativa certa',
  },
  {
    type: 'ticking',
    label: 'Tic-tac do Cronômetro',
    icon: Timer,
    desc: 'Batimento ritmado nos últimos segundos de urgência',
  },
];

export function AudioConfigModal({ isOpen, onClose }: AudioConfigModalProps) {
  const [config, setConfig] = useState<CustomAudioConfig>({ items: [] });
  const [activeCategory, setActiveCategory] = useState<AudioCategory>('bgMusic');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  
  // New audio form state
  const [newAudioName, setNewAudioName] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [audioMode, setAudioMode] = useState<'file' | 'url'>('file');
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadConfig = () => {
    const cfg = soundManager.getConfig();
    setConfig({ ...cfg });
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    } else {
      soundManager.stopPreview();
      setPreviewingId(null);
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      alert('Por favor, selecione um arquivo de áudio válido (.mp3, .wav, .ogg, .m4a)');
      return;
    }

    setFileLoading(true);
    const sizeStr = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    setSelectedFileName(file.name);
    setSelectedFileSize(sizeStr);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setNewAudioUrl(dataUrl);
      if (!newAudioName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setNewAudioName(cleanName);
      }
      setFileLoading(false);
    };
    reader.onerror = () => {
      alert('Erro ao carregar o arquivo de áudio.');
      setFileLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setNewAudioUrl('');
    setSelectedFileName('');
    setSelectedFileSize('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (previewingId === 'temp') {
      soundManager.stopPreview();
      setPreviewingId(null);
    }
  };

  const handleSaveAudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudioUrl.trim()) {
      alert('Por favor, envie um arquivo ou insira uma URL de áudio.');
      return;
    }

    const title = newAudioName.trim() || selectedFileName || `Áudio ${activeCategory} ${Date.now().toString().slice(-4)}`;
    
    soundManager.addCustomAudio({
      name: title,
      type: activeCategory,
      sourceType: audioMode,
      url: newAudioUrl,
    });

    setNewAudioName('');
    setNewAudioUrl('');
    setSelectedFileName('');
    setSelectedFileSize('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadConfig();
  };

  const handleDeleteAudio = (id: string) => {
    if (previewingId === id) {
      soundManager.stopPreview();
      setPreviewingId(null);
    }
    soundManager.deleteCustomAudio(id);
    loadConfig();
  };

  const handleToggleActive = (id: string | null) => {
    soundManager.setActiveAudio(activeCategory, id);
    loadConfig();
  };

  const handleTogglePreview = (id: string, url: string) => {
    if (previewingId === id) {
      soundManager.stopPreview();
      setPreviewingId(null);
    } else {
      setPreviewingId(id);
      soundManager.previewAudio(url, () => {
        setPreviewingId(null);
      });
    }
  };

  const handleTestProcedural = () => {
    soundManager.stopPreview();
    setPreviewingId('procedural');
    switch (activeCategory) {
      case 'bgMusic':
        soundManager.startBackgroundMusic('suspense');
        setTimeout(() => {
          soundManager.stopBackgroundMusic();
          setPreviewingId(null);
        }, 3500);
        break;
      case 'correct':
        soundManager.playCorrectAnswer();
        setTimeout(() => setPreviewingId(null), 1200);
        break;
      case 'wrong':
        soundManager.playWrongAnswer();
        setTimeout(() => setPreviewingId(null), 1000);
        break;
      case 'timeUp':
        soundManager.playTimeUpBuzzer();
        setTimeout(() => setPreviewingId(null), 1200);
        break;
      case 'ticking':
        soundManager.playTickingSound();
        setTimeout(() => setPreviewingId(null), 500);
        break;
      case 'fiftyFifty':
        soundManager.playFiftyFifty();
        setTimeout(() => setPreviewingId(null), 700);
        break;
    }
  };

  const categoryItems = config.items.filter(i => i.type === activeCategory);
  
  // Get active item id for current category
  const activeKey = (
    activeCategory === 'bgMusic' ? 'activeBgMusicId' :
    activeCategory === 'correct' ? 'activeCorrectId' :
    activeCategory === 'wrong' ? 'activeWrongId' :
    activeCategory === 'timeUp' ? 'activeTimeUpId' :
    activeCategory === 'ticking' ? 'activeTickingId' : 'activeFiftyFiftyId'
  ) as keyof CustomAudioConfig;

  const currentActiveId = config[activeKey] as string | null | undefined;
  const currentCategoryInfo = CATEGORIES.find(c => c.type === activeCategory);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-3xl md:max-w-4xl max-h-[92vh] flex flex-col p-5 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#3702B3]/10 text-[#3702B3] shrink-0">
              <Volume2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Personalização de Áudios</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre seus próprios arquivos de música, vinhetas e efeitos sonoros para as revisões na TV.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Category Tabs & Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 pt-3 overflow-hidden">
          
          {/* LEFT: Category Select List (4 Cols) */}
          <div className="md:col-span-4 space-y-1.5 overflow-y-auto pr-1 min-h-0">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block px-2 pb-1">
              Eventos Sonoros
            </span>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.type;
              const hasCustomActive = config.items.some(
                i => i.type === cat.type && (
                  (cat.type === 'bgMusic' && config.activeBgMusicId === i.id) ||
                  (cat.type === 'correct' && config.activeCorrectId === i.id) ||
                  (cat.type === 'wrong' && config.activeWrongId === i.id) ||
                  (cat.type === 'timeUp' && config.activeTimeUpId === i.id) ||
                  (cat.type === 'ticking' && config.activeTickingId === i.id) ||
                  (cat.type === 'fiftyFifty' && config.activeFiftyFiftyId === i.id)
                )
              );

              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => {
                    soundManager.stopPreview();
                    setPreviewingId(null);
                    setActiveCategory(cat.type);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#3702B3] text-white border-[#3702B3] shadow-xs font-semibold'
                      : 'hover:bg-muted/60 border-transparent text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#3702B3]'}`} />
                    <span className="text-xs truncate">{cat.label.split('(')[0]}</span>
                  </div>
                  {hasCustomActive && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                      isSelected ? 'bg-white text-[#3702B3]' : 'bg-[#3702B3]/10 text-[#3702B3]'
                    }`}>
                      Ativo
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* RIGHT: Active Category Manager & Add Card (8 Cols) */}
          <div className="md:col-span-8 flex flex-col space-y-4 overflow-y-auto pr-2 min-h-0">
            
            {/* Category Header Banner */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {currentCategoryInfo?.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentCategoryInfo?.desc}
              </p>
            </div>

            {/* List of Registered Audios for this Category */}
            <div className="space-y-2 shrink-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Áudios Disponíveis ({categoryItems.length + 1})
              </span>

              {/* Default procedural sound card */}
              <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-colors ${
                !currentActiveId
                  ? 'bg-[#3702B3]/5 border-[#3702B3]/40 ring-1 ring-[#3702B3]/20'
                  : 'bg-card border-border hover:bg-muted/20'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">Som Padrão do Sistema</span>
                    <span className="text-[10px] text-muted-foreground block truncate">Sintetizador nativo (Show do Milhão)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1"
                    onClick={handleTestProcedural}
                  >
                    {previewingId === 'procedural' ? <Square className="h-3 w-3 text-red-500" /> : <Play className="h-3 w-3 text-emerald-600" />}
                    <span>Testar</span>
                  </Button>

                  {!currentActiveId ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#3702B3] text-white flex items-center gap-1 shadow-xs">
                      <Check className="h-3 w-3" /> Em Uso
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-slate-300 dark:border-slate-700"
                      onClick={() => handleToggleActive(null)}
                    >
                      Ativar
                    </Button>
                  )}
                </div>
              </div>

              {/* Custom registered audios list */}
              {categoryItems.map((item) => {
                const isActive = currentActiveId === item.id;
                const isPlaying = previewingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-colors ${
                      isActive
                        ? 'bg-[#3702B3]/5 border-[#3702B3] ring-1 ring-[#3702B3]/30'
                        : 'bg-card border-border hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive ? 'bg-[#3702B3] text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Music className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="text-xs font-bold block truncate">{item.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {item.sourceType === 'file' ? 'Arquivo Local' : 'Link Web'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => handleTogglePreview(item.id, item.url)}
                      >
                        {isPlaying ? <Square className="h-3 w-3 text-red-500" /> : <Play className="h-3 w-3 text-emerald-600" />}
                        <span>{isPlaying ? 'Parar' : 'Ouvir'}</span>
                      </Button>

                      {isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#3702B3] text-white flex items-center gap-1 shadow-xs">
                          <Check className="h-3 w-3" /> Em Uso
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-slate-300 dark:border-slate-700"
                          onClick={() => handleToggleActive(item.id)}
                        >
                          Ativar
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteAudio(item.id)}
                        title="Excluir áudio cadastrado"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CARD DE CADASTRO DE NOVO ÁUDIO COM LAYOUT IMPECÁVEL */}
            <div className="bg-white dark:bg-slate-900 border-2 border-[#3702B3]/25 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#3702B3]/10 text-[#3702B3] flex items-center justify-center shrink-0">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Cadastrar Novo Áudio
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Para: <strong className="text-[#3702B3]">{currentCategoryInfo?.label.split('(')[0]}</strong>
                    </p>
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setAudioMode('file'); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      audioMode === 'file'
                        ? 'bg-white dark:bg-slate-900 text-[#3702B3] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="h-3 w-3" /> Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAudioMode('url'); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      audioMode === 'url'
                        ? 'bg-white dark:bg-slate-900 text-[#3702B3] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Link className="h-3 w-3" /> Link Web
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveAudio} className="space-y-3.5">
                {/* File Upload Mode */}
                {audioMode === 'file' ? (
                  <div className="space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="audio-custom-file-input"
                    />

                    {!selectedFileName ? (
                      <label
                        htmlFor="audio-custom-file-input"
                        className="border-2 border-dashed border-[#3702B3]/30 hover:border-[#3702B3] bg-[#3702B3]/[0.02] hover:bg-[#3702B3]/[0.05] rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group block"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#3702B3]/10 text-[#3702B3] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
                            {fileLoading ? 'Lendo arquivo de áudio...' : 'Clique para escolher seu arquivo de áudio'}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            Formatos: MP3, WAV, OGG, M4A ou AAC
                          </span>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <FileAudio className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {selectedFileName}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="font-semibold text-emerald-600">✓ Pronto para salvar</span>
                              <span>•</span>
                              <span>{selectedFileSize}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePreview('temp', newAudioUrl)}
                            className="h-7 text-xs px-2 gap-1 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          >
                            {previewingId === 'temp' ? <Square className="h-3 w-3 text-red-500" /> : <Play className="h-3 w-3 text-emerald-600" />}
                            <span>{previewingId === 'temp' ? 'Parar' : 'Ouvir'}</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFile}
                            className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                            title="Trocar arquivo"
                          >
                            <X className="h-3.5 w-3.5 mr-0.5" /> Trocar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* URL Link Mode */
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Link / URL direta do áudio
                      </label>
                      {newAudioUrl && (
                        <button
                          type="button"
                          onClick={() => handleTogglePreview('temp', newAudioUrl)}
                          className="text-[11px] text-[#3702B3] hover:underline flex items-center gap-1 font-semibold"
                        >
                          {previewingId === 'temp' ? <Square className="h-2.5 w-2.5 text-red-500" /> : <Play className="h-2.5 w-2.5" />}
                          {previewingId === 'temp' ? 'Parar teste' : 'Testar áudio do link'}
                        </button>
                      )}
                    </div>
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/audio.mp3"
                      value={newAudioUrl}
                      onChange={(e) => setNewAudioUrl(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-slate-950/60"
                    />
                  </div>
                )}

                {/* Audio Title / Label Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Nome de Identificação (Opcional)
                  </label>
                  <Input
                    placeholder="Ex: Minha Trilha Especial, Efeito de Vitória..."
                    value={newAudioName}
                    onChange={(e) => setNewAudioName(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-950/60"
                  />
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={!newAudioUrl.trim() || fileLoading}
                  className="w-full h-9 text-xs sm:text-sm bg-[#3702B3] hover:bg-[#2c0191] text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Salvar Áudio na Categoria</span>
                </Button>
              </form>
            </div>

          </div>
        </div>

        <DialogFooter className="pt-3 border-t mt-2 shrink-0">
          <Button
            type="button"
            onClick={onClose}
            className="h-8 text-xs bg-[#3702B3] hover:bg-[#2c0191] text-white font-semibold"
          >
            Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
