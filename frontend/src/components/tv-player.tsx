"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, Question, Alternative } from '@/lib/api';
import { soundManager } from '@/lib/sound';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
  Trophy,
  Clock,
  ZoomIn,
  ZoomOut,
  Music,
  ArrowRightCircle,
  Image as ImageIcon,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import { AudioConfigModal } from './audio-config-modal';

interface TvPlayerProps {
  quiz: Quiz;
  onExit: () => void;
}

export function TvPlayer({ quiz, onExit }: TvPlayerProps) {
  const questions = quiz.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Duração da pergunta configurada na revisão
  const questionDuration = quiz.secondsPerQuestion && quiz.secondsPerQuestion > 0 ? quiz.secondsPerQuestion : 60;
  const [timeLeft, setTimeLeft] = useState(questionDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Entra direto no quiz sem tela de splash/abertura
  const [showIntro, setShowIntro] = useState(false);

  // Entrance Effects: 'normal' | 'delay' | 'step_by_step'
  const [activeEffect, setActiveEffect] = useState<'normal' | 'delay' | 'step_by_step'>(
    ((quiz.entranceEffect as any) || 'normal') as any
  );
  const [isEntranceFinished, setIsEntranceFinished] = useState(false);
  const [entranceStep, setEntranceStep] = useState(0);

  // Tema Show do Milhão TV Studio
  const [isLightMode, setIsLightMode] = useState(false);

  // Zoom Image modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Controle de Escala de Fonte para o Telão LED (-2 a +4)
  const [fontScaleOffset, setFontScaleOffset] = useState<number>(0);

  // Modo de visualização da coluna direita quando há imagem:
  // 'split' = Imagem + Alternativas lado a lado/empilhadas de forma inteligente
  // 'image_focus' = Imagem gigante ocupando a coluna direita (ideal para leitura do gráfico/charge antes das alternativas)
  const [rightPanelMode, setRightPanelMode] = useState<'split' | 'image_focus'>('split');

  // Audio configuration modal
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Motion Transitions & Studio Lighting
  const [navDirection, setNavDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showRevealFlash, setShowRevealFlash] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredFinalCountdownRef = useRef(false);
  const isRevealedRef = useRef(false);
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Alerta da contagem final configurado na revisão
  const warningTime = quiz.warningSeconds && quiz.warningSeconds > 0 ? quiz.warningSeconds : 10;
  const isUrgent = timeLeft <= warningTime && timeLeft > 0 && !isRevealed;

  // Separa automaticamente "(ENEM 2025 / Matemática)" da primeira linha do enunciado para economizar espaço vertical no telão!
  const parsedStatement = useMemo(() => {
    if (!currentQuestion?.statement) return { topicBadge: null, body: '' };
    const raw = currentQuestion.statement.trim();
    const firstLineMatch = raw.match(/^\(([^)]+)\)\s*\n+([\s\S]*)$/);
    if (firstLineMatch) {
      return {
        topicBadge: firstLineMatch[1].trim(),
        body: firstLineMatch[2].trim(),
      };
    }
    return { topicBadge: null, body: raw };
  }, [currentQuestion?.statement]);

  // Verifica se as alternativas são curtas (ex: "500.", "I.", "V - F - V - F.") para usar Grid de 2 colunas e liberar espaço gigante para a imagem!
  const areAlternativesShort = useMemo(() => {
    if (!currentQuestion?.alternatives) return false;
    const maxLen = Math.max(...currentQuestion.alternatives.map((a) => (a.text || '').length));
    return maxLen <= 28;
  }, [currentQuestion?.alternatives]);

  // Trigger celebration visual confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899', '#00E5FF'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
        });
      }, 250);
    } catch (e) {
      console.log('Confetti error:', e);
    }
  }, []);

  // Skip / End Intro sequence
  const skipIntro = useCallback(() => {
    setShowIntro(false);
    if (quiz.bgMusic && quiz.bgMusic !== 'none') {
      soundManager.startBackgroundMusic(quiz.bgMusic, quiz.customMusicUrl || undefined);
    }
  }, [quiz]);

  // Intro Splash Screen
  useEffect(() => {
    if (!showIntro) return;

    if (quiz.soundEffects) {
      soundManager.playIntroChime();
    }

    const whooshTimer = setTimeout(() => {
      if (quiz.soundEffects) {
        soundManager.playIntroWhoosh();
      }
    }, 1550);

    const timer = setTimeout(() => {
      setShowIntro(false);
      if (quiz.bgMusic && quiz.bgMusic !== 'none') {
        soundManager.startBackgroundMusic(quiz.bgMusic, quiz.customMusicUrl || undefined);
      }
    }, 2900);

    return () => {
      clearTimeout(whooshTimer);
      clearTimeout(timer);
    };
  }, [showIntro, quiz]);

  const finishEntrance = useCallback(() => {
    setEntranceStep(999);
    setIsEntranceFinished(true);
  }, []);

  const advanceStep = useCallback(() => {
    const totalAlternatives = currentQuestion ? currentQuestion.alternatives.length : 4;
    const next = entranceStep + 1;
    setEntranceStep(next);
    if (next > totalAlternatives) {
      setIsEntranceFinished(true);
    }
    if (quiz.soundEffects !== false) soundManager.playTickingSound();
  }, [currentQuestion, entranceStep, quiz.soundEffects]);

  // Initialize or reset question state
  const resetQuestionState = useCallback((index: number, skipMusic = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(questionDuration);
    setIsPaused(false);
    isRevealedRef.current = false;
    setIsRevealed(false);
    setZoomedImage(null);
    setRightPanelMode('split');
    setIsEntranceFinished(false);
    setEntranceStep(0);
    hasTriggeredFinalCountdownRef.current = false;

    soundManager.stopSfx();

    if (quiz.soundEffects !== false) {
      soundManager.playQuestionStart(quiz.questionStartSoundUrl || undefined);
    }

    soundManager.resumeBackgroundMusic();

    if (!skipMusic && quiz.bgMusic && quiz.bgMusic !== 'none') {
      soundManager.startBackgroundMusic(quiz.bgMusic, quiz.customMusicUrl || undefined);
    }
  }, [quiz, questionDuration]);

  // Pausar/retomar áudio quando o apresentador pausar ou despausar a questão
  useEffect(() => {
    if (isRevealed || isCompleted || showIntro) return;
    if (isPaused) {
      soundManager.pauseBackgroundMusic();
      soundManager.stopSfx();
    } else if (isEntranceFinished) {
      soundManager.resumeBackgroundMusic();
    }
  }, [isPaused, isRevealed, isCompleted, isEntranceFinished, showIntro]);

  // Load question
  useEffect(() => {
    if (questions.length === 0) return;
    resetQuestionState(currentIndex, false);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, questions.length, resetQuestionState]);

  // Pré-carregar áudios locais e parar ao desmontar
  useEffect(() => {
    soundManager.preloadCommonAudios();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundManager.stopAllAudio();
    };
  }, []);

  const handleExitQuiz = useCallback(() => {
    soundManager.stopAllAudio();
    onExit();
  }, [onExit]);

  // Orchestrate Entrance Effects
  useEffect(() => {
    if (showIntro || isEntranceFinished || isCompleted || questions.length === 0) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    if (activeEffect === 'normal') {
      const frameTimer = setTimeout(() => {
        setEntranceStep(1);
      }, 50);

      timeoutId = setTimeout(() => {
        setIsEntranceFinished(true);
      }, 650);

      return () => {
        clearTimeout(frameTimer);
        if (timeoutId) clearTimeout(timeoutId);
      };
    } else if (activeEffect === 'delay') {
      timeoutId = setTimeout(() => {
        setEntranceStep(1);
        if (quiz.soundEffects !== false) soundManager.playTickingSound();

        timeoutId = setTimeout(() => {
          setIsEntranceFinished(true);
        }, 900);
      }, 1900);
    } else if (activeEffect === 'step_by_step') {
      const totalSteps = currentQuestion ? currentQuestion.alternatives.length : 4;

      let step = 0;
      intervalId = setInterval(() => {
        step++;
        if (step <= totalSteps) {
          setEntranceStep(step);
          if (quiz.soundEffects !== false) soundManager.playTickingSound();
        } else {
          clearInterval(intervalId!);
          setIsEntranceFinished(true);
        }
      }, 1100);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentIndex, activeEffect, isEntranceFinished, isCompleted, questions.length, currentQuestion, quiz.soundEffects, showIntro]);

  // Reveal answer
  const handleReveal = useCallback((isTimeUp = false) => {
    if (isRevealedRef.current) return;
    isRevealedRef.current = true;
    setIsRevealed(true);
    setRightPanelMode('split'); // Garante que as alternativas apareçam ao revelar

    soundManager.stopSfx();
    soundManager.pauseBackgroundMusic();

    setShowRevealFlash(true);
    setTimeout(() => setShowRevealFlash(false), 450);

    if (quiz.soundEffects !== false) {
      soundManager.playCorrectAnswer(quiz.correctSoundUrl || undefined);
    }

    triggerConfetti();
  }, [quiz, triggerConfetti]);

  // Countdown timer loop
  useEffect(() => {
    if (!isEntranceFinished || isPaused || isRevealed || isCompleted || questions.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isEntranceFinished, isPaused, isRevealed, isCompleted, questions.length]);

  // Audio & Reveal side-effects
  useEffect(() => {
    if (!isEntranceFinished || isPaused || isCompleted || questions.length === 0) {
      return;
    }

    if (timeLeft === 0 && !isRevealed) {
      handleReveal(true);
      return;
    }

    if (isRevealed) return;

    if (timeLeft <= warningTime && !hasTriggeredFinalCountdownRef.current) {
      hasTriggeredFinalCountdownRef.current = true;
      soundManager.zeroBackgroundMusic();
      if (quiz.soundEffects !== false) {
        soundManager.playCountdownSound(quiz.countdownSoundUrl || undefined);
      }
    }

    if (timeLeft <= warningTime) {
      if (!quiz.countdownSoundUrl && quiz.soundEffects !== false) {
        soundManager.playHeartbeat();
      }
    } else {
      if (quiz.soundEffects !== false) {
        soundManager.playTickingSound();
      }
    }
  }, [timeLeft, isEntranceFinished, isPaused, isRevealed, isCompleted, questions.length, quiz, warningTime, handleReveal]);

  // Next Question
  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    if (currentIndex < totalQuestions - 1) {
      setNavDirection('next');
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 380);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      soundManager.stopBackgroundMusic();
      if (quiz.soundEffects !== false) {
        soundManager.playConfettiSound(quiz.confettiSoundUrl || undefined);
        triggerConfetti();
      }
    }
  }, [currentIndex, totalQuestions, quiz.soundEffects, quiz.confettiSoundUrl, triggerConfetti, isTransitioning]);

  // Previous Question
  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    if (currentIndex > 0) {
      setNavDirection('prev');
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 380);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, isTransitioning]);

  const handleRestart = () => {
    setIsCompleted(false);
    setCurrentIndex(0);
    setShowIntro(false);
    resetQuestionState(0, false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard controls for Host TV presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (showIntro) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
          e.preventDefault();
          skipIntro();
        }
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (!isEntranceFinished) {
            if (activeEffect === 'step_by_step') {
              advanceStep();
            } else {
              finishEntrance();
            }
          } else if (isRevealed) {
            handleNext();
          } else {
            setIsPaused((prev) => !prev);
          }
          break;
        case 'KeyR':
        case 'Enter':
          e.preventDefault();
          if (!isEntranceFinished) {
            finishEntrance();
          } else if (isRevealed) {
            handleNext();
          } else {
            handleReveal(false);
          }
          break;
        case 'ArrowRight':
        case 'KeyN':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
        case 'KeyP':
          e.preventDefault();
          handlePrev();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyZ':
          e.preventDefault();
          if (currentQuestion?.imageUrl) {
            setZoomedImage((prev) => (prev ? null : currentQuestion.imageUrl || null));
          }
          break;
        case 'KeyI':
          e.preventDefault();
          if (currentQuestion?.imageUrl) {
            setRightPanelMode((prev) => (prev === 'split' ? 'image_focus' : 'split'));
          }
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          setFontScaleOffset((prev) => Math.min(4, prev + 1));
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          setFontScaleOffset((prev) => Math.max(-2, prev - 1));
          break;
        case 'Escape':
          if (zoomedImage) {
            setZoomedImage(null);
          } else if (rightPanelMode === 'image_focus') {
            setRightPanelMode('split');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showIntro,
    skipIntro,
    isEntranceFinished,
    activeEffect,
    advanceStep,
    finishEntrance,
    isRevealed,
    handleNext,
    handleReveal,
    handlePrev,
    currentQuestion,
    zoomedImage,
    rightPanelMode,
  ]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <HelpCircle className="h-16 w-16 text-amber-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">Nenhuma questão cadastrada nesta revisão</h2>
        <Button size="lg" onClick={handleExitQuiz} className="mt-4">
          Voltar ao Painel
        </Button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
        <div className="relative z-10 max-w-3xl space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="inline-flex p-6 rounded-full bg-amber-500/15 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)]">
            <Trophy className="h-24 w-24 text-amber-400" />
          </div>
          <div className="space-y-3">
            <Badge variant="secondary" className="text-sm px-4 py-1 uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border-cyan-400/40">
              Aulão ENEM Concluído
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">
              Parabéns a Toda a Turma!
            </h1>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">
              Todas as {totalQuestions} questões foram debatidas com sucesso. Excelente prova a todos!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <Button size="lg" onClick={handleRestart} className="gap-2 font-bold text-lg px-6 py-6 bg-[#00E5FF] text-slate-950 hover:bg-cyan-300">
              <RotateCcw className="h-5 w-5" /> Recomeçar Simulado
            </Button>
            <Button variant="outline" size="lg" onClick={handleExitQuiz} className="gap-2 text-lg px-6 py-6 border-slate-700 text-white">
              <X className="h-5 w-5" /> Sair para o Painel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estilos das letras A, B, C, D, E - Super visíveis de longe no painel de LED
  const getBadgeStyle = (alt: Alternative) => {
    if (isRevealed) {
      if (alt.isCorrect) {
        return 'bg-white text-emerald-950 shadow-[0_0_20px_rgba(255,255,255,0.95)] font-black ring-4 ring-emerald-300 scale-110 transition-transform duration-300';
      }
      return 'opacity-30 bg-slate-900 text-slate-500 border-transparent';
    }
    return 'bg-[#00E5FF] text-slate-950 font-black shadow-[0_0_15px_rgba(0,229,255,0.8)] ring-2 ring-white/80';
  };

  // Estilos dos Cards das Alternativas - Alto contraste para LED
  const getAlternativeCardStyles = (alt: Alternative) => {
    if (isRevealed) {
      if (alt.isCorrect) {
        return 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white border-[3px] border-white shadow-[0_0_40px_rgba(16,185,129,0.9)] font-black ring-4 ring-emerald-400/70 scale-[1.01] z-10';
      } else {
        return 'opacity-25 bg-[#060c1e]/90 border border-slate-800 text-slate-400';
      }
    }
    return 'bg-gradient-to-r from-[#170e3d] via-[#12133d] to-[#0b1736] border-2 border-cyan-400/55 hover:border-[#00E5FF] text-white shadow-lg';
  };

  // Cálculo dinâmico em PIXELS/VH para o enunciado aproveitar 100% do card sem ficar pequeno no telão LED
  const getStatementStyle = (text: string): React.CSSProperties => {
    const len = (text || '').length;
    const hasImg = !!currentQuestion?.imageUrl;

    // Base em pixels para TV 1080p escalando com viewport
    let basePx = 28;
    let lineHeight = 1.32;

    if (len < 160) {
      basePx = hasImg ? 38 : 42;
      lineHeight = 1.25;
    } else if (len < 280) {
      basePx = hasImg ? 33 : 36;
      lineHeight = 1.28;
    } else if (len < 420) {
      basePx = hasImg ? 29 : 31;
      lineHeight = 1.3;
    } else if (len < 580) {
      basePx = hasImg ? 26 : 28;
      lineHeight = 1.3;
    } else if (len < 750) {
      basePx = hasImg ? 23.5 : 25;
      lineHeight = 1.28;
    } else if (len < 920) {
      basePx = 22;
      lineHeight = 1.26;
    } else {
      basePx = 20;
      lineHeight = 1.24;
    }

    const finalPx = Math.max(16, basePx + fontScaleOffset * 2.5);

    return {
      fontSize: `clamp(16px, ${finalPx * 0.052}vw + ${finalPx * 0.45}px, ${finalPx + 10}px)`,
      lineHeight,
    };
  };

  // Cálculo dinâmico de tamanho da fonte das alternativas
  const getAlternativeTextStyle = (): React.CSSProperties => {
    const maxAltLen = Math.max(...currentQuestion.alternatives.map((a) => (a.text || '').length));
    let basePx = 24;

    if (maxAltLen <= 25) {
      basePx = 30;
    } else if (maxAltLen <= 65) {
      basePx = 25;
    } else if (maxAltLen <= 110) {
      basePx = 22;
    } else {
      basePx = 19.5;
    }

    const finalPx = Math.max(15, basePx + fontScaleOffset * 2);
    return {
      fontSize: `clamp(15px, ${finalPx * 0.048}vw + ${finalPx * 0.45}px, ${finalPx + 8}px)`,
      lineHeight: 1.22,
    };
  };

  // Layout de colunas: se a questão tiver imagem E enunciado curto (ex: Inglês/Química), dá mais largura para a direita!
  const isVisualHeavyQuestion =
    !!currentQuestion.imageUrl && (parsedStatement.body.length < 260 || rightPanelMode === 'image_focus');

  return (
    <div className="relative h-screen h-[100dvh] max-h-screen max-h-[100dvh] overflow-hidden w-full flex flex-col justify-between select-none bg-[#040b1a] text-white border-2 border-[#00E5FF]/50">
      {/* BACKGROUND ESCURO DE ALTO CONTRASTE PARA PAINEL LED (evita lavar a letra branca) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src="/milhao.png"
          alt=""
          className="w-full h-full object-cover object-center opacity-15 filter brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040b1a]/95 via-[#07132c]/90 to-[#030917]/95" />
      </div>

      {/* BARRA DE TEMPO NO TOPO (Mais grossa para ser vista do fundo do salão) */}
      {!showIntro && (
        <div className="relative w-full h-2.5 z-40 bg-slate-900 overflow-hidden shrink-0">
          <div
            className={`h-full origin-left transition-[width,background-color] duration-1000 ease-linear ${
              isRevealed
                ? 'bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.9)]'
                : timeLeft <= 3
                  ? 'bg-gradient-to-r from-red-600 via-rose-400 to-red-600 shadow-[0_0_20px_rgba(239,68,68,1)]'
                  : isUrgent
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-300 to-orange-500 shadow-[0_0_16px_rgba(245,158,11,0.9)]'
                    : 'bg-gradient-to-r from-cyan-400 via-[#00E5FF] to-blue-500 shadow-[0_0_15px_rgba(0,229,255,0.9)]'
            }`}
            style={{ width: `${isEntranceFinished ? Math.max(0, (timeLeft / questionDuration) * 100) : 100}%` }}
          />
        </div>
      )}

      {/* PULSO DE BORDA NOS SEGUNDOS FINAIS (Não cobre nenhuma alternativa!) */}
      {!showIntro && isEntranceFinished && !isRevealed && !isPaused && isUrgent && (
        <div className="pointer-events-none fixed inset-0 z-30 border-[6px] border-amber-500/80 shadow-[inset_0_0_90px_rgba(239,68,68,0.45)] animate-pulse" />
      )}

      {/* REVEAL FLASH */}
      {showRevealFlash && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-white/30 animate-out fade-out duration-500" />
      )}

      {/* TOP HEADER ULTRA-COMPACTO: Economiza até 90px de altura vertical para o telão! */}
      <header className="relative z-20 shrink-0 border-b border-cyan-500/30 bg-[#051026]/95 px-3 py-1.5 shadow-lg">
        <div className="w-full flex items-center justify-between gap-2">
          {/* ESQUERDA: Número da Questão Gigante + Matéria + Logos Compactas */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src="/show_milhao-cropped.png"
              alt="Show do Milhão"
              className="h-9 sm:h-11 w-auto object-contain drop-shadow-[0_2px_12px_rgba(255,215,0,0.4)] shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/show_milhao.png';
              }}
            />

            {/* Badge de Questão de Alto Impacto para o Auditório */}
            <div className="flex items-center gap-2 bg-[#121c42] border-2 border-[#00E5FF] px-3 py-1 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#00E5FF]">
                QUESTÃO
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span className="text-xs font-bold text-slate-300 border-l border-cyan-500/40 pl-2">
                /{totalQuestions}
              </span>
            </div>

            {/* Badge da Disciplina / Ano extraído automaticamente do enunciado */}
            {parsedStatement.topicBadge && (
              <div className="hidden md:flex items-center bg-amber-400 text-slate-950 font-black px-3.5 py-1 rounded-xl text-sm lg:text-base uppercase tracking-wide shadow-md shrink-0">
                {parsedStatement.topicBadge}
              </div>
            )}
          </div>

          {/* CENTRO: CRONÔMETRO GIGANTE + CONTAGEM FINAL INTEGRADA (Nunca tapa a letra E!) */}
          <div className="flex items-center justify-center shrink-0">
            <div
              className={`flex items-center gap-2.5 px-4 py-1 rounded-full border-2 transition-all duration-300 ${
                isRevealed
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                  : isPaused
                    ? 'bg-amber-950 border-amber-400 text-amber-300'
                    : timeLeft <= 3
                      ? 'bg-red-600 border-white text-white scale-110 shadow-[0_0_35px_rgba(239,68,68,0.95)] animate-bounce'
                      : isUrgent
                        ? 'bg-amber-500 border-white text-slate-950 scale-105 shadow-[0_0_30px_rgba(245,158,11,0.9)]'
                        : 'bg-[#071f40] border-[#00E5FF] text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.3)]'
              }`}
            >
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="font-mono font-black text-2xl sm:text-3xl md:text-4xl tabular-nums leading-none tracking-tight">
                {String(timeLeft).padStart(2, '0')}s
              </span>
              {isUrgent && !isRevealed && (
                <span className="hidden sm:inline text-xs font-black uppercase px-2 py-0.5 rounded bg-black/25 text-white animate-pulse">
                  {timeLeft <= 3 ? 'FINAL!' : 'ATENÇÃO'}
                </span>
              )}
            </div>
          </div>

          {/* DIREITA: CONTROLES DO APRESENTADOR + AJUSTE DE LETRA AO VIVO */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Controle de Tamanho da Fonte ao Vivo para o Telão (- / +) */}
            <div className="hidden sm:flex items-center bg-slate-900/90 border border-cyan-500/40 rounded-lg p-0.5 mr-1" title="Ajustar tamanho da letra no telão (Teclas - e +)">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFontScaleOffset((prev) => Math.max(-2, prev - 1))}
                className="h-7 w-7 text-cyan-300 hover:text-white hover:bg-cyan-950"
                title="Diminuir Letra (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="px-1.5 text-[11px] font-black text-white tabular-nums">
                A{fontScaleOffset > 0 ? `+${fontScaleOffset}` : fontScaleOffset < 0 ? fontScaleOffset : ''}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFontScaleOffset((prev) => Math.min(4, prev + 1))}
                className="h-7 w-7 text-cyan-300 hover:text-white hover:bg-cyan-950"
                title="Aumentar Letra (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Se tiver imagem, botão rápido para alternar Foco na Imagem vs Dividido */}
            {currentQuestion.imageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRightPanelMode((prev) => (prev === 'split' ? 'image_focus' : 'split'))}
                className={`h-8 text-xs font-black gap-1 border-2 ${
                  rightPanelMode === 'image_focus'
                    ? 'bg-[#00E5FF] text-slate-950 border-white shadow-[0_0_15px_rgba(0,229,255,0.7)]'
                    : 'bg-slate-900 text-cyan-300 border-cyan-500/50 hover:bg-cyan-950'
                }`}
                title="Alternar entre Imagem Gigante e Alternativas (Tecla I)"
              >
                {rightPanelMode === 'image_focus' ? (
                  <>
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Ver Alternativas (I)</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Focar Imagem (I)</span>
                  </>
                )}
              </Button>
            )}

            {!isEntranceFinished ? (
              <Button
                variant="default"
                size="sm"
                onClick={finishEntrance}
                className="h-8 text-xs font-black gap-1 bg-[#00E5FF] hover:bg-cyan-300 text-slate-950"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span className="hidden md:inline">Iniciar</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused((prev) => !prev)}
                className="h-8 text-xs font-bold gap-1 border-cyan-500/40 bg-slate-900 text-cyan-300 hover:bg-cyan-950"
                title="Pausar / Retomar (Espaço)"
              >
                {isPaused ? <Play className="h-3.5 w-3.5 text-[#00E5FF]" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-8 w-8 border-slate-700 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30"
              title="Questão anterior (Seta Esquerda)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {!isRevealed ? (
              <Button
                size="sm"
                onClick={() => handleReveal(false)}
                className="h-8 text-xs font-black gap-1 px-3 shadow-[0_0_15px_rgba(245,158,11,0.6)] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950"
                title="Revelar Resposta (R ou Enter)"
              >
                <Sparkles className="h-3.5 w-3.5 text-slate-950 shrink-0" />
                <span>Revelar</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleNext}
                className="h-8 text-xs font-black gap-1 px-3 shadow-[0_0_18px_rgba(0,229,255,0.7)] bg-gradient-to-r from-[#00E5FF] to-cyan-400 text-slate-950"
                title="Próxima Questão (N ou Enter)"
              >
                <span>{currentIndex === totalQuestions - 1 ? 'Fim' : 'Próxima'}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-cyan-500/40 bg-slate-900 text-cyan-200 hover:bg-slate-800"
              onClick={handleToggleMute}
              title={isMuted ? 'Ativar Áudio' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-[#00E5FF]" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-cyan-500/40 bg-slate-900 text-[#00E5FF] hover:bg-slate-800"
              onClick={toggleFullscreen}
              title="Tela Cheia (Tecla F - Recomendado para ocultar barra do navegador!)"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-400"
              onClick={handleExitQuiz}
              title="Sair"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* PALCO PRINCIPAL: Aproveitamento de 92% da tela com Grid Adaptativo */}
      <main className="relative z-10 flex-1 min-h-0 px-2.5 sm:px-4 py-2 w-full flex flex-col justify-between overflow-hidden gap-2">
        <div
          key={currentIndex}
          className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-stretch w-full flex-1 min-h-0"
        >
          {/* COLUNA ESQUERDA: ENUNCIADO DE ALTO CONTRASTE */}
          <div
            className={`${
              isVisualHeavyQuestion ? 'lg:col-span-5' : 'lg:col-span-7'
            } flex flex-col min-h-0 h-full transition-all duration-300`}
          >
            <div className="p-4 sm:p-5 lg:p-6 rounded-2xl flex-1 min-h-0 flex flex-col justify-between bg-[#08122c]/95 border-2 border-cyan-400/50 shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-y-auto">
              {/* Corpo do Enunciado alinhado à esquerda (muito mais legível para blocos grandes no telão) */}
              <div className="my-auto w-full">
                {parsedStatement.topicBadge && (
                  <div className="inline-block md:hidden mb-2 bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-md text-xs uppercase">
                    {parsedStatement.topicBadge}
                  </div>
                )}
                <p
                  style={getStatementStyle(parsedStatement.body)}
                  className="whitespace-pre-line text-left text-white font-bold tracking-normal selection:bg-cyan-500 selection:text-black"
                >
                  {parsedStatement.body}
                </p>
              </div>

              {/* Dica discreta de atalhos no rodapé do card quando tiver imagem */}
              {currentQuestion.imageUrl && (
                <div className="pt-3 mt-3 border-t border-cyan-500/20 flex items-center justify-between text-xs text-cyan-300/80 font-semibold shrink-0">
                  <span>💡 Dica Telão: Aperte [Z] para Tela Cheia da Imagem ou [I] para ampliar no painel</span>
                  <span>Fonte: [+] / [-]</span>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: IMAGEM EM FUNDO BRANCO PURO + ALTERNATIVAS */}
          <div
            className={`${
              isVisualHeavyQuestion ? 'lg:col-span-7' : 'lg:col-span-5'
            } flex flex-col justify-between gap-2.5 min-h-0 h-full`}
          >
            {/* IMAGEM DE APOIO: Fundo BRANCO PURO para gráficos e tabelas do ENEM ficarem 100% nítidos de longe! */}
            {currentQuestion.imageUrl && (
              <div
                onClick={() => setZoomedImage(currentQuestion.imageUrl || null)}
                className={`relative group cursor-pointer rounded-2xl overflow-hidden bg-white border-[3px] border-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.25)] p-2 flex items-center justify-center w-full transition-all duration-300 ${
                  rightPanelMode === 'image_focus'
                    ? 'flex-1 min-h-0'
                    : areAlternativesShort
                      ? 'h-[46vh] sm:h-[50vh] shrink-0'
                      : 'h-[34vh] sm:h-[38vh] shrink-0'
                }`}
                title="Clique para abrir em Tela Cheia (Tecla Z)"
              >
                <img
                  src={currentQuestion.imageUrl}
                  alt="Imagem da questão"
                  className="w-full h-full object-contain object-center"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRightPanelMode((prev) => (prev === 'split' ? 'image_focus' : 'split'));
                    }}
                    className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-950 text-white text-xs rounded-lg font-bold border border-cyan-400/50 shadow-md"
                  >
                    {rightPanelMode === 'image_focus' ? 'Mostrar Alternativas (I)' : 'Expandir Aqui (I)'}
                  </button>
                  <div className="px-2.5 py-1 bg-[#00E5FF] text-slate-950 text-xs rounded-lg flex items-center gap-1 font-black shadow-md">
                    <ZoomIn className="h-3.5 w-3.5" /> Tela Cheia (Z)
                  </div>
                </div>
              </div>
            )}

            {/* LISTA DE ALTERNATIVAS (Oculta temporariamente apenas se o apresentador ativar o modo 'image_focus' com a tecla I) */}
            {rightPanelMode !== 'image_focus' && (
              <div
                className={`grid ${
                  currentQuestion.imageUrl && areAlternativesShort
                    ? 'grid-cols-2 gap-2'
                    : 'grid-cols-1 gap-2'
                } flex-1 min-h-0 content-stretch`}
              >
                {currentQuestion.alternatives.map((alt, altIdx) => {
                  const cardStyles = getAlternativeCardStyles(alt);
                  const badgeStyle = getBadgeStyle(alt);

                  let entranceAnimClasses = 'transition-all duration-300 ease-out';
                  if (activeEffect === 'delay' && !isEntranceFinished && entranceStep < 1) {
                    entranceAnimClasses += ' opacity-0 translate-y-6 pointer-events-none';
                  } else if (activeEffect === 'step_by_step' && !isEntranceFinished && entranceStep <= altIdx) {
                    entranceAnimClasses += ' opacity-0 translate-x-12 pointer-events-none';
                  } else {
                    entranceAnimClasses += ' opacity-100 translate-x-0 translate-y-0';
                  }

                  // Se for grid de 2 colunas (5 alternativas curtas), a 5ª alternativa (E) ocupa as 2 colunas centralizada
                  const isLastInTwoCols =
                    currentQuestion.imageUrl &&
                    areAlternativesShort &&
                    altIdx === currentQuestion.alternatives.length - 1 &&
                    currentQuestion.alternatives.length % 2 !== 0;

                  return (
                    <div
                      key={alt.letter}
                      className={`relative overflow-hidden flex items-center px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-left ${
                        isLastInTwoCols ? 'col-span-2' : ''
                      } ${cardStyles} ${entranceAnimClasses}`}
                    >
                      {/* Crachá da Letra (A, B, C, D, E) */}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-black shrink-0 mr-3.5 ${badgeStyle}`}
                      >
                        {alt.letter.toUpperCase()}
                      </div>

                      {/* Texto da Alternativa com escala dinâmica */}
                      <div className="flex-1 min-w-0 pr-1">
                        <span
                          style={getAlternativeTextStyle()}
                          className="font-bold block break-words whitespace-normal text-white"
                        >
                          {alt.text}
                        </span>
                      </div>

                      {/* Selo CORRETA ao revelar */}
                      {isRevealed && alt.isCorrect && (
                        <span className="ml-2 px-3 py-1 text-xs sm:text-sm font-black rounded-full bg-white text-emerald-950 shrink-0 shadow-lg flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          CORRETA
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* MODAL DE ZOOM DA IMAGEM EM TELA CHEIA (94% da tela do Telão LED com fundo branco!) */}
      <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
        <DialogContent className="max-w-[96vw] w-[96vw] h-[92vh] max-h-[92vh] p-3 sm:p-5 flex flex-col bg-[#050d21] text-white border-2 border-[#00E5FF] shadow-[0_0_60px_rgba(0,229,255,0.4)]">
          <DialogHeader className="w-full flex flex-row items-center justify-between pb-2 shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-black text-[#00E5FF] flex items-center gap-2">
              <ZoomIn className="h-5 w-5" />
              Questão {String(currentIndex + 1).padStart(2, '0')} — Visualização Ampliada para o Auditório (Pressione Z ou ESC para voltar)
            </DialogTitle>
            <DialogDescription className="sr-only">
              Imagem ampliada para leitura no telão
            </DialogDescription>
          </DialogHeader>
          {zoomedImage && (
            <div
              onClick={() => setZoomedImage(null)}
              className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-xl bg-white p-4 cursor-zoom-out"
            >
              <img
                src={zoomedImage}
                alt="Imagem ampliada"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AUDIO CONFIGURATION MODAL */}
      <AudioConfigModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />
    </div>
  );
}