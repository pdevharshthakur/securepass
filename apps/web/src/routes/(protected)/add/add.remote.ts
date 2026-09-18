import { addBodySchema } from '@packages/shared';
import { error } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import { PRIVATE_API_URL } from '$app/env/private';

const apiUrl = PRIVATE_API_URL.replace(/\/+$/, '');

export const addEntry = form(addBodySchema, async (data) => {
	let response: Response;

	try {
		const event = getRequestEvent();

		response = await fetch(`${apiUrl}/add`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				cookie: event.request.headers.get('cookie') ?? ''
			},
			body: JSON.stringify(data)
		});
	} catch {
		error(502, 'Unable to connect to the API');
	}

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { error?: string } | null;
		const status = response.status >= 400 && response.status <= 599 ? response.status : 502;

		error(status, payload?.error ?? 'Unable to save password');
	}

	return { success: true };
});
