import { questionRepository, CreateQuestionInput, UpdateQuestionInput } from '../repositories/question.repository';
import { quizRepository } from '../repositories/quiz.repository';

export class QuestionService {
  async getQuestionsByQuizId(quizId: string) {
    return questionRepository.findByQuizId(quizId);
  }

  async getQuestionById(id: string) {
    const question = await questionRepository.findById(id);
    if (!question) {
      throw new Error('Questão não encontrada.');
    }
    return question;
  }

  async createQuestion(data: CreateQuestionInput) {
    const quiz = await quizRepository.findById(data.quizId);
    if (!quiz) {
      throw new Error('Revisão associada não encontrada.');
    }

    if (!data.statement || data.statement.trim().length === 0) {
      throw new Error('O enunciado da questão é obrigatório.');
    }

    if (!data.alternatives || data.alternatives.length < 2) {
      throw new Error('A questão precisa ter no mínimo 2 alternativas.');
    }

    const correctCount = data.alternatives.filter((a) => a.isCorrect).length;
    if (correctCount === 0) {
      throw new Error('Pelo menos uma alternativa deve ser marcada como correta.');
    }

    return questionRepository.create(data);
  }

  async updateQuestion(id: string, data: UpdateQuestionInput) {
    const existing = await questionRepository.findById(id);
    if (!existing) {
      throw new Error('Questão não encontrada para atualização.');
    }

    if (data.statement !== undefined && data.statement.trim().length === 0) {
      throw new Error('O enunciado da questão não pode ser vazio.');
    }

    if (data.alternatives !== undefined) {
      if (data.alternatives.length < 2) {
        throw new Error('A questão precisa ter no mínimo 2 alternativas.');
      }
      const correctCount = data.alternatives.filter((a) => a.isCorrect).length;
      if (correctCount === 0) {
        throw new Error('Pelo menos uma alternativa deve ser marcada como correta.');
      }
    }

    return questionRepository.update(id, data);
  }

  async deleteQuestion(id: string) {
    const existing = await questionRepository.findById(id);
    if (!existing) {
      throw new Error('Questão não encontrada para exclusão.');
    }

    return questionRepository.delete(id);
  }

  async reorderQuestions(quizId: string, questionIds: string[]) {
    return questionRepository.reorder(quizId, questionIds);
  }
}

export const questionService = new QuestionService();
