import { getSession, removeSessionId } from '$lib/auth';
import { getSessionFromStorage } from '@inrupt/solid-client-authn-node';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, request }) => {
  console.log('Redirect url', request.url);
  const session = await getSession(cookies);

  await session?.logout({ logoutType: 'app' });
  // await session?.logout({ logoutType: 'idp' });

  removeSessionId(cookies);
  return redirect(302, '/');
};
