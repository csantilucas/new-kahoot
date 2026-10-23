import { prisma } from '../lib/prisma';

export interface AlternativeInput {
  id?: string;
  letter: string;
  text: string;
  isCorrect: boolean;
  color?: string;
}

export interface CreateQuestionInput {
  quizId: string;
  order?: number;
  statement: string;
  imageUrl?: string;
  points?: number;
  explanation?: string;
  alternatives: AlternativeInput[];
}

export interface UpdateQuestionInput {
  statement?: string;
  imageUrl?: string;
  points?: number;
  explanation?: string;
  order?: number;
  alternatives?: AlternativeInput[];
}

export class QuestionRepository {
  async findByQuizId(quizId: string) {
    return prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
      include: {
        alternatives: {
          orderBy: { letter: 'asc' },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        alternatives: {
          orderBy: { letter: 'asc' },
        },
      },
    });
  }

  async create(data: CreateQuestionInput) {
    // Determine order if not specified
    let order = data.order;
    if (order === undefined) {
      const count = await prisma.question.count({
        where: { quizId: data.quizId },
      });
      order = count + 1;
    }

    const defaultColors = ['red', 'blue', 'yellow', 'green'];

    return prisma.question.create({
      data: {
        quizId: data.quizId,
        order,
        statement: data.statement,
        imageUrl: data.imageUrl,
        points: data.points ?? 100,
        explanation: data.explanation,
        alternatives: {
          create: data.alternatives.map((alt, index) => ({
            letter: alt.letter || ['A', 'B', 'C', 'D'][index] || '?',
            text: alt.text,
            isCorrect: alt.isCorrect,
            color: alt.color || defaultColors[index % defaultColors.length],
          })),
        },
      },
      include: {
        alternatives: {
          orderBy: { letter: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: UpdateQuestionInput) {
    // If alternatives are provided, recreate them or update
    if (data.alternatives) {
      // Transaction to update question and replace alternatives
      return prisma.$transaction(async (tx) => {
        // Delete current alternatives
        await tx.alternative.deleteMany({
          where: { questionId: id },
        });

        const defaultColors = ['red', 'blue', 'yellow', 'green'];

        return tx.question.update({
          where: { id },
          data: {
            statement: data.statement,
            imageUrl: data.imageUrl,
            points: data.points,
            explanation: data.explanation,
            order: data.order,
            alternatives: {
              create: data.alternatives!.map((alt, index) => ({
                letter: alt.letter || ['A', 'B', 'C', 'D'][index] || '?',
                text: alt.text,
                isCorrect: alt.isCorrect,
                color: alt.color || defaultColors[index % defaultColors.length],
              })),
            },
          },
          include: {
            alternatives: {
              orderBy: { letter: 'asc' },
            },
          },
        });
      });
    }

    return prisma.question.update({
      where: { id },
      data: {
        statement: data.statement,
        imageUrl: data.imageUrl,
        points: data.points,
        explanation: data.explanation,
        order: data.order,
      },
      include: {
        alternatives: {
          orderBy: { letter: 'asc' },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.question.delete({
      where: { id },
    });
  }

  async reorder(quizId: string, questionIds: string[]) {
    return prisma.$transaction(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );
  }
}

export const questionRepository = new QuestionRepository();
