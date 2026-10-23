"use client";

import React from 'react';
import { Quiz } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tv,
  ListOrdered,
  Settings,
  Trash2,
  Clock,
} from 'lucide-react';

interface QuizCardProps {
  quiz: Quiz;
  onPlayTv: (quiz: Quiz) => void;
  onManageQuestions: (quiz: Quiz) => void;
  onEditSettings: (quiz: Quiz) => void;
  onDuplicate: (quiz: Quiz) => void;
  onDelete: (quiz: Quiz) => void;
}

export function QuizCard({
  quiz,
  onPlayTv,
  onManageQuestions,
  onEditSettings,
  onDelete,
}: QuizCardProps) {
  const questionCount = quiz._count?.questions ?? quiz.questions?.length ?? 0;

  return (
    <Card className="flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-xs">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="font-semibold text-xs border-primary/25 text-primary bg-primary/5">
            {quiz.category || 'Geral'}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary/70" />
            {quiz.secondsPerQuestion}s
          </span>
        </div>

        <div>
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-1">
            {quiz.title}
          </CardTitle>
          {quiz.description && (
            <CardDescription className="line-clamp-2 mt-1 text-xs">
              {quiz.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-2">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{questionCount} {questionCount === 1 ? 'questão cadastrada' : 'questões cadastradas'}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex flex-col gap-2">
        <Button
          variant="default"
          className="w-full gap-2 font-medium"
          onClick={() => onPlayTv(quiz)}
        >
          <Tv className="h-4 w-4" /> Apresentar na TV
        </Button>

        <div className="flex items-center justify-between w-full pt-1">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onManageQuestions(quiz)}
            >
              <ListOrdered className="h-3.5 w-3.5" /> Perguntas
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onEditSettings(quiz)}
            >
              <Settings className="h-3.5 w-3.5" /> Ajustes
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(quiz)}
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
