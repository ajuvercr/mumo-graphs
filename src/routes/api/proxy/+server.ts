import { getSession } from '$lib/auth';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, request }) => {
  const url = new URL(request.url);
  const proxy = url.searchParams.get('proxy');

  const session = await getSession(cookies);
  const fetch_f = session ? session.fetch.bind(session) : fetch;

  if (!proxy) {
    return error(400, {
      message: 'Proxy query parameter not found!'
    });
  }

  const newUrl = decodeURIComponent(proxy);

  console.log(session?.info.sessionId, newUrl);

  try {
    const response = await fetch_f(newUrl, {
      method: 'GET',
      headers: new Headers(request.headers)
    });

    const responseHeaders = new Headers(response.headers);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    console.error(error);
  }

  return error(500, {
    message: 'Something failed'
  });
};
