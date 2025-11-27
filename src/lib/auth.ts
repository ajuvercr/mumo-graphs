import { getSessionFromStorage, Session } from '@inrupt/solid-client-authn-node';
import type { Cookies } from '@sveltejs/kit';

const sessions: { [session: string]: Session } = {};

const KEY = 'sessionID';
export function getSessionId(cookies: Cookies): string | undefined {
	const sessionId = cookies.get(KEY);
	return sessionId;
}
export function setSessionId(cookies: Cookies, sessionId: string) {
	cookies.set(KEY, sessionId, { path: '/' });
}
export function removeSessionId(cookies: Cookies) {
	cookies.delete(KEY, { path: '/' });
}

export async function getSession(cookies: Cookies): Promise<Session | undefined> {
	const sessionId = cookies.get(KEY);
	if (!sessionId) return;
	const maybe = sessions[sessionId];
	if (maybe) return maybe;

	const session = await getSessionFromStorage(sessionId);
	if (session) {
		console.log(session);
		sessions[sessionId] = session;
	}
	return session;
}
