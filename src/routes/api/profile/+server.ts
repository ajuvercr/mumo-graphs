import { getSessionFromStorage } from '@inrupt/solid-client-authn-node';
import { json } from '@sveltejs/kit';
import { getSession } from '$lib/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
  console.log("profile");
  const session = await getSession(cookies);
  return json(session?.info || { isLoggedIn: false }, { status: 200 });
};
