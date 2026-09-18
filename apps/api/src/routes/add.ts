import { prisma } from '@packages/db';
import { addBodySchema } from '@packages/shared';
import { Router } from 'express';
import { z } from 'zod';
import { encrypt } from '$services/credential.js';

export const addRouter: Router = Router();

addRouter.post('/add', async (req, res, next) => {
	try {
		const body = addBodySchema.parse(req.body);
		const credential = await prisma.credential.create({
			data: {
				label: body.label,
				encryptedUsername: encrypt(body.username),
				encryptedPassword: encrypt(body.password),
				userId: req.userId as string
			}
		});
		res.status(201).json({
			id: credential.id,
			label: credential.label,
			createdAt: credential.createdAt,
			updatedAt: credential.updatedAt
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			res.status(400).json({ error: 'Validation failed', details: err.issues });
			return;
		}
		next(err);
	}
});
