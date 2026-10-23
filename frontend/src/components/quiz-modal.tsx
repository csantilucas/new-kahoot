"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Quiz, api } from '@/lib/api';
import { soundManager } from '@/lib/sound';
import {
  Music,
  Zap,
  Timer,
  ArrowRightCircle,
  Play,
  Square,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  Clock,
  Volume2,
} from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedQuiz: Quiz) => void;
  quizToEdit?: Quiz | null;
}

export function QuizModal({ isOpen, onClose, onSuccess, quizToEdit }: QuizModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ENEM');
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(45);
  const [warningSeconds, setWarningSeconds] = useState(8);
  const [bgMusic, setBgMusic] = useState('custom');
  const [soundEffects, setSoundEffects] = useState(true);
  const [entranceEffect, setEntranceEffect] = useState<'normal' | 'delay' | 'step_by_step'>('normal');
  const [showExplanation, setShowExplanation] = useState(true);

  // Audio links per quiz (stored in PostgreSQL via API)
  const [customMusicUrl, setCustomMusicUrl] = useState('');
  const [correctSoundUrl, setCorrectSoundUrl] = useState('');
  const [timeUpSoundUrl, setTimeUpSoundUrl] = useState('');
  const [countdownSoundUrl, setCountdownSoundUrl] = useState('');
  const [confettiSoundUrl, setConfettiSoundUrl] = useState('');

  const [previewingField, setPreviewingField] = useState<string | null>(null);
  const [showAudioSection, setShowAudioSection] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quizToEdit) {
      setTitle(quizToEdit.title);
      setDescription(quizToEdit.description || '');
      setCategory(quizToEdit.category || 'ENEM');
      setSecondsPerQuestion(quizToEdit.secondsPerQuestion || 120);
      setWarningSeconds(quizToEdit.warningSeconds || 10);
      setBgMusic(quizToEdit.bgMusic || 'custom');
      setSoundEffects(quizToEdit.soundEffects ?? true);
      setEntranceEffect(((quizToEdit.entranceEffect as any) || 'normal') as any);
      setShowExplanation(quizToEdit.showExplanation ?? true);

      setCustomMusicUrl(quizToEdit.customMusicUrl || '');
      setCorrectSoundUrl(quizToEdit.correctSoundUrl || '');
      setTimeUpSoundUrl(quizToEdit.timeUpSoundUrl || '');
      setCountdownSoundUrl(quizToEdit.countdownSoundUrl || '');
      setConfettiSoundUrl(quizToEdit.confettiSoundUrl || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('ENEM');
      setSecondsPerQuestion(120);
      setWarningSeconds(10);
      setBgMusic('custom');
      setSoundEffects(true);
      setEntranceEffect('normal');
      setShowExplanation(true);

      setCustomMusicUrl('https://www.youtube.com/watch?v=wbFxNbLWaRo');
      setCorrectSoundUrl('https://www.youtube.com/watch?v=HvPajEdundA');
      setTimeUpSoundUrl('https://www.youtube.com/watch?v=nfLftXz_37g');
      setCountdownSoundUrl('https://www.youtube.com/watch?v=saFHtWkxNMw');
      setConfettiSoundUrl('https://www.youtube.com/watch?v=nfLftXz_37g');
    }
    setError('');
    soundManager.stopPreview();
    setPreviewingField(null);
  }, [quizToEdit, isOpen]);

  const handleTogglePreview = (field: string, url: string) => {
    if (!url.trim()) return;

    if (previewingField === field) {
      soundManager.stopPreview();
      setPreviewingField(null);
    } else {
      setPreviewingField(field);
      soundManager.previewAudio(url, () => {
        setPreviewingField(null);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Informe o título.');
      return;
    }

    setLoading(true);
    setError('');
    soundManager.stopPreview();

    try {
      const payload: Partial<Quiz> = {
        title,
        description,
        category,
        secondsPerQuestion,
        warningSeconds,
        bgMusic: customMusicUrl ? 'custom' : bgMusic,
        soundEffects,
        entranceEffect,
        autoReveal: true,
        showExplanation,
        customMusicUrl: customMusicUrl.trim() || null,
        correctSoundUrl: correctSoundUrl.trim() || null,
        timeUpSoundUrl: timeUpSoundUrl.trim() || null,
        countdownSoundUrl: countdownSoundUrl.trim() || null,
        confettiSoundUrl: confettiSoundUrl.trim() || null,
      };

      let result: Quiz;
      if (quizToEdit) {
        result = await api.updateQuiz(quizToEdit.id, payload);
      } else {
        result = await api.createQuiz(payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar revisão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        soundManager.stopPreview();
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quizToEdit ? 'Editar Revisão' : 'Nova Revisão'}</DialogTitle>
          <DialogDescription>
            Defina título, regras de tempo e personalize os links de áudio exclusivos desta revisão.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Título da Revisão</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aulão ENEM Oficial - Todas as Áreas"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: ENEM, História, Biologia"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição curta"
              />
            </div>
          </div>

          {/* Efeitos de Apresentação / Entrada */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Efeito de Entrada das Questões
              </label>
              <span className="text-[11px] text-[#3702B3] font-semibold">
                Tempo corre só após o efeito
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Normal */}
              <button
                type="button"
                onClick={() => setEntranceEffect('normal')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  entranceEffect === 'normal'
                    ? 'border-[#3702B3] bg-[#3702B3]/5 ring-2 ring-[#3702B3]/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-card'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-1.5 rounded-lg ${entranceEffect === 'normal' ? 'bg-[#3702B3] text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    entranceEffect === 'normal' ? 'border-[#3702B3] bg-[#3702B3]' : 'border-slate-300'
                  }`}>
                    {entranceEffect === 'normal' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">1. Normal</span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Pergunta e alternativas aparecem juntas.
                  </span>
                </div>
              </button>

              {/* Option 2: Delay */}
              <button
                type="button"
                onClick={() => setEntranceEffect('delay')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  entranceEffect === 'delay'
                    ? 'border-[#3702B3] bg-[#3702B3]/5 ring-2 ring-[#3702B3]/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-card'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-1.5 rounded-lg ${entranceEffect === 'delay' ? 'bg-[#3702B3] text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Timer className="h-4 w-4" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    entranceEffect === 'delay' ? 'border-[#3702B3] bg-[#3702B3]' : 'border-slate-300'
                  }`}>
                    {entranceEffect === 'delay' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">2. Delay</span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Pergunta primeiro, alternativas entram depois.
                  </span>
                </div>
              </button>

              {/* Option 3: Step by Step */}
              <button
                type="button"
                onClick={() => setEntranceEffect('step_by_step')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  entranceEffect === 'step_by_step'
                    ? 'border-[#3702B3] bg-[#3702B3]/5 ring-2 ring-[#3702B3]/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-card'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-1.5 rounded-lg ${entranceEffect === 'step_by_step' ? 'bg-[#3702B3] text-white' : 'bg-muted text-muted-foreground'}`}>
                    <ArrowRightCircle className="h-4 w-4" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    entranceEffect === 'step_by_step' ? 'border-[#3702B3] bg-[#3702B3]' : 'border-slate-300'
                  }`}>
                    {entranceEffect === 'step_by_step' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">3. Passo a Passo</span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Desliza pergunta, depois alt. A, B, C...
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Time & Warning */}
          <div className="p-3.5 border rounded-lg space-y-3 bg-muted/30">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>Tempo por questão (começa após o efeito)</span>
                <span className="font-semibold">{secondsPerQuestion} segundos</span>
              </div>
              <Slider
                value={[secondsPerQuestion]}
                min={10}
                max={300}
                step={5}
                onValueChange={(val: any) => {
                  const num = Array.isArray(val) ? val[0] : Number(val);
                  setSecondsPerQuestion(num);
                }}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>Alerta nos últimos</span>
                <span className="font-semibold text-destructive">{warningSeconds} segundos</span>
              </div>
              <Slider
                value={[warningSeconds]}
                min={3}
                max={30}
                step={1}
                onValueChange={(val: any) => {
                  const num = Array.isArray(val) ? val[0] : Number(val);
                  setWarningSeconds(num);
                }}
              />
            </div>
          </div>

          {/* SEÇÃO DE ÁUDIOS GERENCIADOS PELA API (APENAS LINKS) */}
          <div className="border rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#3702B3]/10 text-[#3702B3]">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                    Áudios e Efeitos desta Revisão (Via Link)
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Gerenciados pela API. Insira links do YouTube ou arquivos de áudio web.
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                API Salva
              </span>
            </div>

            {/* 1. Música de Fundo */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Music className="h-3.5 w-3.5 text-[#3702B3]" />
                  Música de Fundo (Tema de Abertura / Tensão)
                </label>
                {customMusicUrl && (
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('customMusicUrl', customMusicUrl)}
                    className="text-[11px] font-semibold text-[#3702B3] hover:underline flex items-center gap-1"
                  >
                    {previewingField === 'customMusicUrl' ? <Square className="h-3 w-3 text-red-500" /> : <Play className="h-3 w-3 text-emerald-600" />}
                    <span>{previewingField === 'customMusicUrl' ? 'Parar' : 'Testar Áudio'}</span>
                  </button>
                )}
              </div>
              <Input
                type="url"
                value={customMusicUrl}
                onChange={(e) => setCustomMusicUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=wbFxNbLWaRo"
                className="h-8 text-xs bg-white dark:bg-slate-950"
              />
            </div>

            {/* 2. Resposta Certa */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Mostrar Resposta Certa (Silvio Santos / Vinheta)
                </label>
                {correctSoundUrl && (
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('correctSoundUrl', correctSoundUrl)}
                    className="text-[11px] font-semibold text-[#3702B3] hover:underline flex items-center gap-1"
                  >
                    {previewingField === 'correctSoundUrl' ? <Square className="h-3 w-3 text-red-500" /> : <Play className="h-3 w-3 text-emerald-600" />}
                    <span>{previewingField === 'correctSoundUrl' ? 'Parar' : 'Testar Áudio'}</span>
                  </button>
                )}
              </div>
              <Input
                type="url"
                value={correctSoundUrl}
                onChange={(e) => setCorrectSoundUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=HvPajEdundA"
                className="h-8 text-xs bg-white dark:bg-slate-950"
              />
            </div>

            {/* 3. Quando o Tempo Acabar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  Quando o Tempo Acabar (Sirene / Seleção)
                </label>
                {timeUpSoundUrl && (
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('timeUpSoundUrl', timeUpSoundUrl)}
                    className="text-[11px] font-semibold text-[#3702B3] hover:underline flex items-center gap-1"
                  >
                    {previewingField === 'timeUpSoundUrl' ? <Square className="h-3 w-3 text-red-500" /> : <Play className="h-3 w-3 text-emerald-600" />}
                    <span>{previewingField === 'timeUpSoundUrl' ? 'Parar' : 'Testar Áudio'}</span>
                  </button>
                )}
              </div>
              <Input
                type="url"
                value={timeUpSoundUrl}
                onChange={(e) => setTimeUpSoundUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=nfLftXz_37g"
                className="h-8 text-xs bg-white dark:bg-slate-950"
              />
            </div>

            {/* 4. Contagem Final */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-rose-500" />
                  Contagem Final (10 Segundos Silvio Santos)
                </label>
                {countdownSoundUrl && (
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('countdownSoundUrl', countdownSoundUrl)}
                    className="text-[11px] font-semibold text-[#3702B3] hover:underline flex items-center gap-1"
                  >
                    {previewingField === 'countdownSoundUrl' ? <Square className="h-3 w-3 text-red-500" /> : <Play className="h-3 w-3 text-emerald-600" />}
                    <span>{previewingField === 'countdownSoundUrl' ? 'Parar' : 'Testar Áudio'}</span>
                  </button>
                )}
              </div>
              <Input
                type="url"
                value={countdownSoundUrl}
                onChange={(e) => setCountdownSoundUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=saFHtWkxNMw"
                className="h-8 text-xs bg-white dark:bg-slate-950"
              />
            </div>

            {/* 5. Efeito do Confete */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                  Efeito do Confete (Comemoração ao finalizar)
                </label>
                {confettiSoundUrl && (
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('confettiSoundUrl', confettiSoundUrl)}
                    className="text-[11px] font-semibold text-[#3702B3] hover:underline flex items-center gap-1"
                  >
                    {previewingField === 'confettiSoundUrl' ? <Square className="h-3 w-3 text-red-500" /> : <Play className="h-3 w-3 text-emerald-600" />}
                    <span>{previewingField === 'confettiSoundUrl' ? 'Parar' : 'Testar Áudio'}</span>
                  </button>
                )}
              </div>
              <Input
                type="url"
                value={confettiSoundUrl}
                onChange={(e) => setConfettiSoundUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=nfLftXz_37g"
                className="h-8 text-xs bg-white dark:bg-slate-950"
              />
            </div>

            {/* Informação sobre o relógio tocando */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg">
              <span className="flex items-center gap-1 font-medium">
                <Timer className="h-3.5 w-3.5 text-[#3702B3]" />
                Som do Relógio Tocando (Tic-tac)
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Padrão Nativo do Frontend
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm">Efeitos Sonoros (acerto, alarme, contagem)</span>
            <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Mostrar comentário/resolução após resposta</span>
            <Switch checked={showExplanation} onCheckedChange={setShowExplanation} />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                soundManager.stopPreview();
                onClose();
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#3702B3] hover:bg-[#2c0191] text-white">
              {loading ? 'Salvando...' : quizToEdit ? 'Atualizar Revisão' : 'Criar Revisão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
