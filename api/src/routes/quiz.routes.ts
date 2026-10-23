import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes for presenting / running quizzes on TV screens
router.get('/', (req, res, next) => quizController.getAll(req, res, next));
router.get('/:id', (req, res, next) => quizController.getById(req, res, next));

// Protected routes (Admin operations)
router.post('/', authMiddleware, (req, res, next) => quizController.create(req, res, next));
router.put('/:id', authMiddleware, (req, res, next) => quizController.update(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => quizController.delete(req, res, next));
router.post('/:id/duplicate', authMiddleware, (req, res, next) => quizController.duplicate(req, res, next));

export const quizRoutes = router;
