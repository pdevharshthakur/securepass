import { prisma } from '@packages/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env } from '../env.js';

export const auth = betterAuth({
	advanced: {
		database: {
			joins: true
		}
	},
	database: prismaAdapter(prisma, { provider: 'postgresql' }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [env.BETTER_AUTH_URL],
	emailAndPassword: {
		enabled: true
	},
	socialProviders: {
		...(env.GOOGLE_CLIENT_ID &&
			env.GOOGLE_CLIENT_SECRET && {
				google: {
					clientId: env.GOOGLE_CLIENT_ID,
					clientSecret: env.GOOGLE_CLIENT_SECRET
				}
			}),
		...(env.GITHUB_CLIENT_ID &&
			env.GITHUB_CLIENT_SECRET && {
				github: {
					clientId: env.GITHUB_CLIENT_ID,
					clientSecret: env.GITHUB_CLIENT_SECRET
				}
			})
	}
});
