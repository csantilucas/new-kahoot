"use client";

import React, { useState, useEffect } from 'react';
import { Quiz, api } from '@/lib/api';
import { QuizCard } from '@/components/quiz-card';
import { QuizModal } from '@/components/quiz-modal';
import { LoginModal } from '@/components/login-modal';
import { QuestionsList } from '@/components/questions-list';
import { TvPlayer } from '@/components/tv-player';
import { SoundControls } from '@/components/sound-controls';
import { soundManager } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, LogIn, LogOut, Search, Tv } from 'lucide-react';

export default function Home() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sub-views
  const [activeQuizForQuestions, setActiveQuizForQuestions] = useState<Quiz | null>(null);
  const [activeQuizForTv, setActiveQuizForTv] = useState<Quiz | null>(null);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.getQuizzes();
      setQuizzes(data);
    } catch (err: any) {
      console.error('Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(api.getUser());
    loadQuizzes();
  }, []);

  const handleLogout = () => {
    api.removeToken();
    setUser(null);
  };

  const handlePlayTv = async (quiz: Quiz) => {
    try {
      const fullQuiz = await api.getQuiz(quiz.id);
      setActiveQuizForTv(fullQuiz);
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar dados para TV.');
    }
  };

  const handleManageQuestions = async (quiz: Quiz) => {
    try {
      const fullQuiz = await api.getQuiz(quiz.id);
      setActiveQuizForQuestions(fullQuiz);
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar questões.');
    }
  };

  const handleRefreshActiveQuiz = async () => {
    if (activeQuizForQuestions) {
      const updated = await api.getQuiz(activeQuizForQuestions.id);
      setActiveQuizForQuestions(updated);
    }
    loadQuizzes();
  };

  const handleCreateNewQuiz = () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setQuizToEdit(null);
    setIsQuizModalOpen(true);
  };

  const handleEditQuizSettings = (quiz: Quiz) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setQuizToEdit(quiz);
    setIsQuizModalOpen(true);
  };

  const handleDuplicate = async (quiz: Quiz) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    try {
      await api.duplicateQuiz(quiz.id);
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'Erro ao duplicar.');
    }
  };

  const handleDelete = async (quiz: Quiz) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    if (!confirm(`Deseja excluir "${quiz.title}"?`)) return;
    try {
      await api.deleteQuiz(quiz.id);
      loadQuizzes();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    }
  };

  // Dedicated TV Presentation Mode
  if (activeQuizForTv) {
    return (
      <TvPlayer
        quiz={activeQuizForTv}
        onExit={() => {
          soundManager.stopAllAudio();
          setActiveQuizForTv(null);
        }}
      />
    );
  }

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.category && q.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b bg-card px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-blue.png"
              alt="Logo"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
            <span className="font-bold text-base tracking-tight text-[#3702B3]">Revisão TV</span>
          </div>

          <div className="flex items-center gap-3">
            <SoundControls />

            {user ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Sair
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLoginOpen(true)}
                className="h-8 text-xs"
              >
                <LogIn className="h-3.5 w-3.5 mr-1" /> Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-1">
        {activeQuizForQuestions ? (
          <QuestionsList
            quiz={activeQuizForQuestions}
            onBack={() => setActiveQuizForQuestions(null)}
            onStartTv={(q) => handlePlayTv(q)}
            onRefreshQuiz={handleRefreshActiveQuiz}
          />
        ) : (
          <div className="space-y-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Revisões</h1>
                <p className="text-xs text-muted-foreground">
                  Selecione um simulado para apresentar na TV ou gerenciar questões.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleCreateNewQuiz} size="sm" className="gap-1.5 h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Nova Revisão
                </Button>
              </div>
            </div>

            {/* Search filter bar */}
            <div className="flex items-center gap-2 max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar revisão..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* Quizzes Grid */}
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Carregando...
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="p-10 text-center border rounded-lg border-dashed text-muted-foreground text-sm space-y-3">
                <p>Nenhuma revisão encontrada.</p>
                <Button variant="outline" size="sm" onClick={handleCreateNewQuiz}>
                  Criar Revisão
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onPlayTv={handlePlayTv}
                    onManageQuestions={handleManageQuestions}
                    onEditSettings={handleEditQuizSettings}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Revisão TV • Modo Apresentação em Tela
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(u) => setUser(u)}
      />

      <QuizModal
        isOpen={isQuizModalOpen}
        quizToEdit={quizToEdit}
        onClose={() => setIsQuizModalOpen(false)}
        onSuccess={() => loadQuizzes()}
      />
    </div>
  );
}
