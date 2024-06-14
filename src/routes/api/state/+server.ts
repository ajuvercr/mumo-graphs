import { getSessionFromStorage, getSessionIdFromStorageAll } from '@inrupt/solid-client-authn-node';
import { getSession } from '$lib/auth';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import fs from 'fs/promises';

async function getState(): Promise<{ [label: string]: any[] }> {
  try {
    const state = JSON.parse(
      await fs.readFile('./state.json', {
        encoding: 'utf8'
      })
    );

    return state;
  } catch {
    return {};
  }
}

export const GET: RequestHandler = async ({ cookies, request }) => {
  console.log("profile get");
  const session = await getSession(cookies);

  const key = session?.info.webId || 'default';
  console.log(session?.info);

  const state = await getState();
  let out = state[key] || [];
  console.log('out', out);

  return json(out, { status: 200 });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  console.log("profile post");
  const session = await getSession(cookies);

  const newState = await request.json();
  const state = await getState();

  const key = session?.info.webId;
  if (key) {
    state[key] = newState;
    await fs.writeFile('./state.json', JSON.stringify(state), {
      encoding: 'utf8'
    });
  }

  return json(state, { status: 201 });
};
