import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: {
					async: true
				}
			},
			adapter: adapter(),
			experimental: {
				explicitEnvironmentVariables: true,
				remoteFunctions: true,
				handleRenderingErrors: true
			}
		})
	],
	server: {
		proxy: {
			// Forward Better Auth + API calls to the Express server in dev so the
			// browser always talks to a single origin (:5173). This keeps the
			// session cookie on the web origin (same-site), avoiding CORS.
			'/api': 'http://localhost:8000'
		}
	}
});
