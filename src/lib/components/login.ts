import { getDefaultSession, Session } from '@inrupt/solid-client-authn-browser';
import { login } from '@inrupt/solid-client-authn-browser';
import type { Quad } from '@rdfjs/types';
import { Parser } from 'n3';
import { derived, writable } from 'svelte/store';

// export let session = writable<Session>(getDefaultSession());
// export let name = writable<string>('undefined');
// export let isLoggedIn = derived(session, (session) => session.info.isLoggedIn, false);

export let fetch_f: typeof fetch = proxy_fetch(enhanced_fetch(fetch));

// async function fetch_turtle(location: string): Promise<Quad[]> {
//   const resp = await fetch_f(location);
//   const turtle = await resp.text();
//
//   const quads = new Parser({ baseIRI: location }).parse(turtle);
//   return quads;
// }
//
// export async function setSession(newSession: Session) {
//   session.set(newSession);
//   fetch_f = enhanced_fetch((a, b) => newSession.fetch(a, b));
//
//   if (newSession.info.webId) {
//     const id = newSession.info.webId;
//     name.set(id);
//
//     const quads = await fetch_turtle(id);
//
//     const primary = quads.find(
//       (x) =>
//         x.subject.value === id && x.predicate.value === 'http://xmlns.com/foaf/0.1/isPrimaryTopicOf'
//     )?.object.value;
//
//     if (primary) {
//       const primaryQuads = await fetch_turtle(primary);
//       let newName = primaryQuads.find(
//         (x) => x.subject.value === id && x.predicate.value === 'http://xmlns.com/foaf/0.1/name'
//       )?.object.value;
//       if (newName) {
//         name.set(newName);
//       }
//     }
//   }
// }
//
// export async function login_f() {
//   window.location.href = '/login';
//   // return login({
//   //   oidcIssuer: 'https://login.inrupt.com',
//   //   redirectUrl: new URL('/', window.location.href).toString(),
//   //   clientName: 'MUMO - Graphs'
//   // });
// }

// let thisSession: Session | undefined;
// session.subscribe((x) => (thisSession = x));
// export async function logout_f() {
//   await thisSession?.logout();
//   fetch_f = enhanced_fetch(fetch);
//   name.set('undefined');
// }

function proxy_fetch(fetch_f: typeof fetch): typeof fetch {
  const f: typeof fetch = async (a, b) => {
    const proxy = encodeURIComponent(a.toString());
    const resp = await fetch_f('/api/proxy?proxy=' + proxy, b);
    if (resp.status == 401) {
      return new Response('', { headers: { 'content-type': 'text/turtle' } });
    }
    return resp;
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
