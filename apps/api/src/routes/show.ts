import { prisma } from '@packages/db';
import { Router } from 'express';

export const showRouter = Router();

showRouter.get('/show', async (req, res) => {
	const data = await prisma.credential.findMany({
		where: { userId: req.userId as string }
	});
	return res.json(data);
});
