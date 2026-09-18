import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';
import { auth } from '../lib/auth.js';

/**
 * Protects a route by requiring a valid Better Auth session.
 *
 * Reads the session from the request's Cookie header and attaches the
 * authenticated user's id to `req.userId`. Responds 401 when there is no
 * (or an expired) session.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers)
	});

	if (!session) {
		res.status(401).json({ error: 'Unauthorized' });
		return;
	}

	req.userId = session.user.id;
	next();
}
