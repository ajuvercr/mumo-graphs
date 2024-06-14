import { Session } from '@inrupt/solid-client-authn-node';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, request }) => {
  const url = new URL(request.url);
  url.pathname = '/redirect';

  // 1. Create a new Session
  const session = new Session({ keepAlive: false }); // Turn off periodic refresh of the Session in background
  cookies.set('session', session.info.sessionId, { path: '/' });

  console.log("Session id", session.info.sessionId);

  let resolve: (x: string) => void = () => { };
  const redirectPromise = new Promise<string>((res) => (resolve = res));

  // 2. Start the login process; redirect handler will handle sending the user to their
  //    Solid Identity Provider.
  await session.login({
    // After login, the Solid Identity Provider will send the user back to the following
    // URL, with the data necessary to complete the authentication process
    // appended as query parameters:
    redirectUrl: url.toString(),
    // Set to the user's Solid Identity Provider; e.g., "https://login.inrupt.com"
    oidcIssuer: 'https://login.inrupt.com',
    // Pick an application name that will be shown when asked
    // to approve the application's access to the requested data.
    clientName: 'Mumo - Graphs',
    handleRedirect: resolve
  });

  const redirectLocation = await redirectPromise;
  console.log("Redirecting to ", redirectLocation);
  return redirect(302, redirectLocation);
};

