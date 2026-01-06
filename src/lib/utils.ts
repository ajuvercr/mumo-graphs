import { Parser, type Term } from 'n3';
import { writable } from 'svelte/store';
import { replicateLDES } from 'ldes-client';
import { BasicLens, extractShapes, type Cont } from 'rdf-lens';

import platform_shape from '$lib/configs/platform_shape.ttl?raw';
import { myFetch } from './profile';
import type { Constraint } from './constraints';

export type Config = {
	name: string;
	url: string;
	constraint: Constraint;
};
export type Object = {
	id: Term;
	name: string;
};

export type Measurement = {
	result: {
		numericValue: number;
		valueType: string;
		valueName: string;
	};
	date: Date;
	sensor: Term;
	node: Term;
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
			console.log('Cached response!');
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
		console.log('Fetching', a);
		const proxy = encodeURIComponent(a.toString());
		const resp = await fetch_f(a, b);
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
		console.log('Fetching', a);
		const resp = await fetch_f(a, b);
		if (resp.status === 401 || resp.status === 403) {
			return new Response('', { headers: { 'content-type': 'text/turtle', cache: 'no-cache' } });
		}
		return resp;
	};

	return f;
}

export function tooltip(node: HTMLElement, params: { text?: string; kind?: 'normal' | 'error' }) {
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

export function capitalize(st: string) {
	const capital = st[0]?.toUpperCase() || '';
	if (capital != st[0]) {
		return capital + st.slice(1);
	} else {
		return st;
	}
}

export type Platform = {
	id: Term;
	modified: Term;
	label: string;
	prefLabel?: string;
	euid: string;
	location?: string;
	locationName?: string;
	sensors: {
		id: Term;
		label: string;
		isParfOf: Term;
		observes: { id: Term; label: string };
	}[];
};

export function consumePlatforms(
	onPlatform: (pl: Platform) => void,
	url = 'http://localhost:8000/by-name/index.trig'
): ReadableStreamDefaultReader {
	console.log({ url });
	const shapes = extractShapes(new Parser().parse(platform_shape));
	const platform = <BasicLens<Cont, Platform>>shapes.lenses['Platform'];

	const client = replicateLDES(
		{
			url,
			fetch: enhanced_fetch(myFetch),
			materialize: true,
			urlIsView: true
		},
		'ascending'
	);

	const stream = client.stream().getReader();
	(async () => {
		let mem = await stream.read();
		while (mem && !mem.done) {
			console.log('Got member');

			const pl = platform.execute(mem.value);
			onPlatform(pl);

			mem = await stream.read();
		}

		console.log('Finished');
	})();

	return stream;
}

export type ChartLayout = {
	id: string; // unique
	type: string; // sensor type
	expanded: string; // full width or normal
	order: number; // used for sorting & reordering
};

export function decodeJwt(token: string) {
	const parts = token.split('.');
	if (parts.length !== 3) throw new Error('Invalid JWT');

	const payload = parts[1];
	// Decode Base64URL
	const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
	return JSON.parse(json);
}

export function base64Encode(str: string) {
	// Browser, Deno, Workers: use btoa
	if (typeof btoa !== 'undefined') {
		return btoa(str);
	}

	// Node, Bun: use Buffer
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(str, 'utf8').toString('base64');
	}

	throw new Error('No base64 encoding available in this environment');
}

export function decodeBase64(base64String: string) {
	try {
		// Decode Base64 to a string
		return atob(base64String);
	} catch (error) {
		console.error('Invalid Base64 string', error);
		return null;
	}
}
