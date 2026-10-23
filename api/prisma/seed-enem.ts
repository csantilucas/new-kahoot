import { runSeed } from './seed';
import { prisma } from '../src/lib/prisma';

runSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
