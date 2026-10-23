"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Quiz, api } from '@/lib/api';
import { soundManager } from '@/lib/sound';
import { Music, Zap, Timer, ArrowRightCircle } from 'lucide-react';
import { AudioConfigModal } from './audio-config-modal';

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
  const [bgMusic, setBgMusic] = useState('ticking');
  const [soundEffects, setSoundEffects] = useState(true);
  const [entranceEffect, setEntranceEffect] = useState<'normal' | 'delay' | 'step_by_step'>('normal');
  const [showExplanation, setShowExplanation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [customBgTracks, setCustomBgTracks] = useState(soundManager.getConfig().items.filter(i => i.type === 'bgMusic'));

  useEffect(() => {
    if (quizToEdit) {
      setTitle(quizToEdit.title);
      setDescription(quizToEdit.description || '');
      setCategory(quizToEdit.category || 'ENEM');
      setSecondsPerQuestion(quizToEdit.secondsPerQuestion || 45);
      setWarningSeconds(quizToEdit.warningSeconds || 8);
      setBgMusic(quizToEdit.bgMusic || 'ticking');
      setSoundEffects(quizToEdit.soundEffects ?? true);
      setEntranceEffect(((quizToEdit.entranceEffect as any) || 'normal') as any);
      setShowExplanation(quizToEdit.showExplanation ?? true);
    } else {
      setTitle('');
      setDescription('');
      setCategory('ENEM');
      setSecondsPerQuestion(45);
      setWarningSeconds(8);
      setBgMusic('ticking');
      setSoundEffects(true);
      setEntranceEffect('normal');
      setShowExplanation(true);
    }
    setError('');
  }, [quizToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Informe o título.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        description,
        category,
        secondsPerQuestion,
        warningSeconds,
        bgMusic,
        soundEffects,
        entranceEffect,
        autoReveal: true,
        showExplanation,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quizToEdit ? 'Editar Revisão' : 'Nova Revisão'}</DialogTitle>
          <DialogDescription>
            Defina o título, tempo por questão e preferências de exibição na TV.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Simulado ENEM - Linguagens"
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
                max={120}
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
                max={15}
                step={1}
                onValueChange={(val: any) => {
                  const num = Array.isArray(val) ? val[0] : Number(val);
                  setWarningSeconds(num);
                }}
              />
            </div>
          </div>

          {/* Soundtrack */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Trilha Sonora</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAudioModalOpen(true);
                }}
                className="h-6 text-xs text-[#3702B3] hover:text-[#2c0191] hover:bg-[#3702B3]/5 p-1 gap-1"
              >
                <Music className="h-3 w-3" /> Meus Áudios
              </Button>
            </div>
            <select
              value={bgMusic}
              onChange={(e) => setBgMusic(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <optgroup label="Temas Nativos">
                <option value="ticking">Relógio (Tic-tac)</option>
                <option value="suspense">Tensão (Show do Milhão)</option>
                <option value="kahoot">Animada (Kahoot)</option>
                <option value="epic">Épica</option>
                <option value="none">Silêncio (Sem música)</option>
              </optgroup>
              {customBgTracks.length > 0 && (
                <optgroup label="Meus Áudios Cadastrados">
                  {customBgTracks.map(track => (
                    <option key={track.id} value={track.url}>
                      ★ {track.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm">Efeitos Sonoros (acerto, erro, alarme)</span>
            <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Mostrar comentário/resolução após resposta</span>
            <Switch checked={showExplanation} onCheckedChange={setShowExplanation} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : quizToEdit ? 'Atualizar' : 'Criar Revisão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AudioConfigModal
        isOpen={isAudioModalOpen}
        onClose={() => {
          setIsAudioModalOpen(false);
          setCustomBgTracks(soundManager.getConfig().items.filter(i => i.type === 'bgMusic'));
        }}
      />
    </Dialog>
  );
}
