import jsonld from 'jsonld';
import { Parser, type Term } from 'n3';
import { writable } from 'svelte/store';
import { base } from '$app/paths';
import { Client, intoConfig } from 'ldes-client';
import { BasicLens, extractShapes, type Cont } from 'rdf-lens';

import platform_shape from '$lib/configs/platform_shape.ttl?raw';

export type Object = {
    id: Term;
    name: string;
};

export type Measurement = {
    result: {
        numericValue: number;
        valueType: string;
        valueName: string;
    }; date: Date;
    sensor: Term;
    node: Object;
    nodeName: string;
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

export function cached(fetch_f: typeof fetch): typeof fetch {
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
            console.log("Cached response!");
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

export let fetch_f: () => typeof fetch = () => proxy_fetch(enhanced_fetch(fetch));

export function proxy_fetch(fetch_f: typeof fetch): typeof fetch {
    const f: typeof fetch = async (a, b) => {
        console.log("Fetching", a);
        const proxy = encodeURIComponent(a.toString());
        const resp = await fetch_f(base + '/api/proxy?proxy=' + proxy + `&_=${Date.now()}`, b);
        if (resp.status == 401) {
            return new Response('', { headers: { 'content-type': 'text/turtle' } });
        }

        const text = await resp.text();
        return new Response(text, { headers: new Headers(resp.headers) });
    };

    return f;
}

export function enhanced_fetch(fetch_f: typeof fetch): typeof fetch {
    const f: typeof fetch = async (a, b) => {
        console.log("Fetching", a);
        const resp = await fetch_f(a, b);
        if (resp.status == 401) {
            return new Response('', { headers: { 'content-type': 'text/turtle', "cache": 'no-cache' }, });
        }
        return resp;
    };

    return f;
}

export function tooltip(
    node: HTMLElement,
    params: { text?: string; kind?: 'normal' | 'error' }
) {
    let tooltipEl: HTMLDivElement | null = null;
    let { text, kind = 'normal' } = params;

    function show() {
        if (!text) return;
        tooltipEl = document.createElement('div');
        tooltipEl.textContent = text;
        tooltipEl.className = `tooltip ${kind}`;
        document.body.appendChild(tooltipEl);

        const rect = node.getBoundingClientRect();
        tooltipEl.style.position = 'fixed';
        tooltipEl.style.top = `${rect.top - 35}px`;
        tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
        tooltipEl.style.transform = 'translateX(-50%)';
    }

    function hide() {
        tooltipEl?.remove();
        tooltipEl = null;
    }

    function update(newParams: { text: string | undefined; kind?: 'normal' | 'error' }) {
        text = newParams.text;
        if (!newParams?.text) {
            hide();
        }
        if (tooltipEl && newParams.text !== undefined) {
            tooltipEl.textContent = newParams.text;
            tooltipEl.className = `tooltip ${newParams.kind}`;
        }
    }

    node.addEventListener('mouseenter', show);
    node.addEventListener('mouseleave', hide);

    return {
        update,
        destroy() {
            node.removeEventListener('mouseenter', show);
            node.removeEventListener('mouseleave', hide);
            tooltipEl?.remove();
        }
    };
}

export type Platform = {
    id: Term;
    modified: Term;
    label: string;
    location?: string;
    sensors: {
        id: Term;
        label: string;
        isParfOf: Term;
        observes: { id: Term; label: string };
    }[];
};

export async function consumePlatforms(onPlatform: (pl: Platform) => void, f: typeof fetch, url = 'http://localhost:8000/by-name/index.trig') {

    const shapes = extractShapes(new Parser().parse(platform_shape));
    const platform = <BasicLens<Cont, Platform>>shapes.lenses['Platform'];

    const client = new Client(
        intoConfig({
            url,
            fetch: proxy_fetch(f),
            materialize: true,
            urlIsView: true
        }),
        'none'
    );

    const stream = client.stream().getReader();
    let mem = await stream.read();
    while (mem && !mem.done) {
        console.log('Got member');

        const pl = platform.execute(mem.value);
        onPlatform(pl);

        mem = await stream.read();
    }

    console.log('Finished');
}


