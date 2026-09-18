declare global {
	namespace Express {
		interface Request {
			/** The authenticated user's id, set by the `requireAuth` middleware. */
			userId?: string;
		}
	}
}

export {};
