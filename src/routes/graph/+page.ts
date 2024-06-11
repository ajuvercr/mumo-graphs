import { FIND_ALL, Platforms, Sensors } from '$lib/consts';
import { jsonld_to_quads } from '$lib/utils';
import type { PageLoad } from './$types';

export const ssr = false;

async function json_fetch(url: string, fetch_f: typeof fetch) {
  const resp = await fetch_f(url);
  return await resp.json();
}

export const load: PageLoad = async ({ fetch }) => {
  const context_resp = await fetch('https://heron.libis.be/momu-test/api-context');
  const context = await context_resp.json();
  const resp = await fetch(FIND_ALL);
  const text = await resp.text();
  const quads = await jsonld_to_quads(text);

  const sensors = await json_fetch(Sensors, fetch);
  const platforms = await json_fetch(Platforms, fetch);

  return {
    sensors,
    platforms,
    quads,
    context
  };
};
