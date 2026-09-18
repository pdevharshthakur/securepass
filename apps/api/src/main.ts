import { env } from './env.js';
import { router } from './routes.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '$lib/auth.js';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const app = express();

const corsOrigins = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((s) => s.trim());

app.use(helmet());
app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(router);

const server = app.listen(env.PORT, () => {
	console.log(`API server listening on port ${env.PORT}`);
});

/** Gracefully stop the server, drain inflight requests, then exit. */
const gracefulShutdown = (signal: 'SIGTERM' | 'SIGINT') => {
	console.log(`Received ${signal}, shutting down gracefully...`);
	server.close(() => {
		console.log('Server closed, exiting.');
		process.exit(0);
	});

	setTimeout(() => {
		console.error('Forced shutdown after timeout');
		process.exit(1);
	}, 15_000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
