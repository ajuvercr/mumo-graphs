import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import fs from 'fs/promises';

export const GET: RequestHandler = async ({ cookies, request }) => {
  // console.log(cookies);
  // console.log(cookies.getAll());
  // for (let key of request.headers.keys()) {
  //   console.log(key, request.headers.get(key));
  // }
  try {
    const text = await fs.readFile('./state.json', {
      encoding: 'utf8'
    });
    console.log('Fetched text', text);

    return json(JSON.parse(text), { status: 200 });
  } catch {
    return json([], { status: 200 });
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  const state = await request.json();
  console.log('Storing text', JSON.stringify(state));

  await fs.writeFile('./state.json', JSON.stringify(state), {
    encoding: 'utf8'
  });

  return json(state, { status: 201 });
};
