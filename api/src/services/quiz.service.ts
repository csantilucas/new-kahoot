import { quizRepository, CreateQuizInput, UpdateQuizInput } from '../repositories/quiz.repository';

export class QuizService {
  async getAllQuizzes() {
    return quizRepository.findAll();
  }

  async getQuizById(id: string) {
    const quiz = await quizRepository.findById(id);
    if (!quiz) {
      throw new Error('Revisão não encontrada.');
    }
    return quiz;
  }

  async createQuiz(data: CreateQuizInput) {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('O título da revisão é obrigatório.');
    }

    if (data.secondsPerQuestion && data.secondsPerQuestion < 5) {
      throw new Error('O tempo mínimo por questão é de 5 segundos.');
    }

    return quizRepository.create(data);
  }

  async updateQuiz(id: string, data: UpdateQuizInput) {
    const existing = await quizRepository.findById(id);
    if (!existing) {
      throw new Error('Revisão não encontrada para atualização.');
    }

    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new Error('O título da revisão não pode ser vazio.');
    }

    if (data.secondsPerQuestion !== undefined && data.secondsPerQuestion < 5) {
      throw new Error('O tempo mínimo por questão é de 5 segundos.');
    }

    return quizRepository.update(id, data);
  }

  async deleteQuiz(id: string) {
    const existing = await quizRepository.findById(id);
    if (!existing) {
      throw new Error('Revisão não encontrada para exclusão.');
    }

    return quizRepository.delete(id);
  }

  async duplicateQuiz(id: string) {
    const duplicated = await quizRepository.duplicate(id);
    if (!duplicated) {
      throw new Error('Não foi possível duplicar a revisão especificada.');
    }
    return duplicated;
  }
}

export const quizService = new QuizService();
