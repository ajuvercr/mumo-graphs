import { base } from '$app/paths';
import { getSession } from '$lib/auth';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, request }) => {
	const session = await getSession(cookies);

	console.log('handling redirect', session, request.url);
	if (session) {
		await session.handleIncomingRedirect(request.url);
		console.log('After redirect session', session.info);
	} else {
		console.log('session is undefined');
	}

	return redirect(302, base);
};
