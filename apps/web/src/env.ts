import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'PostgreSQL connection string for Prisma',
		schema: building
			? z.url().startsWith('postgresql://').optional()
			: z.url().startsWith('postgresql://')
	},
	PRIVATE_API_URL: {
		description: 'Base URL of the API server',
		schema: z.url().default('http://localhost:8000')
	}
});
