import { getSession, getSessionId, removeSessionId, setSessionId } from '$lib/auth';
import { Session } from '@inrupt/solid-client-authn-node';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, request }) => {
  const url = new URL(request.url);
  url.pathname = '/redirect';

  const currentSessionId = getSessionId(cookies);
  const currentSession = await getSession(cookies);
  if (currentSession) {
    return error(400, 'already logged in!');
  }

  if (!currentSession && currentSessionId) {
    removeSessionId(cookies);
  }

  const session = new Session();
  setSessionId(cookies, session.info.sessionId);

  let resolve: (x: string) => void = () => { };
  const redirectPromise = new Promise<string>((res) => (resolve = res));

  console.log('Redirect url', url.toString());
  await session.login({
    redirectUrl: url.toString(),
    oidcIssuer: 'https://login.inrupt.com',
    clientName: 'Mumo - Graphs',
    handleRedirect: resolve
  });

  const redirectLocation = await redirectPromise;
  return redirect(302, redirectLocation);
};
