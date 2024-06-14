import { getSessionFromStorage } from '@inrupt/solid-client-authn-node';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, request }) => {
  console.log('Redirect url', request.url);
  const sessionId = cookies.get('session')!;
  console.log('session id', sessionId);
  const session = await getSessionFromStorage(sessionId);

  // 4. With your session back from storage, you are now able to
  //    complete the login process using the data appended to it as query
  //    parameters in req.url by the Solid Identity Provider:
  if (session) {
    await session.handleIncomingRedirect(request.url);
    console.log(session.info);
  } else {
    console.log('session is undefined');
  }

  const newUrl = new URL(request.url);
  newUrl.pathname = '/';

  console.log('new url', newUrl.toString());
  return redirect(302, newUrl.toString());
};
