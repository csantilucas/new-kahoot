"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Question, Alternative, api } from '@/lib/api';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface QuestionModalProps {
  isOpen: boolean;
  quizId: string;
  onClose: () => void;
  onSuccess: (savedQuestion: Question) => void;
  questionToEdit?: Question | null;
}

const DEFAULT_ALTERNATIVES: Alternative[] = [
  { letter: 'A', text: '', isCorrect: true, color: 'blue' },
  { letter: 'B', text: '', isCorrect: false, color: 'blue' },
  { letter: 'C', text: '', isCorrect: false, color: 'blue' },
  { letter: 'D', text: '', isCorrect: false, color: 'blue' },
  { letter: 'E', text: '', isCorrect: false, color: 'blue' },
];

export function QuestionModal({ isOpen, quizId, onClose, onSuccess, questionToEdit }: QuestionModalProps) {
  const [statement, setStatement] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [points, setPoints] = useState(100);
  const [explanation, setExplanation] = useState('');
  const [alternatives, setAlternatives] = useState<Alternative[]>(DEFAULT_ALTERNATIVES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (questionToEdit) {
      setStatement(questionToEdit.statement);
      setImageUrl(questionToEdit.imageUrl || '');
      setPoints(questionToEdit.points || 100);
      setExplanation(questionToEdit.explanation || '');
      if (questionToEdit.alternatives && questionToEdit.alternatives.length > 0) {
        setAlternatives(questionToEdit.alternatives.map((a, i) => ({
          letter: a.letter || ['A', 'B', 'C', 'D', 'E'][i],
          text: a.text,
          isCorrect: a.isCorrect,
          color: a.color || 'blue',
        })));
      } else {
        setAlternatives(DEFAULT_ALTERNATIVES);
      }
    } else {
      setStatement('');
      setImageUrl('');
      setPoints(100);
      setExplanation('');
      setAlternatives([
        { letter: 'A', text: '', isCorrect: true, color: 'blue' },
        { letter: 'B', text: '', isCorrect: false, color: 'blue' },
        { letter: 'C', text: '', isCorrect: false, color: 'blue' },
        { letter: 'D', text: '', isCorrect: false, color: 'blue' },
        { letter: 'E', text: '', isCorrect: false, color: 'blue' },
      ]);
    }
    setError('');
  }, [questionToEdit, isOpen]);

  const handleSetCorrect = (index: number) => {
    setAlternatives(prev => prev.map((alt, i) => ({
      ...alt,
      isCorrect: i === index,
    })));
  };

  const handleAlternativeTextChange = (index: number, text: string) => {
    setAlternatives(prev => prev.map((alt, i) => i === index ? { ...alt, text } : alt));
  };

  const handleAddAlternative = () => {
    if (alternatives.length >= 6) return;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextLetter = letters[alternatives.length];
    setAlternatives(prev => [
      ...prev,
      { letter: nextLetter, text: '', isCorrect: false, color: 'blue' },
    ]);
  };

  const handleRemoveAlternative = (index: number) => {
    if (alternatives.length <= 2) return;
    const filtered = alternatives.filter((_, i) => i !== index);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const reindexed = filtered.map((alt, i) => ({
      ...alt,
      letter: letters[i],
    }));
    if (!reindexed.some(a => a.isCorrect)) {
      reindexed[0].isCorrect = true;
    }
    setAlternatives(reindexed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) {
      setError('O texto da questão é obrigatório.');
      return;
    }

    const emptyAlts = alternatives.some(a => !a.text.trim());
    if (emptyAlts) {
      setError('Preencha todas as alternativas.');
      return;
    }

    const hasCorrect = alternatives.some(a => a.isCorrect);
    if (!hasCorrect) {
      setError('Marque uma alternativa como correta.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        statement,
        imageUrl: imageUrl.trim() || undefined,
        points,
        explanation: explanation.trim() || undefined,
        alternatives: alternatives.map(a => ({
          letter: a.letter,
          text: a.text,
          isCorrect: a.isCorrect,
          color: a.color,
        })),
      };

      let result: Question;
      if (questionToEdit) {
        result = await api.updateQuestion(questionToEdit.id, payload);
      } else {
        result = await api.createQuestion(quizId, payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar questão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{questionToEdit ? 'Editar Questão' : 'Nova Questão'}</DialogTitle>
          <DialogDescription>
            Insira o texto da questão, as alternativas e selecione a correta.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Texto da Questão (Enunciado)</label>
            <Textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Cole o texto base e enunciado da questão..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL da Imagem (opcional)</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
            {imageUrl.trim() && (
              <div className="mt-2 h-28 w-full rounded-md overflow-hidden border bg-muted/20 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Pré-visualização"
                  className="max-h-28 w-auto object-contain"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Alternatives */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Alternativas</label>
              {alternatives.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAlternative}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" /> Adicionar Alternativa
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {alternatives.map((alt, idx) => (
                <div
                  key={alt.letter}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                    alt.isCorrect ? 'border-primary/50 bg-primary/5' : 'bg-background'
                  }`}
                >
                  <span className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                    alt.isCorrect ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {alt.letter}
                  </span>

                  <Input
                    value={alt.text}
                    onChange={(e) => handleAlternativeTextChange(idx, e.target.value)}
                    placeholder={`Texto da alternativa ${alt.letter}...`}
                    className="h-8 text-sm"
                    required
                  />

                  <Button
                    type="button"
                    variant={alt.isCorrect ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSetCorrect(idx)}
                    className="h-8 px-2.5 text-xs shrink-0"
                  >
                    {alt.isCorrect ? (
                      <span className="flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correta
                      </span>
                    ) : (
                      'Marcar'
                    )}
                  </Button>

                  {alternatives.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAlternative(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Comentário / Resolução (opcional)</label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explicação da resposta..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : questionToEdit ? 'Atualizar Questão' : 'Salvar Questão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
