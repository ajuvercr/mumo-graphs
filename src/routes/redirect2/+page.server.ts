import { getSessionFromStorage } from '@inrupt/solid-client-authn-node';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ cookies, request }) => {
  // 3. If the user is sent back to the `redirectUrl` provided in step 2,
  //    it means that the login has been initiated and can be completed. In
  //    particular, initiating the login stores the session in storage,
  //    which means it can be retrieved as follows.

  console.log("Redirect url", request.url);
  const sessionId = cookies.get('session');
  console.log('session id', sessionId);
  const session = await getSessionFromStorage(sessionId);

  // 4. With your session back from storage, you are now able to
  //    complete the login process using the data appended to it as query
  //    parameters in req.url by the Solid Identity Provider:
  if (session) {
    await session.handleIncomingRedirect(request.url);
    console.log(session.info);
  } else {
    console.log("session is undefined");
  }

  const newUrl = 
  console.log(cookies);
};
// export function load({ cookies }) {
//   const visited = cookies.get('visited');
//
//   cookies.set('visited', 'true', { path: '/' });
//
//   return {
//     visited
//   };
// }
