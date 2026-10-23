import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { apiRoutes } from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';
import { AULAO_ENEM_QUIZ } from './data/initial-quiz';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Static uploads (images, audio)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Ensure default admin user and seed Aulão ENEM if database is empty
async function initDatabase() {
  try {
    const adminCount = await prisma.user.count();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Professor / Apresentador',
          email: 'admin@revisao.com',
          password: hashedPassword,
        },
      });
      console.log('✅ Usuário administrador padrão criado: admin@revisao.com / admin123');
    }

    const quizCount = await prisma.quiz.count({
      where: { category: 'ENEM' },
    });

    if (quizCount === 0) {
      const created = await prisma.quiz.create({
        data: {
          title: AULAO_ENEM_QUIZ.title,
          description: AULAO_ENEM_QUIZ.description,
          category: AULAO_ENEM_QUIZ.category,
          secondsPerQuestion: AULAO_ENEM_QUIZ.secondsPerQuestion,
          warningSeconds: AULAO_ENEM_QUIZ.warningSeconds,
          bgMusic: AULAO_ENEM_QUIZ.bgMusic,
          soundEffects: AULAO_ENEM_QUIZ.soundEffects,
          autoReveal: AULAO_ENEM_QUIZ.autoReveal,
          showExplanation: AULAO_ENEM_QUIZ.showExplanation,
          customMusicUrl: AULAO_ENEM_QUIZ.customMusicUrl,
          correctSoundUrl: AULAO_ENEM_QUIZ.correctSoundUrl,
          timeUpSoundUrl: AULAO_ENEM_QUIZ.timeUpSoundUrl,
          countdownSoundUrl: AULAO_ENEM_QUIZ.countdownSoundUrl,
          confettiSoundUrl: AULAO_ENEM_QUIZ.confettiSoundUrl,
          isPublished: true,
          questions: {
            create: AULAO_ENEM_QUIZ.questions.map((q) => ({
              order: q.order,
              statement: q.statement,
              imageUrl: q.imageUrl || null,
              points: q.points,
              explanation: q.explanation,
              alternatives: {
                create: q.alternatives.map((alt) => ({
                  letter: alt.letter,
                  text: alt.text,
                  isCorrect: alt.isCorrect,
                  color: alt.color,
                })),
              },
            })),
          },
        },
      });
      console.log(`✅ Aulão ENEM Oficial com 18 questões criado automaticamente no banco! ID: ${created.id}`);
    }
  } catch (err) {
    console.error('Erro ao inicializar dados básicos:', err);
  }
}

app.listen(PORT, async () => {
  await initDatabase();
  console.log(`🚀 Servidor Revisão API rodando em http://localhost:${PORT}`);
});
