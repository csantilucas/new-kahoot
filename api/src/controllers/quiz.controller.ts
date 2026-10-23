import { Request, Response, NextFunction } from 'express';
import { quizService } from '../services/quiz.service';

export class QuizController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const quizzes = await quizService.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const quiz = await quizService.getQuizById(id);
      res.json(quiz);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const quiz = await quizService.createQuiz(req.body);
      res.status(201).json(quiz);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const quiz = await quizService.updateQuiz(id, req.body);
      res.json(quiz);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await quizService.deleteQuiz(id);
      res.json({ success: true, message: 'Revisão excluída com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const duplicated = await quizService.duplicateQuiz(id);
      res.status(201).json(duplicated);
    } catch (error) {
      next(error);
    }
  }
}

export const quizController = new QuizController();
