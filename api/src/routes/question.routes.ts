import { Router } from 'express';
import { questionController } from '../controllers/question.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Routes nested under /quizzes/:quizId/questions or direct
router.get('/quiz/:quizId', (req, res, next) => questionController.getByQuizId(req, res, next));
router.get('/:id', (req, res, next) => questionController.getById(req, res, next));

// Protected admin routes
router.post('/quiz/:quizId', authMiddleware, (req, res, next) => questionController.create(req, res, next));
router.put('/:id', authMiddleware, (req, res, next) => questionController.update(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => questionController.delete(req, res, next));
router.post('/quiz/:quizId/reorder', authMiddleware, (req, res, next) => questionController.reorder(req, res, next));

export const questionRoutes = router;
