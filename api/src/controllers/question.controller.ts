import { Request, Response, NextFunction } from 'express';
import { questionService } from '../services/question.service';

export class QuestionController {
  async getByQuizId(req: Request, res: Response, next: NextFunction) {
    try {
      const { quizId } = req.params;
      const questions = await questionService.getQuestionsByQuizId(quizId);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const question = await questionService.getQuestionById(id);
      res.json(question);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { quizId } = req.params;
      const question = await questionService.createQuestion({
        ...req.body,
        quizId,
      });
      res.status(201).json(question);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const question = await questionService.updateQuestion(id, req.body);
      res.json(question);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await questionService.deleteQuestion(id);
      res.json({ success: true, message: 'Questão removida com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { quizId } = req.params;
      const { questionIds } = req.body;
      if (!Array.isArray(questionIds)) {
        res.status(400).json({ message: 'questionIds deve ser uma lista de IDs.' });
        return;
      }
      await questionService.reorderQuestions(quizId, questionIds);
      res.json({ success: true, message: 'Questões reordenadas com sucesso.' });
    } catch (error) {
      next(error);
    }
  }
}

export const questionController = new QuestionController();
