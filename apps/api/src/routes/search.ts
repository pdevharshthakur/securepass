import { decrypt } from '$services/credential.js';
import { prisma } from '@packages/db';
import { searchBodySchema } from '@packages/shared';
import { Router } from 'express';
import { z } from 'zod';

export const searchRouter: Router = Router();

searchRouter.post('/search', async (req, res, next) => {
	try {
		const body = searchBodySchema.parse(req.body);
		const searchResults = await prisma.credential.findMany({
			where: {
				userId: req.userId as string,
				label: {
					contains: body.label
				}
			},
			orderBy: [{ label: 'asc' }, { id: 'asc' }]
		});

		return res.json({
			results: searchResults.map((credential) => ({
				id: credential.id,
				label: credential.label,
				username: decrypt(credential.encryptedUsername),
				password: decrypt(credential.encryptedPassword)
			}))
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return res.status(400).json({ error: 'Validation failed', details: err.issues });
		}

		return next(err);
	}
});
