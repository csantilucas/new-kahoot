import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { quizRoutes } from './quiz.routes';
import { questionRoutes } from './question.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/quizzes', quizRoutes);
router.use('/questions', questionRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'revisao-api',
  });
});

export const apiRoutes = router;
