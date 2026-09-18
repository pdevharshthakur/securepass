import { createAuthClient } from 'better-auth/svelte'; // make sure to import from better-auth/svelte

// No config because of vite proxy
export const authClient = createAuthClient();
