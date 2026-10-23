import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { AULAO_ENEM_QUIZ } from '../src/data/initial-quiz';

export async function runSeed() {
  console.log('🚀 Iniciando processo de seed do banco de dados...');

  // 1. Garantir usuário administrador padrão
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
  } else {
    console.log('ℹ️ Usuário administrador já existe.');
  }

  // 2. Verificar integridade e sincronizar imagens de apoio
  try {
    const fs = await import('fs');
    const path = await import('path');
    const frontPublic = path.resolve(__dirname, '../../frontend/public/questoes');
    const apiUploads = path.resolve(__dirname, '../uploads/questoes');

    if (!fs.existsSync(apiUploads)) {
      fs.mkdirSync(apiUploads, { recursive: true });
    }

    if (fs.existsSync(frontPublic)) {
      const files = fs.readdirSync(frontPublic).filter(f => f.endsWith('.png'));
      for (const file of files) {
        const dest = path.join(apiUploads, file);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(path.join(frontPublic, file), dest);
        }
      }
      console.log(`🖼️ Imagens das questões sincronizadas: ${files.length} imagens ativas em public/questoes/`);
    }
  } catch (imgErr) {
    console.warn('Aviso sobre verificação de imagens:', imgErr);
  }

  // 3. Limpar quiz ENEM anterior para atualização completa e limpa
  console.log('🔄 Atualizando quiz "Aulão ENEM Oficial"...');
  await prisma.quiz.deleteMany({
    where: { category: 'ENEM' },
  });

  // 4. Cadastrar o Aulão ENEM Oficial com as 18 questões completas
  const createdQuiz = await prisma.quiz.create({
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

  console.log(`✅ Aulão ENEM Oficial com 18 questões cadastrado com sucesso! ID: ${createdQuiz.id}`);
  return createdQuiz;
}

if (require.main === module) {
  runSeed()
    .catch((e) => {
      console.error('❌ Erro durante a execução do seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
