import { prisma } from '../lib/prisma';
import { Quiz, Prisma } from '@prisma/client';

export interface CreateQuizInput {
  title: string;
  description?: string;
  category?: string;
  secondsPerQuestion?: number;
  warningSeconds?: number;
  bgMusic?: string;
  soundEffects?: boolean;
  entranceEffect?: string;
  autoReveal?: boolean;
  showExplanation?: boolean;
  customMusicUrl?: string;
  isPublished?: boolean;
}

export interface UpdateQuizInput extends Partial<CreateQuizInput> {}

export class QuizRepository {
  async findAll() {
    return prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            alternatives: {
              orderBy: { letter: 'asc' },
            },
          },
        },
      },
    });
  }

  async create(data: CreateQuizInput) {
    return prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category || 'Geral',
        secondsPerQuestion: data.secondsPerQuestion ?? 30,
        warningSeconds: data.warningSeconds ?? 5,
        bgMusic: data.bgMusic ?? 'suspense',
        soundEffects: data.soundEffects ?? true,
        entranceEffect: data.entranceEffect ?? 'normal',
        autoReveal: data.autoReveal ?? false,
        showExplanation: data.showExplanation ?? true,
        customMusicUrl: data.customMusicUrl,
        isPublished: data.isPublished ?? true,
      },
    });
  }

  async update(id: string, data: UpdateQuizInput) {
    return prisma.quiz.update({
      where: { id },
      data,
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            alternatives: {
              orderBy: { letter: 'asc' },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.quiz.delete({
      where: { id },
    });
  }

  async duplicate(id: string) {
    const original = await this.findById(id);
    if (!original) return null;

    return prisma.quiz.create({
      data: {
        title: `${original.title} (Cópia)`,
        description: original.description,
        category: original.category,
        secondsPerQuestion: original.secondsPerQuestion,
        warningSeconds: original.warningSeconds,
        bgMusic: original.bgMusic,
        soundEffects: original.soundEffects,
        autoReveal: original.autoReveal,
        showExplanation: original.showExplanation,
        customMusicUrl: original.customMusicUrl,
        isPublished: original.isPublished,
        questions: {
          create: original.questions.map((q) => ({
            order: q.order,
            statement: q.statement,
            imageUrl: q.imageUrl,
            points: q.points,
            explanation: q.explanation,
            alternatives: {
              create: q.alternatives.map((a) => ({
                letter: a.letter,
                text: a.text,
                isCorrect: a.isCorrect,
                color: a.color,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            alternatives: true,
          },
        },
      },
    });
  }
}

export const quizRepository = new QuizRepository();
