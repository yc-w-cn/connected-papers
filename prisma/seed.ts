import { prisma } from '@/lib/prisma';

async function main() {
  const startPaper = 'https://arxiv.org/abs/2503.15888';

  const arxivId = startPaper.split('/').pop();

  if (!arxivId) {
    throw new Error('无效的 arXiv ID');
  }

  const existingPaper = await prisma.arxivPaper.findUnique({
    where: { arxivId },
  });

  if (existingPaper) {
    console.log('论文已存在:', existingPaper.arxivId);
    return;
  }

  const paper = await prisma.arxivPaper.create({
    data: {
      arxivId: arxivId,
      arxivUrl: startPaper,
      arxivDataStatus: 'pending',
    },
  });

  console.log('论文已创建:', paper.arxivId);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
