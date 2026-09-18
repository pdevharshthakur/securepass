import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	if (locals.authUnavailable) {
		error(500, 'Authentication service unavailable');
	}

	if (!locals.userId) {
		redirect(303, `/auth/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	}
};
