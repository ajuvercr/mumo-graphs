import jsonld from 'jsonld';
import { Parser, type Term } from 'n3';
import { writable } from 'svelte/store';
    import { base } from '$app/paths';

export type Object = {
  id: Term;
  name: string;
};

export type Measurement = {
  result: {
    numericValue: number;
    valueType: string;
  };
  date: Date;
  sensor: Object;
  node: Object;
};

export const toasts = writable(<{ text: string; open: boolean }[]>[]);
export function addToast(text: string) {
  toasts.update((x) => {
    const newToas = { text, open: true };

    const idx = x.length;
    setTimeout(() => {
      toasts.update((x) => {
        x[idx].open = false;
        return x;
      });
    }, 2000);
    x.push(newToas);
    return x;
  });
}

export async function jsonld_to_quads(ld: string) {
  const nquads = await jsonld.toRDF(JSON.parse(ld), {
    format: 'application/n-quads'
  });
  const quads = new Parser().parse(nquads);
  return quads;
}

export async function cached(fetch_f: typeof fetch): Promise<Awaited<typeof fetch>> {
  const cache: {
    [id: string]: {
      status: number;
      text: string;
      headers: Headers;
    };
  } = {};
  return async (a, b) => {
    const c = cache[a.toString()];
    if (c) {
      return new Response(c.text, {
        headers: c.headers,
        status: c.status
      });
    }
    if (a.toString()) {
      return fetch(a, b);
    }
    const resp = await fetch_f(a, b);
    const text = resp.ok ? await resp.text() : '';
    const nc = {
      text,
      headers: resp.headers,
      status: resp.status
    };
    cache[a.toString()] = nc;
    return new Response(nc.text, {
      headers: nc.headers,
      status: nc.status
    });
  };
}

export let fetch_f: typeof fetch = proxy_fetch(enhanced_fetch(fetch));

function proxy_fetch(fetch_f: typeof fetch): typeof fetch {
  const f: typeof fetch = async (a, b) => {
    const proxy = encodeURIComponent(a.toString());
    const resp = await fetch_f(base + '/api/proxy?proxy=' + proxy, b);
    console.log(resp);
    if (resp.status == 401) {
      return new Response('', { headers: { 'content-type': 'text/turtle' } });
    }

    const text = await resp.text();
    return new Response(text, { headers: new Headers(resp.headers) });
  };

  return f;
}

function enhanced_fetch(fetch_f: typeof fetch): typeof fetch {
  const f: typeof fetch = async (a, b) => {
    const resp = await fetch_f(a, b);
    if (resp.status == 401) {
      return new Response('', { headers: { 'content-type': 'text/turtle' } });
    }
    return resp;
  };

  return f;
}
