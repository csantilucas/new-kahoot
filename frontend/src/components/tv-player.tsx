"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Sun,
  Moon,
  Clock,
  BookOpen,
  ZoomIn,
  Type,
  Music,
  Zap,
  ArrowRightCircle,
} from 'lucide-react';
import { AudioConfigModal } from './audio-config-modal';

interface TvPlayerProps {
  quiz: Quiz;
  onExit: () => void;
}

export function TvPlayer({ quiz, onExit }: TvPlayerProps) {
  const questions = quiz.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Tempo da pergunta: máximo de 15 segundos para dar tempo e chamar atenção com a contagem final
  const maxQuestionSeconds = 15;
  const questionDuration = Math.min(quiz.secondsPerQuestion || 15, maxQuestionSeconds);
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
  const [isEntranceFinished, setIsEntranceFinished] = useState(true);
  const [entranceStep, setEntranceStep] = useState(999);
  
  // Tema Show do Milhão TV Studio: cores vibrantes (Navy Profundo + Ciano Elétrico + Violeta Real)
  const [isLightMode, setIsLightMode] = useState(false);

  // Zoom Image modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Font size toggle for distance viewing ('base' | 'large')
  const [isLargeFont, setIsLargeFont] = useState(false);

  // Audio configuration modal
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Motion Transitions & Studio Lighting (Plano 5)
  const [navDirection, setNavDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showRevealFlash, setShowRevealFlash] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredFinalCountdownRef = useRef(false);
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Alerta da contagem final nos últimos 10 segundos
  const warningTime = 10;
  const isUrgent = timeLeft <= warningTime && timeLeft > 0 && !isRevealed;

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      if (quiz.soundEffects) {
        soundManager.playConfettiSound(quiz.confettiSoundUrl || undefined);
      }
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
  }, [quiz]);

  // Skip / End Intro sequence
  const skipIntro = useCallback(() => {
    setShowIntro(false);
    if (quiz.bgMusic && quiz.bgMusic !== 'none') {
      soundManager.startBackgroundMusic(quiz.bgMusic, quiz.customMusicUrl || undefined);
    }
  }, [quiz]);

  // Intro Splash Screen: Smooth Entrance -> Stationary Hold -> High-Speed 3D Fly-Through
  useEffect(() => {
    if (!showIntro) return;

    // Phase 1: Play opening entrance chime
    if (quiz.soundEffects) {
      soundManager.playIntroChime();
    }

    // Phase 3: Play cinematic whoosh as motion launches forward into the screen (~1550ms)
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

  // Finish entrance early (e.g. host clicks or presses Enter)
  const finishEntrance = useCallback(() => {
    setEntranceStep(999);
    setIsEntranceFinished(true);
  }, []);

  // Advance step in step-by-step mode
  const advanceStep = useCallback(() => {
    const totalAlternatives = currentQuestion ? currentQuestion.alternatives.length : 4;
    setEntranceStep((prev) => {
      const next = prev + 1;
      if (next > totalAlternatives) {
        setIsEntranceFinished(true);
      }
      return next;
    });
    if (quiz.soundEffects) soundManager.playTickingSound();
  }, [currentQuestion, quiz.soundEffects]);

  // Initialize or reset question state
  const resetQuestionState = useCallback((index: number, skipMusic = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(questionDuration);
    setIsPaused(false);
    setIsRevealed(false);
    setZoomedImage(null);
    setIsEntranceFinished(true);
    setEntranceStep(999);
    hasTriggeredFinalCountdownRef.current = false;

    // Restaura o volume normal da música de fundo para a nova pergunta
    soundManager.restoreBackgroundMusic();

    if (!skipMusic && quiz.bgMusic && quiz.bgMusic !== 'none') {
      soundManager.startBackgroundMusic(quiz.bgMusic, quiz.customMusicUrl || undefined);
    }
  }, [quiz, questionDuration]);

  // Load question
  useEffect(() => {
    if (questions.length === 0) return;
    resetQuestionState(currentIndex, false);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Mantém a música tocando continuamente entre a passagem de perguntas
    };
  }, [currentIndex, questions.length, resetQuestionState]);

  // Parar trilha sonora e timers ao sair da TV (desmontagem do componente)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundManager.stopBackgroundMusic();
      soundManager.restoreBackgroundMusic();
    };
  }, []);

  // Orchestrate Entrance Effects on question load or effect change (only after intro)
  useEffect(() => {
    if (showIntro || isEntranceFinished || isCompleted || questions.length === 0) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    if (activeEffect === 'normal') {
      // Normal: immediate smooth entrance, timer begins after 400ms transition
      timeoutId = setTimeout(() => {
        setIsEntranceFinished(true);
      }, 400);
    } else if (activeEffect === 'delay') {
      // Delay: Statement is shown at step 0; alternatives emerge at step 1 after delay; timer starts at step 2
      timeoutId = setTimeout(() => {
        setEntranceStep(1); // alternatives slide up
        if (quiz.soundEffects) soundManager.playTickingSound();

        timeoutId = setTimeout(() => {
          setIsEntranceFinished(true); // timer begins!
        }, 900);
      }, 1900);
    } else if (activeEffect === 'step_by_step') {
      // Step-by-step: Statement is step 0. Each alternative slides in from the right one by one.
      const totalSteps = currentQuestion ? currentQuestion.alternatives.length : 4;
      
      let step = 0;
      intervalId = setInterval(() => {
        step++;
        if (step <= totalSteps) {
          setEntranceStep(step);
          if (quiz.soundEffects) soundManager.playTickingSound();
        } else {
          clearInterval(intervalId!);
          setIsEntranceFinished(true); // All alternatives presented -> timer starts!
        }
      }, 1250);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentIndex, activeEffect, isEntranceFinished, isCompleted, questions.length, currentQuestion, quiz.soundEffects]);

  // Reveal answer with animation, studio flash and celebration
  const handleReveal = useCallback((isTimeUp = false) => {
    setIsRevealed((prev) => {
      if (prev) return prev; // already revealed
      
      // Trigger cinematic studio reveal flash (Plano 5)
      setShowRevealFlash(true);
      setTimeout(() => setShowRevealFlash(false), 450);

      if (quiz.soundEffects) {
        if (isTimeUp) {
          soundManager.playTimeUpBuzzer(quiz.timeUpSoundUrl || undefined);
          setTimeout(() => {
            soundManager.playCorrectAnswer(quiz.correctSoundUrl || undefined);
            triggerConfetti();
          }, 600);
        } else {
          soundManager.playRevealSuspense();
          setTimeout(() => {
            soundManager.playCorrectAnswer(quiz.correctSoundUrl || undefined);
            triggerConfetti();
          }, 350);
        }
      } else {
        triggerConfetti();
      }

      return true;
    });
  }, [quiz, triggerConfetti]);

  // Countdown timer loop - ONLY runs after entrance finishes!
  useEffect(() => {
    if (!isEntranceFinished || isPaused || isRevealed || isCompleted || questions.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleReveal(true);
          return 0;
        }

        const next = prev - 1;
        
        // Quando entra nos 10 segundos da contagem final:
        if (next <= 10 && !hasTriggeredFinalCountdownRef.current) {
          hasTriggeredFinalCountdownRef.current = true;
          // ZERAR o som da música de fundo para a contagem final ter foco total na TV
          soundManager.zeroBackgroundMusic();
          if (quiz.soundEffects) {
            soundManager.playCountdownSound(quiz.countdownSoundUrl || undefined);
          }
        } else if (next > 10) {
          if (quiz.soundEffects) {
            soundManager.playTickingSound();
          }
        } else if (!quiz.countdownSoundUrl) {
          // Se não houver áudio customizado de 10s (ex: YouTube do Silvio Santos),
          // toca o batimento cardíaco procedural nos segundos finais
          if (quiz.soundEffects) {
            soundManager.playHeartbeat();
          }
        }

        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isEntranceFinished, isPaused, isRevealed, isCompleted, warningTime, quiz, handleReveal]);

  // Next Question with Broadcast TV Transition (Plano 5)
  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setNavDirection('next');
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 420);
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      soundManager.stopBackgroundMusic();
      if (quiz.soundEffects) {
        soundManager.playCorrectAnswer();
        triggerConfetti();
      }
    }
  }, [currentIndex, totalQuestions, quiz.soundEffects, triggerConfetti]);

  // Previous Question with Broadcast TV Transition (Plano 5)
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setNavDirection('prev');
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 420);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Restart Quiz
  const handleRestart = () => {
    setIsCompleted(false);
    setCurrentIndex(0);
    setShowIntro(false);
    resetQuestionState(0, false);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Toggle Mute
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

      // If intro is active, any confirmation key skips directly to quiz
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
            setIsPaused(prev => !prev);
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
        case 'KeyT':
          e.preventDefault();
          setIsLightMode(prev => !prev);
          break;
        case 'KeyZ':
          e.preventDefault();
          if (currentQuestion?.imageUrl) {
            setZoomedImage(prev => prev ? null : currentQuestion.imageUrl || null);
          }
          break;
        case 'Escape':
          if (zoomedImage) {
            setZoomedImage(null);
          } else if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIntro, skipIntro, isEntranceFinished, activeEffect, advanceStep, finishEntrance, isRevealed, handleNext, handleReveal, handlePrev, isFullscreen, currentQuestion, zoomedImage]);

  if (questions.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isLightMode ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-white'}`}>
        <HelpCircle className="h-16 w-16 text-amber-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">Nenhuma questão cadastrada nesta revisão</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Cadastre perguntas e alternativas antes de iniciar a apresentação na TV.
        </p>
        <Button size="lg" onClick={onExit}>
          Voltar ao Painel
        </Button>
      </div>
    );
  }

  // Final celebration screen
  if (isCompleted) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden ${
        isLightMode
          ? 'bg-gradient-to-b from-blue-50 via-white to-slate-100 text-slate-900'
          : 'bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white'
      }`}>
        <div className="relative z-10 max-w-2xl space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="inline-flex p-5 rounded-full bg-primary/10 border-2 border-primary shadow-xl">
            <Trophy className="h-20 w-20 text-primary" />
          </div>

          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs px-3 py-1 uppercase tracking-widest">
              Revisão ENEM Concluída
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Parabéns a Toda a Turma!
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
              Todas as {totalQuestions} questões foram debatidas com sucesso.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button size="lg" onClick={handleRestart} className="gap-2 font-medium">
              <RotateCcw className="h-4 w-4" /> Recomeçar Simulado
            </Button>
            <Button variant="outline" size="lg" onClick={onExit} className="gap-2">
              <X className="h-4 w-4" /> Sair para o Painel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Badges for alternatives (a, b, c, d, e) - Electric Cyan / Gold TV Studio styling
  const getBadgeStyle = (alt: Alternative) => {
    if (isRevealed) {
      if (alt.isCorrect) {
        return 'bg-white text-emerald-900 shadow-[0_0_15px_rgba(255,255,255,0.8)] font-black ring-2 ring-emerald-300 scale-110 transition-transform duration-300';
      }
      return 'opacity-20 bg-slate-800 text-slate-500 border-transparent transition-opacity duration-300';
    }

    return 'bg-gradient-to-br from-[#00E5FF] to-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(0,229,255,0.6)] ring-1 ring-cyan-200';
  };

  // Card styles for alternatives: Deep Violet & Navy Blue game show styling (matching user image)
  const getAlternativeCardStyles = (alt: Alternative) => {
    if (isRevealed) {
      if (alt.isCorrect) {
        return 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white border-2 border-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.7)] font-bold ring-4 ring-emerald-400/50 scale-[1.02] cursor-default transition-all duration-500';
      } else {
        return 'opacity-20 bg-[#081024]/80 border-2 border-slate-800 text-slate-500 scale-[0.99] cursor-default transition-all duration-500';
      }
    }

    return 'bg-gradient-to-r from-[#22104e]/95 via-[#1b1446]/95 to-[#0e193a]/95 border-2 border-indigo-400/40 hover:border-[#00E5FF] text-white shadow-md hover:shadow-[0_0_18px_rgba(0,229,255,0.3)] cursor-default transition-all duration-200';
  };

  return (
    <div
      className="relative h-screen max-h-screen overflow-hidden w-full flex flex-col justify-between select-none bg-gradient-to-br from-[#051124] via-[#091b38] to-[#040e20] text-slate-100 border-[3px] border-[#00E5FF]/40 shadow-[0_0_40px_rgba(0,229,255,0.2)]"
    >
      {/* Top Electric Cyan Accent Line matching attached reference image */}
      <div className="absolute top-0 left-0 right-0 h-1 z-50 bg-gradient-to-r from-[#00E5FF] via-cyan-300 to-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,0.9)]" />

      {/* STUDIO BACKGROUND SEARCHLIGHT BEAMS (Broadcast Depth & Atmosphere) */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[450px] h-[850px] bg-gradient-to-br from-cyan-400/10 via-indigo-600/5 to-transparent blur-3xl anim-studio-beam-left z-0" />
      <div className="pointer-events-none absolute -top-40 -right-40 w-[450px] h-[850px] bg-gradient-to-bl from-blue-500/10 via-purple-600/5 to-transparent blur-3xl anim-studio-beam-right z-0" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-cyan-500/5 to-transparent z-0" />

      {/* REVEAL CINEMATIC FLASH BURST (Plano 5) */}
      {showRevealFlash && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-gradient-to-b from-white/45 via-cyan-200/35 to-transparent anim-reveal-flash" />
      )}

      {/* TV WIPE STREAK OVERLAY (Plano 5) */}
      {isTransitioning && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent anim-tv-wipe" />
        </div>
      )}

      {/* TOP TIME BAR: drains smoothly from 15s to 0s; turns amber/red with shimmer in last 10s */}
      {!showIntro && (
        <div className="absolute top-1 left-0 right-0 h-1.5 z-40 bg-slate-900/80 overflow-hidden">
          <div
            className={`h-full origin-left transition-[width,background-color] duration-1000 ease-linear ${
              isRevealed
                ? 'bg-emerald-500'
                : timeLeft <= 3
                ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-500 anim-bar-shimmer shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                : isUrgent
                ? 'bg-gradient-to-r from-amber-500 via-yellow-300 to-orange-500 anim-bar-shimmer shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                : 'bg-gradient-to-r from-cyan-400 via-[#00E5FF] to-blue-500 shadow-[0_0_12px_rgba(0,229,255,0.8)]'
            }`}
            style={{ width: `${isEntranceFinished ? Math.max(0, (timeLeft / questionDuration) * 100) : 100}%` }}
          />
        </div>
      )}

      {/* Warning Screen Edge Pulse during the final 10 seconds */}
      {!showIntro && isEntranceFinished && !isRevealed && !isPaused && isUrgent && (
        <div className="pointer-events-none fixed inset-0 z-30 shadow-[inset_0_0_120px_rgba(239,68,68,0.3)] animate-pulse" />
      )}

      {/* FINAL COUNTDOWN BUBBLE (last 10s): Prominent corner alert that commands attention on TV */}
      {!showIntro && isEntranceFinished && !isRevealed && !isPaused && timeLeft <= 10 && timeLeft > 0 && (
        <div className="pointer-events-none fixed bottom-20 right-6 sm:right-10 z-40 flex flex-col items-center justify-center">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] mb-1.5 animate-pulse">
            {timeLeft <= 3 ? '🚨 TEMPO ESGOTANDO!' : '⚡ CONTAGEM FINAL'}
          </span>
          <div className="relative flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32">
            <span className={`absolute inset-0 rounded-full anim-final-ring ${timeLeft <= 3 ? 'bg-red-500/50' : 'bg-amber-400/40'}`} />
            <span className={`absolute -inset-2 rounded-full animate-ping opacity-40 ${timeLeft <= 3 ? 'bg-red-500' : 'bg-amber-400'}`} />
            <div
              className={`relative w-full h-full rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.7)] border-4 ${
                timeLeft <= 3
                  ? 'bg-gradient-to-br from-red-600 via-rose-600 to-red-700 border-white text-white'
                  : 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 border-white text-white'
              }`}
            >
              <span key={timeLeft} className="anim-final-num text-5xl sm:text-7xl font-black text-white tabular-nums drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header
        className="relative z-20 px-3 sm:px-6 md:px-8 lg:px-12 py-2 border-b border-cyan-500/30 bg-[#06142e]/95 backdrop-blur-md shrink-0 shadow-lg"
      >
        <div className="w-full max-w-[1850px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
          
          {/* LEFT: Show do Milhão TV Logo & Quiz Info */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <img
              src="/show_milhao-cropped.png"
              alt="Show do Milhão"
              className="h-11 sm:h-13 md:h-15 w-auto object-contain drop-shadow-[0_4px_16px_rgba(255,215,0,0.4)] transition-transform hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/show_milhao.png";
              }}
            />

            <div className="hidden sm:flex flex-col justify-center">
              <span className="font-black text-sm md:text-base text-white tracking-tight truncate max-w-xs md:max-w-md drop-shadow">
                {quiz.title}
              </span>
              {quiz.category && (
                <span className="text-[10px] md:text-xs font-bold text-[#00E5FF] uppercase tracking-wider drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                  {quiz.category}
                </span>
              )}
            </div>
          </div>

          {/* CENTER: HERO BROADCAST CRONÔMETRO (PLANO 2) - COMMANDING & ULTRA VISIBLE */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div
              className={`relative flex items-center gap-2.5 sm:gap-4 px-3.5 sm:px-6 py-1 sm:py-1.5 rounded-2xl md:rounded-full border-2 transition-all duration-300 shadow-2xl ${
                isRevealed
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40'
                  : isPaused
                  ? 'bg-[#291e06]/95 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  : timeLeft <= 3
                  ? 'bg-red-950/95 border-red-500 text-white anim-timer-red shadow-[0_0_40px_rgba(239,68,68,0.9)] ring-4 ring-red-500/60'
                  : isUrgent
                  ? 'bg-[#2b1605]/95 border-amber-400 text-amber-300 anim-timer-amber shadow-[0_0_35px_rgba(245,158,11,0.8)] ring-2 ring-amber-400/50'
                  : 'bg-[#061e3d]/90 border-cyan-400/80 text-[#00E5FF] anim-timer-cyan shadow-[0_0_25px_rgba(0,229,255,0.35)] ring-1 ring-cyan-300/30'
              }`}
            >
              {/* Radial Countdown Gauge */}
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  {/* Background track */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    fill="transparent"
                    className="opacity-20"
                  />
                  {/* Active progress track */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeDasharray={2 * Math.PI * 14}
                    strokeDashoffset={
                      2 * Math.PI * 14 * (1 - Math.max(0, Math.min(1, timeLeft / questionDuration)))
                    }
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <Clock className={`absolute h-4 w-4 sm:h-5 sm:w-5 ${timeLeft <= 3 && !isRevealed ? 'animate-pulse text-white' : ''}`} />
              </div>

              {/* Big Digits Display */}
              <div className="flex flex-col items-center sm:items-start justify-center leading-none">
                <div className="flex items-baseline gap-1">
                  <span
                    key={timeLeft}
                    className={`font-mono font-black tabular-nums tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] ${
                      timeLeft <= 3 && !isRevealed
                        ? 'text-3xl sm:text-4xl md:text-5xl text-white inline-block animate-in zoom-in-125 duration-200'
                        : isUrgent && !isRevealed
                        ? 'text-3xl sm:text-4xl md:text-5xl text-amber-300 inline-block animate-in zoom-in-110 duration-200'
                        : 'text-2xl sm:text-3xl md:text-4xl text-[#00E5FF]'
                    }`}
                  >
                    {String(timeLeft).padStart(2, '0')}
                  </span>
                  <span className="text-xs sm:text-sm font-black uppercase text-current/70">
                    s
                  </span>
                </div>
              </div>

              {/* Stage Tension Status Label */}
              <div className="hidden md:flex flex-col justify-center pl-1 sm:pl-2 border-l border-current/25 leading-tight">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-current drop-shadow">
                  {isRevealed
                    ? '✨ RESPOSTA REVELADA'
                    : isPaused
                    ? '⏸️ CRONÔMETRO PAUSADO'
                    : timeLeft <= 3
                    ? '🚨 ÚLTIMOS SEGUNDOS!'
                    : isUrgent
                    ? '⚡ CONTAGEM FINAL'
                    : '⏱️ CRONÔMETRO DA TV'}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold opacity-75">
                  {isRevealed
                    ? 'Pressione Próxima (N / Enter)'
                    : isPaused
                    ? 'Pressione Espaço p/ Retomar'
                    : `Tempo Limite: ${questionDuration}s`}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Institutional Logo, Question Index & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Favoo Institutional Logo */}
            <div className="hidden lg:flex items-center px-2.5 py-1 rounded-xl bg-white/95 border border-cyan-400/40 shadow-sm">
              <img
                src="/logo-cropped.png"
                alt="Favoo"
                className="h-6 sm:h-7 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </div>

            {/* Question Index Badge */}
            <div className="px-2.5 sm:px-3 py-1 rounded-xl border border-cyan-400/40 bg-cyan-950/60 text-xs font-black text-[#00E5FF] flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
              <BookOpen className="h-3.5 w-3.5 text-[#00E5FF]" />
              <span>{currentIndex + 1} / {totalQuestions}</span>
            </div>

            {/* Action buttons (Font Size, Sound, Fullscreen, Exit) */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-cyan-500/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLargeFont(prev => !prev)}
                className="h-8 px-2 text-xs gap-1 bg-slate-900 border-cyan-500/40 text-cyan-200 hover:text-white hover:bg-slate-800"
                title="Alternar tamanho da fonte para a TV"
              >
                <Type className="h-3.5 w-3.5 text-[#00E5FF]" />
                <span>{isLargeFont ? 'A+' : 'A'}</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border border-cyan-500/40 bg-slate-900 text-cyan-200 hover:text-white hover:bg-slate-800"
                onClick={handleToggleMute}
                title={isMuted ? "Ativar Áudio" : "Silenciar Áudio"}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4 text-[#00E5FF]" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border border-cyan-500/40 bg-slate-900 text-cyan-200 hover:text-white hover:bg-slate-800"
                onClick={toggleFullscreen}
                title="Tela Cheia (F)"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4 text-[#00E5FF]" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10"
                onClick={onExit}
                title="Sair do Modo TV"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* CENTER STAGE: EXACT MATCH TO USER MOCKUPS WITH DIRECTIONAL TRANSITION (PLANO 5) */}
      <main className="relative z-10 flex-1 min-h-0 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-14 py-2 sm:py-3 w-full max-w-[1850px] mx-auto flex flex-col justify-center overflow-hidden">
        <div
          key={currentIndex}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 xl:gap-9 items-stretch w-full max-h-full min-h-0 ${
            navDirection === 'next' ? 'anim-question-next' : 'anim-question-prev'
          }`}
        >
          
          {/* LEFT COLUMN: LARGE ROUNDED STATEMENT CARD (SHOW DO MILHÃO THEME) */}
          <div className={`${
            currentQuestion.imageUrl
              ? 'lg:col-span-6 xl:col-span-7 2xl:col-span-7'
              : 'lg:col-span-7 xl:col-span-8 2xl:col-span-8'
          } flex flex-col min-h-0 h-full transition-all duration-500 ease-out ${
            activeEffect === 'step_by_step'
              ? (entranceStep >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16')
              : 'opacity-100 translate-x-0'
          }`}>
            <div
              className="p-5 sm:p-6 md:p-7 lg:p-8 xl:p-9 rounded-[28px] md:rounded-[32px] transition-all flex-1 min-h-0 flex flex-col justify-center max-h-[calc(100vh-135px)] overflow-hidden bg-gradient-to-br from-[#1c0f42] via-[#161245] to-[#0a1532] border-2 border-cyan-400/40 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(0,229,255,0.18)] text-white"
            >
              {/* Question Header Banner matching user's attached reference */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-cyan-400/30 shrink-0">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-[#00E5FF] uppercase drop-shadow-[0_0_12px_rgba(0,229,255,0.7)]">
                    QUESTÃO
                  </span>
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#00E5FF] tracking-tight drop-shadow-[0_0_16px_rgba(0,229,255,0.8)] font-mono">
                    {String(currentIndex + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs font-bold text-cyan-200 bg-cyan-950/70 border border-cyan-400/40 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                    {quiz.category || 'ENEM'}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-300 bg-slate-900/70 px-2.5 py-1 rounded-full border border-slate-700">
                    {currentIndex + 1} de {totalQuestions}
                  </span>
                </div>
              </div>

              {/* Question Statement Text with Lateral Responsiveness */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-tv-scrollbar flex flex-col justify-center">
                <p className={`font-medium leading-relaxed whitespace-pre-line text-left text-slate-100 ${
                  isLargeFont
                    ? 'text-base sm:text-lg md:text-xl lg:text-2xl'
                    : 'text-sm sm:text-base md:text-[16px] lg:text-[17px] xl:text-[18px] 2xl:text-[20px]'
                }`}>
                  {currentQuestion.statement}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: IMAGE ON TOP (IF PRESENT) + ALTERNATIVES UNDERNEATH */}
          <div className={`${
            currentQuestion.imageUrl
              ? 'lg:col-span-6 xl:col-span-5 2xl:col-span-5'
              : 'lg:col-span-5 xl:col-span-4 2xl:col-span-4'
          } flex flex-col justify-center gap-2.5 sm:gap-3 min-h-0 h-full`}>
            
            {/* IMAGE CARD (DIRECTLY ON TOP OF ALTERNATIVES AS IN USER MOCKUP) */}
            {currentQuestion.imageUrl && (
              <div
                onClick={() => setZoomedImage(currentQuestion.imageUrl || null)}
                className="relative group cursor-pointer rounded-[22px] overflow-hidden bg-[#0c1836] border-2 border-cyan-400/40 shadow-xl p-2.5 max-h-48 sm:max-h-56 md:max-h-64 lg:max-h-72 flex items-center justify-center shrink-0 w-full transition-all duration-300 hover:border-cyan-300"
                title="Clique para ampliar a imagem na TV (ou aperte a tecla Z)"
              >
                <img
                  src={currentQuestion.imageUrl}
                  alt="Imagem de apoio da questão"
                  className="max-h-44 sm:max-h-52 md:max-h-60 lg:max-h-64 w-auto max-w-full object-contain object-center transition-transform group-hover:scale-[1.01]"
                />
                <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/85 text-[#00E5FF] text-[10px] md:text-xs rounded-lg flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity font-bold border border-cyan-400/40 shadow-md">
                  <ZoomIn className="h-3 w-3" /> Ampliar (Z)
                </div>
              </div>
            )}

            {/* ALTERNATIVES PILLS (UNDER THE IMAGE) */}
            <div className={`flex flex-col justify-center ${
              currentQuestion.imageUrl ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-3 flex-1'
            }`}>
              {currentQuestion.alternatives.map((alt, altIdx) => {
                const cardStyles = getAlternativeCardStyles(alt);
                const badgeStyle = getBadgeStyle(alt);

                // Entrance animation styles
                let entranceAnimClasses = "transition-all duration-300 ease-out";
                if (activeEffect === 'delay') {
                  if (!isEntranceFinished && entranceStep < 1) {
                    entranceAnimClasses += " opacity-0 translate-y-6 pointer-events-none";
                  } else {
                    entranceAnimClasses += " opacity-100 translate-y-0";
                  }
                } else if (activeEffect === 'step_by_step') {
                  const isItemVisible = isEntranceFinished || entranceStep > altIdx;
                  if (!isItemVisible) {
                    entranceAnimClasses += " opacity-0 translate-x-16 pointer-events-none scale-95";
                  } else {
                    entranceAnimClasses += " opacity-100 translate-x-0 scale-100 shadow-xs";
                  }
                } else {
                  // normal
                  entranceAnimClasses += " opacity-100 translate-x-0";
                }

                return (
                  <div
                    key={alt.letter}
                    style={{
                      animationDelay: `${altIdx * 70}ms`,
                    }}
                    className={`relative overflow-hidden flex items-center px-4 py-2.5 sm:px-5 sm:py-3 rounded-full md:rounded-2xl transition-all duration-300 text-left ${cardStyles} ${entranceAnimClasses} ${
                      isRevealed && alt.isCorrect ? 'anim-winner-glow ring-4 ring-emerald-300/80 shadow-[0_0_35px_rgba(16,185,129,0.8)]' : ''
                    }`}
                  >
                    {/* Subtle Sheen Glint on unrevealed alternatives */}
                    {!isRevealed && (
                      <div className="pointer-events-none absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent anim-card-glint" />
                    )}

                    {/* Letter badge: circular badge with electric cyan styling */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shrink-0 mr-3 shadow-md ${badgeStyle}`}
                    >
                      {alt.letter.toLowerCase()}
                    </div>

                    {/* Alternative text */}
                    <div className="flex-1 pr-1">
                      <span className={`leading-snug block font-semibold line-clamp-3 ${
                        isLargeFont ? 'text-xs sm:text-sm md:text-base' : 'text-xs sm:text-sm md:text-[14px]'
                      }`}>
                        {alt.text}
                      </span>
                    </div>

                    {/* Stamp when revealed */}
                    {isRevealed && alt.isCorrect && (
                      <span className="ml-2 px-3.5 py-1 text-[11px] sm:text-xs font-black rounded-full bg-white text-emerald-900 shrink-0 shadow-lg ring-2 ring-emerald-300 animate-in zoom-in-75 duration-300 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        CORRETA
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </main>

      {/* BOTTOM HOST CONTROL DOCK */}
      <footer
        className="relative z-30 px-4 sm:px-6 md:px-8 lg:px-12 py-2.5 border-t border-cyan-500/30 bg-[#06142e]/95 backdrop-blur-md shrink-0 text-slate-200 shadow-xl"
      >
        <div className="max-w-[1850px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* BOTTOM LEFT CORNER: LOGO + Host Controls */}
          <div className="flex items-center gap-3">
            {/* Favoo Institutional Logo - Crisp, Large and Well-sized */}
            <div className="flex items-center pl-1 pr-3 border-r border-indigo-500/40 shrink-0">
              <div className="bg-white/95 px-3 py-1 rounded-xl shadow-md border border-cyan-400/40 flex items-center justify-center">
                <img
                  src="/logo-cropped.png"
                  alt="Favoo"
                  className="h-8 sm:h-9 md:h-10 w-auto max-w-[160px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo.png";
                  }}
                />
              </div>
            </div>

            {/* Iniciar Tempo / Pular Animação (quando em andamento) */}
            {!isEntranceFinished ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="default"
                  size="sm"
                  onClick={finishEntrance}
                  className="h-8 text-xs font-bold gap-1 bg-[#00E5FF] hover:bg-cyan-300 text-slate-950 shadow-xs animate-pulse"
                  title="Pular animação e iniciar contagem de tempo agora (Enter)"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Iniciar Tempo (Enter)</span>
                </Button>

                {activeEffect === 'step_by_step' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={advanceStep}
                    className="h-8 text-xs font-semibold gap-1 border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/40"
                    title="Avançar para a próxima alternativa (Espaço)"
                  >
                    <ArrowRightCircle className="h-3 w-3" />
                    <span>Avançar Item</span>
                  </Button>
                )}
              </div>
            ) : null}

            {/* Pause / Resume Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(prev => !prev)}
              disabled={!isEntranceFinished}
              className="h-8 text-xs font-bold gap-1.5 border-cyan-500/40 bg-slate-900 text-cyan-300 hover:bg-cyan-950 hover:text-white shadow-xs"
              title="Pausar / Retomar tempo (Espaço)"
            >
              {isPaused ? <Play className="h-3.5 w-3.5 text-[#00E5FF]" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
              <span>{isPaused ? 'Continuar (Espaço)' : 'Pausar (Espaço)'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetQuestionState(currentIndex)}
              className="h-8 text-xs text-slate-300 hover:text-[#00E5FF] hover:bg-cyan-950/40"
              title="Reiniciar tempo desta questão"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reiniciar
            </Button>

            {/* Quick Effect Switcher for Host */}
            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-indigo-500/40">
              <span className="text-[11px] text-cyan-200/70 font-semibold flex items-center gap-1">
                <Zap className="h-3 w-3 text-[#00E5FF]" /> Efeito:
              </span>
              <select
                value={activeEffect}
                onChange={(e) => {
                  const newEff = e.target.value as 'normal' | 'delay' | 'step_by_step';
                  setActiveEffect(newEff);
                  resetQuestionState(currentIndex);
                }}
                className="h-7 text-xs rounded-lg border border-cyan-500/40 bg-slate-900 px-2 font-medium text-cyan-200 focus:outline-none cursor-pointer"
                title="Mudar efeito de entrada da apresentação"
              >
                <option value="normal">1. Normal (Direto)</option>
                <option value="delay">2. Delay (Leitura primeiro)</option>
                <option value="step_by_step">3. Passando pro Lado</option>
              </select>
            </div>
          </div>

          {/* Reveal & Next Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-8 text-xs gap-1 border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
              title="Questão anterior (Seta Esquerda)"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </Button>

            {!isRevealed ? (
              <Button
                size="sm"
                onClick={() => handleReveal(false)}
                className="h-8 text-xs font-black gap-1.5 px-5 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950"
                title="Revelar resposta antes do tempo acabar (Tecla R ou Enter)"
              >
                <Sparkles className="h-3.5 w-3.5 text-slate-950" /> Revelar Resposta
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleNext}
                className="h-8 text-xs font-black gap-1.5 px-6 shadow-[0_0_18px_rgba(0,229,255,0.6)] bg-gradient-to-r from-[#00E5FF] to-cyan-400 hover:from-cyan-300 hover:to-cyan-200 text-slate-950"
                title="Avançar para a próxima (Tecla N ou Seta Direita)"
              >
                <span>{currentIndex === totalQuestions - 1 ? 'Finalizar Simulado' : 'Próxima Questão'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Hotkey Helper Bar */}
        <div className="text-center text-[9px] sm:text-[10px] text-cyan-200/60 pt-1 hidden md:block">
          Atalhos na TV: <span className="text-white font-medium">[Espaço] Pausar / Avançar</span> • <span className="text-white font-medium">[R / Enter] Revelar</span> • <span className="text-white font-medium">[N / Seta Dir] Próxima</span> • <span className="text-white font-medium">[Z] Ampliar Imagem</span>
        </div>
      </footer>

      {/* CINEMATIC FLY-THROUGH INTRO OVERLAY (Continuously expanding logo & title until flying past screen) */}
      {showIntro && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden select-none pointer-events-none intro-3d-stage"
          style={{ perspective: '1000px', perspectiveOrigin: 'center center' }}
        >
          {/* INJECTED KEYFRAMES FOR 3D PERSPECTIVE ENTRANCE + HOLD + EXPONENTIAL PUSH */}
          <style>{`
            @keyframes logoExponentialPush {
              /* FASE 1: ENTRADA SUAVE (0ms a 650ms / 0% a 22%) */
              0% {
                transform: translate3d(0, 26px, -240px);
                opacity: 0;
                filter: blur(4px);
              }
              22% {
                transform: translate3d(0, 0px, 0px);
                opacity: 1;
                filter: blur(0px);
              }

              /* FASE 2: PAUSA PARA LEITURA (650ms a 1650ms / 22% a 57%) */
              57% {
                transform: translate3d(0, 0px, 0px);
                opacity: 1;
                filter: blur(0px);
              }

              /* FASE 3: DISPARO EXPONENCIAL ACELERADO (1650ms a 2900ms / 57% a 100%) */
              73% {
                transform: translate3d(0, 0, 360px);
                opacity: 1;
                filter: blur(0px);
              }
              86% {
                transform: translate3d(0, 0, 680px);
                opacity: 1;
                filter: blur(0px);
              }
              93% {
                transform: translate3d(0, 0, 870px);
                opacity: 0.85;
                filter: blur(0.5px);
              }
              97% {
                transform: translate3d(0, 0, 940px);
                opacity: 0.45;
                filter: blur(1px);
              }
              100% {
                transform: translate3d(0, 0, 980px);
                opacity: 0;
                filter: blur(2px);
              }
            }

            @keyframes introBgDissolve {
              0%, 80% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }

            @keyframes introItemSlideDown {
              0% {
                opacity: 0;
                transform: translateY(-16px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes introItemSlideUp {
              0% {
                opacity: 0;
                transform: translateY(18px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes introItemFade {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }

            .intro-3d-stage {
              perspective: 1000px !important;
              perspective-origin: center center !important;
            }

            .intro-hero-expand {
              transform-style: preserve-3d !important;
              animation: logoExponentialPush 2900ms linear forwards !important;
              will-change: transform, opacity, filter;
            }

            .intro-bg-dissolve {
              animation: introBgDissolve 2900ms linear forwards !important;
              will-change: opacity;
            }
          `}</style>

          {/* Solid background: white, dissolves smoothly as logo reaches the camera */}
          <div className="absolute inset-0 bg-white intro-bg-dissolve" />

          {/* Centered 3D entity: grows exponentially through perspective depth without using scale */}
          <div
            className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center intro-hero-expand"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Logo with smooth entrance */}
            <div
              className="relative flex items-center justify-center mb-5"
              style={{
                animation: 'introItemSlideDown 550ms cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: '60ms',
              }}
            >
              <img
                src="/logo-blue.png"
                alt="Logo da Revisão"
                className="h-24 sm:h-28 md:h-32 w-auto max-w-[340px] object-contain drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            {/* Subtitle badge with smooth entrance */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3702B3]/10 border border-[#3702B3]/25 text-[#3702B3] text-xs font-black uppercase tracking-[0.25em] mb-4 shadow-xs"
              style={{
                animation: 'introItemSlideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: '160ms',
              }}
            >
              <Sparkles className="h-4 w-4 text-[#3702B3]" />
              <span>REVISÃO ENEM</span>
            </div>

            {/* Revision Title with smooth entrance */}
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-black text-[#3702B3] tracking-tight leading-tight mb-3 drop-shadow-xs"
              style={{
                animation: 'introItemSlideUp 600ms cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: '240ms',
              }}
            >
              {quiz.title}
            </h1>

            {/* Category / Question counter with smooth entrance */}
            <p
              className="text-sm sm:text-base md:text-lg text-slate-500 font-bold tracking-wide"
              style={{
                animation: 'introItemFade 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: '360ms',
              }}
            >
              {quiz.category ? `${quiz.category} • ` : ''}
              {totalQuestions} {totalQuestions === 1 ? 'questão' : 'questões'}
            </p>
          </div>

          {/* Host Skip Button */}
          <button
            type="button"
            onClick={skipIntro}
            className="pointer-events-auto absolute bottom-6 right-6 px-4 py-2 rounded-xl bg-[#3702B3]/5 hover:bg-[#3702B3]/10 border border-[#3702B3]/20 text-[#3702B3] text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer z-20 shadow-xs"
            title="Pular abertura e iniciar o quiz agora"
          >
            <span>Pular Abertura</span>
            <span className="text-[10px] font-mono opacity-60">[Espaço / Enter]</span>
          </button>
        </div>
      )}

      {/* FULLSCREEN IMAGE ZOOM DIALOG */}
      <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
        <DialogContent className="max-w-5xl md:max-w-6xl p-4 sm:p-6 flex flex-col items-center justify-center bg-black/95 text-white border-slate-800">
          <DialogHeader className="w-full flex flex-row items-center justify-between pb-2">
            <DialogTitle className="text-sm font-medium text-slate-300">
              Imagem de Apoio da Questão {currentIndex + 1}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Visualização ampliada da imagem
            </DialogDescription>
          </DialogHeader>
          {zoomedImage && (
            <div className="w-full flex items-center justify-center max-h-[85vh] overflow-hidden rounded-lg bg-white/5 p-2">
              <img
                src={zoomedImage}
                alt="Imagem ampliada"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-md shadow-2xl bg-white p-2"
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
