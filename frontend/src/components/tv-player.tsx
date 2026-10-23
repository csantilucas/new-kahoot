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
  const [timeLeft, setTimeLeft] = useState(quiz.secondsPerQuestion || 45);
  const [isPaused, setIsPaused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Cinematic Intro Splash Screen (Logo + Title continuously expand until flying past the screen)
  const [showIntro, setShowIntro] = useState(true);

  // Entrance Effects: 'normal' | 'delay' | 'step_by_step'
  const [activeEffect, setActiveEffect] = useState<'normal' | 'delay' | 'step_by_step'>(
    ((quiz.entranceEffect as any) || 'normal') as any
  );
  const [isEntranceFinished, setIsEntranceFinished] = useState(false);
  const [entranceStep, setEntranceStep] = useState(0);
  
  // Clean Light Mode (default true as requested)
  const [isLightMode, setIsLightMode] = useState(true);

  // Zoom Image modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Font size toggle for distance viewing ('base' | 'large')
  const [isLargeFont, setIsLargeFont] = useState(false);

  // Audio configuration modal
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const warningTime = quiz.warningSeconds || 8;
  const isUrgent = timeLeft <= warningTime && timeLeft > 0 && !isRevealed;

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899'],
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
    setTimeLeft(quiz.secondsPerQuestion || 45);
    setIsPaused(false);
    setIsRevealed(false);
    setZoomedImage(null);
    setIsEntranceFinished(false);
    setEntranceStep(0);

    if (!skipMusic && quiz.bgMusic && quiz.bgMusic !== 'none') {
      soundManager.startBackgroundMusic(quiz.bgMusic, quiz.customMusicUrl || undefined);
    }
  }, [quiz]);

  // Load question
  useEffect(() => {
    if (questions.length === 0) return;
    resetQuestionState(currentIndex, showIntro);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      soundManager.stopBackgroundMusic();
    };
  }, [currentIndex, questions.length, showIntro, resetQuestionState]);

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

  // Reveal answer with animation and celebration
  const handleReveal = useCallback((isTimeUp = false) => {
    setIsRevealed((prev) => {
      if (prev) return prev; // already revealed
      soundManager.stopBackgroundMusic();

      if (quiz.soundEffects) {
        if (isTimeUp) {
          soundManager.playTimeUpBuzzer();
          setTimeout(() => {
            soundManager.playCorrectAnswer();
            triggerConfetti();
          }, 600);
        } else {
          soundManager.playRevealSuspense();
          setTimeout(() => {
            soundManager.playCorrectAnswer();
            triggerConfetti();
          }, 350);
        }
      } else {
        triggerConfetti();
      }

      return true;
    });
  }, [quiz.soundEffects, triggerConfetti]);

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
        if (quiz.soundEffects) {
          if (next <= 10) {
            soundManager.playCountdownSound();
          } else if (next <= warningTime) {
            soundManager.playHeartbeat();
          } else {
            soundManager.playTickingSound();
          }
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isEntranceFinished, isPaused, isRevealed, isCompleted, warningTime, quiz, handleReveal]);

  // Next Question
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      soundManager.stopBackgroundMusic();
      if (quiz.soundEffects) {
        soundManager.playCorrectAnswer();
        triggerConfetti();
      }
    }
  };

  // Previous Question
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Restart Quiz
  const handleRestart = () => {
    setIsCompleted(false);
    setCurrentIndex(0);
    setShowIntro(true);
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

  // Badges for alternatives (a, b, c, d, e) - circular badge with brand identity
  const getBadgeStyle = (alt: Alternative) => {
    if (isRevealed) {
      if (alt.isCorrect) {
        return 'bg-white text-emerald-800 shadow-md font-black ring-2 ring-emerald-300 scale-105 transition-transform duration-300';
      }
      return 'opacity-25 bg-slate-200 text-slate-400 border-transparent transition-opacity duration-300';
    }

    return 'bg-[#3702B3] text-white font-black shadow-xs';
  };

  // Card styles for alternatives: rounded pill shape matching structure, colors: pure White and Blue #3702B3
  // Pure presentation mode: no answer selecting / click hover states
  const getAlternativeCardStyles = (alt: Alternative) => {
    if (isRevealed) {
      if (alt.isCorrect) {
        return 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-2 border-emerald-400 shadow-xl font-bold ring-4 ring-emerald-400/40 scale-[1.02] cursor-default transition-all duration-500';
      } else {
        return isLightMode
          ? 'opacity-25 bg-white border-2 border-slate-200 text-slate-400 scale-[0.99] cursor-default transition-all duration-500'
          : 'opacity-20 bg-slate-900 border-2 border-slate-800 text-slate-500 scale-[0.99] cursor-default transition-all duration-500';
      }
    }

    return isLightMode
      ? 'bg-white border-2 border-slate-200 text-slate-900 shadow-xs cursor-default'
      : 'bg-slate-900 border-2 border-slate-800 text-slate-100 shadow-xs cursor-default';
  };

  return (
    <div
      className={`relative h-screen max-h-screen overflow-hidden w-full flex flex-col justify-between select-none transition-colors duration-200 border-[3px] border-[#3702B3] ${
        isLightMode
          ? 'bg-white text-slate-900'
          : 'bg-[#080d1a] text-slate-100'
      }`}
    >
      {/* TOP TIME BAR: drains smoothly; turns amber/red with shimmer near the end */}
      {!showIntro && (
        <div className="absolute top-0 left-0 right-0 h-1.5 z-40 bg-slate-200/60 dark:bg-slate-800/60 overflow-hidden">
          <div
            className={`h-full origin-left transition-[width,background-color] duration-1000 ease-linear ${
              isRevealed
                ? 'bg-emerald-500'
                : timeLeft <= 5
                ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-500 anim-bar-shimmer'
                : isUrgent
                ? 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 anim-bar-shimmer'
                : 'bg-[#3702B3]'
            }`}
            style={{ width: `${isEntranceFinished ? Math.max(0, (timeLeft / (quiz.secondsPerQuestion || 45)) * 100) : 100}%` }}
          />
        </div>
      )}

      {/* FINAL COUNTDOWN BUBBLE (last 5s): corner only, never covers the question */}
      {!showIntro && isEntranceFinished && !isRevealed && !isPaused && timeLeft <= 5 && timeLeft > 0 && (
        <div className="pointer-events-none fixed bottom-20 right-6 sm:right-10 z-40 flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
          <span className={`absolute inset-0 rounded-full anim-final-ring ${timeLeft <= 3 ? 'bg-red-500/40' : 'bg-amber-400/40'}`} />
          <div
            className={`relative w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 border-white ${
              timeLeft <= 3 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
            }`}
          >
            <span key={timeLeft} className="anim-final-num text-5xl sm:text-6xl font-black text-white tabular-nums drop-shadow">
              {timeLeft}
            </span>
          </div>
        </div>
      )}
      {/* TOP HEADER */}
      <header
        className={`relative z-20 px-4 sm:px-6 py-2 flex items-center justify-between border-b backdrop-blur-md shrink-0 transition-colors ${
          isLightMode
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
            : 'bg-slate-950/80 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Badge
            variant="default"
            className="text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider bg-[#3702B3] text-white hover:bg-[#3702B3]"
          >
            ENEM
          </Badge>
          <span className="font-semibold text-sm hidden sm:inline truncate max-w-xs md:max-w-md">
            {quiz.title}
          </span>
          {quiz.category && (
            <span className={`text-xs hidden md:inline px-2 py-0.5 rounded-full border ${
              isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              {quiz.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Question Index Badge */}
          <div className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
            isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}>
            <BookOpen className="h-3.5 w-3.5 text-[#3702B3]" />
            <span>{currentIndex + 1} / {totalQuestions}</span>
          </div>

          {/* Entrance Status or Countdown Timer (Only runs after entrance finishes!) */}
          {!isEntranceFinished ? (
            <button
              type="button"
              onClick={finishEntrance}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#3702B3]/10 text-[#3702B3] border border-[#3702B3]/30 hover:bg-[#3702B3]/20 transition-all cursor-pointer shadow-xs animate-pulse"
              title="Animação de entrada em andamento. Clique para iniciar o tempo agora (ou aperte Enter)"
            >
              <Play className="h-3.5 w-3.5 fill-current text-[#3702B3]" />
              <span className="hidden sm:inline">
                {activeEffect === 'normal' && 'Carregando...'}
                {activeEffect === 'delay' && 'Leitura (Iniciar Tempo)'}
                {activeEffect === 'step_by_step' && `Apresentando (${Math.min(entranceStep, currentQuestion?.alternatives?.length || 4)}/${currentQuestion?.alternatives?.length || 4}) - Iniciar`}
              </span>
              <span className="sm:hidden">Iniciar</span>
              <span className="px-1.5 py-0.5 rounded bg-[#3702B3] text-white text-[10px] font-mono">
                {timeLeft}s
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isPaused && (
                <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  PAUSADO
                </span>
              )}
              {isRevealed && (
                <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-in zoom-in-75 duration-200">
                  <Sparkles className="h-3 w-3 text-emerald-600" /> Revelada
                </span>
              )}

              {/* Radial Progress Ring & Pulsing Countdown */}
              <div
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl font-bold border transition-all text-xs shadow-xs ${
                  isRevealed
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                    : timeLeft <= 3
                    ? 'bg-red-500 text-white border-red-600 shadow-md ring-2 ring-red-400/50'
                    : isUrgent
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-[#3702B3]/10 border-[#3702B3]/25 text-[#3702B3]'
                }`}
              >
                {/* SVG Radial Ring */}
                <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 -rotate-90 transform" viewBox="0 0 28 28">
                    <circle
                      cx="14"
                      cy="14"
                      r="10.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="transparent"
                      className="opacity-20"
                    />
                    <circle
                      cx="14"
                      cy="14"
                      r="10.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray={2 * Math.PI * 10.5}
                      strokeDashoffset={
                        2 * Math.PI * 10.5 * (1 - Math.max(0, Math.min(100, timeLeft / (quiz.secondsPerQuestion || 45))))
                      }
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <Clock className={`absolute h-2.5 w-2.5 ${timeLeft <= 3 && !isRevealed ? 'animate-pulse' : ''}`} />
                </div>

                {/* Pop / Pulse Number on Tick */}
                <span
                  key={timeLeft}
                  className={`text-xs sm:text-sm font-black font-mono tracking-tight ${
                    timeLeft <= 5 && !isRevealed
                      ? 'inline-block animate-in zoom-in-125 duration-200'
                      : ''
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>
            </div>
          )}

          {/* Audio Config Modal Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAudioModalOpen(true)}
            className="h-8 px-2 text-xs gap-1 border-[#3702B3]/30 text-[#3702B3] hover:bg-[#3702B3]/5"
            title="Cadastrar e Configurar Áudios Próprios"
          >
            <Music className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Áudios</span>
          </Button>

          {/* Font Size Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLargeFont(prev => !prev)}
            className={`h-8 px-2 text-xs gap-1 ${
              isLightMode ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
            title="Alternar tamanho da fonte para a TV"
          >
            <Type className="h-3.5 w-3.5" />
            <span>{isLargeFont ? 'A+' : 'A'}</span>
          </Button>

          {/* Toggle Light / Dark Mode */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLightMode(prev => !prev)}
            className={`h-8 px-2.5 text-xs gap-1.5 ${
              isLightMode
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Alternar entre Claro e Noturno (Tecla T)"
          >
            {isLightMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{isLightMode ? 'Escuro' : 'Claro'}</span>
          </Button>

          {/* Sound Toggle */}
          <Button
            variant="outline"
            size="icon"
            className={`h-8 w-8 rounded-lg border ${
              isLightMode
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            onClick={handleToggleMute}
            title={isMuted ? "Ativar Áudio" : "Silenciar Áudio"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4 text-[#3702B3]" />}
          </Button>

          {/* Fullscreen */}
          <Button
            variant="outline"
            size="icon"
            className={`h-8 w-8 rounded-lg border ${
              isLightMode
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            onClick={toggleFullscreen}
            title="Tela Cheia (F)"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Exit */}
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
      </header>

      {/* CENTER STAGE: EXACT MATCH TO USER MOCKUPS */}
      <main className="relative z-10 flex-1 min-h-0 px-4 sm:px-6 lg:px-10 py-3 sm:py-4 max-w-7xl mx-auto w-full flex flex-col justify-center overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch w-full max-h-full min-h-0">
          
          {/* LEFT COLUMN: LARGE ROUNDED STATEMENT CARD (MOCKUP STYLE) */}
          <div className={`lg:col-span-6 xl:col-span-7 flex flex-col min-h-0 h-full transition-all duration-600 ease-out ${
            activeEffect === 'step_by_step'
              ? (entranceStep >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16')
              : 'opacity-100 translate-x-0'
          }`}>
            <div
              className={`p-6 sm:p-7 md:p-8 rounded-[24px] md:rounded-[28px] transition-colors shadow-sm flex-1 min-h-0 flex flex-col justify-center max-h-[calc(100vh-140px)] overflow-hidden ${
                isLightMode
                  ? 'bg-white text-slate-900 border-2 border-slate-200/90'
                  : 'bg-slate-900 border-2 border-slate-800 text-slate-100'
              }`}
            >
              {/* Question Statement Text */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col justify-center">
                <p className={`font-normal leading-relaxed whitespace-pre-line text-left ${
                  isLargeFont ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-[17px]'
                } ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                  {currentQuestion.statement}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: IMAGE ON TOP (IF PRESENT) + ALTERNATIVES UNDERNEATH */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center gap-2.5 sm:gap-3 min-h-0 h-full">
            
            {/* IMAGE CARD (DIRECTLY ON TOP OF ALTERNATIVES AS IN USER MOCKUP) */}
            {currentQuestion.imageUrl && (
              <div
                onClick={() => setZoomedImage(currentQuestion.imageUrl || null)}
                className={`relative group cursor-pointer rounded-[20px] md:rounded-[24px] overflow-hidden bg-white border-2 border-slate-200/90 shadow-xs p-2 sm:p-2.5 max-h-48 sm:max-h-56 md:max-h-64 lg:max-h-72 flex items-center justify-center shrink-0 w-full transition-all duration-300 ${
                  activeEffect === 'delay' && !isEntranceFinished && entranceStep === 0
                    ? 'opacity-70 scale-[0.98]'
                    : 'opacity-100 scale-100'
                }`}
                title="Clique para ampliar a imagem na TV (ou aperte a tecla Z)"
              >
                <img
                  src={currentQuestion.imageUrl}
                  alt="Imagem de apoio da questão"
                  className="max-h-44 sm:max-h-52 md:max-h-60 lg:max-h-64 w-auto max-w-full object-contain object-center transition-transform group-hover:scale-[1.01]"
                />
                <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/75 text-white text-[10px] md:text-xs rounded-lg flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity font-medium pointer-events-none shadow-xs">
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
                let entranceAnimClasses = "transition-all duration-500 ease-out";
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
                    className={`flex items-center px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full md:rounded-2xl transition-all duration-200 text-left ${cardStyles} ${entranceAnimClasses}`}
                  >
                    {/* Letter badge: circular badge matching brand structure */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shrink-0 mr-3 shadow-xs ${badgeStyle}`}
                    >
                      {alt.letter.toLowerCase()}
                    </div>

                    {/* Alternative text */}
                    <div className="flex-1 pr-1">
                      <span className={`leading-snug block font-medium line-clamp-3 ${
                        isLargeFont ? 'text-xs sm:text-sm md:text-base' : 'text-xs sm:text-sm md:text-[14px]'
                      }`}>
                        {alt.text}
                      </span>
                    </div>

                    {/* Stamp when revealed */}
                    {isRevealed && alt.isCorrect && (
                      <span className="ml-2 px-3 py-1 text-[11px] sm:text-xs font-black rounded-full bg-white text-emerald-800 shrink-0 shadow-md ring-2 ring-emerald-300 animate-in zoom-in-75 duration-300 flex items-center gap-1">
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
        className={`relative z-30 px-4 sm:px-6 py-2 border-t backdrop-blur-md shrink-0 transition-colors ${
          isLightMode
            ? 'bg-white/95 border-slate-200 text-slate-800'
            : 'bg-slate-950/90 border-slate-800 text-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* BOTTOM LEFT CORNER: LOGO + Host Aids */}
          <div className="flex items-center gap-3">
            {/* LOGO IN BOTTOM-LEFT CORNER AS REQUESTED */}
            <div className="flex items-center pl-1 pr-3 border-r border-slate-200 dark:border-slate-800 shrink-0">
              <img
                src={isLightMode ? "/logo-blue.png" : "/logo-white.png"}
                alt="Logo"
                className="h-7 sm:h-8 w-auto max-w-[150px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </div>

            {/* Iniciar Tempo / Pular Animação (quando em andamento) */}
            {!isEntranceFinished ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="default"
                  size="sm"
                  onClick={finishEntrance}
                  className="h-8 text-xs font-bold gap-1 bg-[#3702B3] hover:bg-[#2c0191] text-white shadow-xs animate-pulse"
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
                    className="h-8 text-xs font-semibold gap-1 border-[#3702B3]/40 text-[#3702B3] hover:bg-[#3702B3]/5"
                    title="Avançar para a próxima alternativa (Espaço)"
                  >
                    <ArrowRightCircle className="h-3 w-3" />
                    <span>Avançar Item</span>
                  </Button>
                )}
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(prev => !prev)}
              disabled={!isEntranceFinished}
              className="h-8 text-xs font-medium gap-1"
              title="Pausar / Retomar tempo (Espaço)"
            >
              {isPaused ? <Play className="h-3 w-3 text-emerald-600" /> : <Pause className="h-3 w-3 text-amber-500" />}
              <span>{isPaused ? 'Continuar' : 'Pausar'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetQuestionState(currentIndex)}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              title="Reiniciar efeito e tempo desta questão"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reiniciar
            </Button>

            {/* Quick Effect Switcher for Host */}
            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                <Zap className="h-3 w-3 text-[#3702B3]" /> Efeito:
              </span>
              <select
                value={activeEffect}
                onChange={(e) => {
                  const newEff = e.target.value as 'normal' | 'delay' | 'step_by_step';
                  setActiveEffect(newEff);
                  resetQuestionState(currentIndex);
                }}
                className="h-7 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                title="Mudar efeito de entrada da apresentação"
              >
                <option value="normal">1. Normal (Direto)</option>
                <option value="delay">2. Delay (Leitura primeiro)</option>
                <option value="step_by_step">3. Passando pro Lado</option>
              </select>
            </div>
          </div>

          {/* Reveal & Next Right */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-8 text-xs gap-1"
              title="Questão anterior (Seta Esquerda)"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </Button>

            {!isRevealed ? (
              <Button
                size="sm"
                onClick={() => handleReveal(false)}
                className="h-8 text-xs font-semibold gap-1 px-4 shadow-xs bg-[#3702B3] hover:bg-[#2c0191] text-white"
                title="Revelar resposta antes do tempo acabar (Tecla R ou Enter)"
              >
                <Sparkles className="h-3.5 w-3.5" /> Revelar Resposta
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleNext}
                className="h-8 text-xs font-semibold gap-1 px-5 shadow-xs bg-[#3702B3] hover:bg-[#2c0191] text-white"
                title="Avançar para a próxima (Tecla N ou Seta Direita)"
              >
                <span>{currentIndex === totalQuestions - 1 ? 'Finalizar' : 'Próxima Questão'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Hotkey Helper Bar */}
        <div className="text-center text-[9px] sm:text-[10px] text-muted-foreground pt-0.5 hidden md:block">
          Atalhos na TV: <span className="text-foreground font-medium">[Espaço] Pausar / Avançar</span> • <span className="text-foreground font-medium">[R / Enter] Revelar</span> • <span className="text-foreground font-medium">[N / Seta Dir] Próxima</span> • <span className="text-foreground font-medium">[Z] Ampliar Imagem</span>
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
