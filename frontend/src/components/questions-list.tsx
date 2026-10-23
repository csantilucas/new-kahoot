"use client";

import React, { useState } from 'react';
import { Quiz, Question, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { QuestionModal } from './question-modal';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Play,
  ArrowLeft,
} from 'lucide-react';

interface QuestionsListProps {
  quiz: Quiz;
  onBack: () => void;
  onStartTv: (quiz: Quiz) => void;
  onRefreshQuiz: () => void;
}

export function QuestionsList({ quiz, onBack, onStartTv, onRefreshQuiz }: QuestionsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta questão?')) return;
    try {
      await api.deleteQuestion(id);
      onRefreshQuiz();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir questão.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...(quiz.questions || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;

    const questionIds = newQuestions.map(q => q.id);
    try {
      await api.reorderQuestions(quiz.id, questionIds);
      onRefreshQuiz();
    } catch (err: any) {
      alert(err.message || 'Erro ao reordenar.');
    }
  };

  const currentQuestions = quiz.questions || [];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 -ml-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{quiz.title}</h2>
            <Badge variant="outline" className="border-primary/25 text-primary bg-primary/5">{quiz.category || 'Geral'}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentQuestions.length} {currentQuestions.length === 1 ? 'questão' : 'questões'} • {quiz.secondsPerQuestion}s por questão
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" /> Nova Questão
          </Button>
          <Button
            size="sm"
            onClick={() => onStartTv(quiz)}
            disabled={currentQuestions.length === 0}
            className="gap-1.5 text-xs h-8"
          >
            <Play className="h-3.5 w-3.5" /> Apresentar na TV
          </Button>
        </div>
      </div>

      {/* Questions list */}
      {currentQuestions.length === 0 ? (
        <div className="p-10 text-center border rounded-lg border-dashed text-muted-foreground text-sm space-y-3">
          <p>Nenhuma questão cadastrada nesta revisão.</p>
          <Button variant="outline" size="sm" onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Cadastrar Questão
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {currentQuestions.map((q, idx) => (
            <Card key={q.id} className="p-3.5">
              <div className="flex gap-3 items-start justify-between">
                <div className="flex gap-3 items-start flex-1 min-w-0">
                  {/* Order & Reorder arrows */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                    <span className="w-6 h-6 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer p-0.5"
                      title="Subir"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === currentQuestions.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer p-0.5"
                      title="Descer"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Statement & options */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {q.statement}
                    </p>

                    {q.imageUrl && (
                      <div className="h-20 w-36 rounded border overflow-hidden bg-muted/20">
                        <img src={q.imageUrl} alt="" className="w-full h-full object-contain" />
                      </div>
                    )}

                    {/* Alternatives badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {q.alternatives.map((alt) => (
                        <div
                          key={alt.letter}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${
                            alt.isCorrect
                              ? 'border-primary/40 bg-primary/5 text-foreground font-medium'
                              : 'bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold ${
                            alt.isCorrect ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {alt.letter}
                          </span>
                          <span className="truncate flex-1">{alt.text}</span>
                          {alt.isCorrect && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded border">
                        <strong>Comentário:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(q)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Editar"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(q.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <QuestionModal
        isOpen={isModalOpen}
        quizId={quiz.id}
        questionToEdit={editingQuestion}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => onRefreshQuiz()}
      />
    </div>
  );
}
