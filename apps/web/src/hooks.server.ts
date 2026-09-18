import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		const session = await getSession(event);
		event.locals.userId = session?.user?.id;
	} catch {
		event.locals.authUnavailable = true;
	}

	return resolve(event, {
		preload: ({ type }) => type === 'font'
	});
};
