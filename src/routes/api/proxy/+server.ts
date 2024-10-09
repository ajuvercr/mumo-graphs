import { getSession } from '$lib/auth';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Keyv from 'keyv';
type Resp = {
	body: string;
	status: number;
	statusText: string;
	headers: [string, string][];
};

const TTL_MINS = 5;
const TTL_MS = TTL_MINS * 60 * 1000;
const caches: { [session: string]: Keyv } = {};
function getCache(session: string): Keyv {
	const out = caches[session];
	if (out) return out;

	caches[session] = new Keyv({ namespace: session, ttl: TTL_MS });

	return caches[session];
}

function respToResponse(resp: Resp): Response {
	const headers = new Headers();
	resp.headers.forEach(([x, y]) => headers.append(x, y));
	return new Response(resp.body, {
		status: resp.status,
		statusText: resp.statusText,
		headers
	});
}

async function responseToResp(response: Response): Promise<Resp> {
	const text = await response.text();

	const headers: [string, string][] = [];

	response.headers.forEach((x, y) => headers.push([y, x]));

	console.log(text.length);
	const resp: Resp = {
		body: text,
		status: response.status,
		statusText: response.statusText,
		headers
	};
	return resp;
}

export const GET: RequestHandler = async ({ cookies, request }) => {
	const url = new URL(request.url);
	const proxy = url.searchParams.get('proxy');

	const session = await getSession(cookies);
	const fetch_f = session?.info.isLoggedIn ? session.fetch.bind(session) : fetch;

	if (!proxy) {
		return error(400, {
			message: 'Proxy query parameter not found!'
		});
	}

	const newUrl = proxy;
	console.log(
		'is logged in',
		session?.info.isLoggedIn,
		session?.info.webId,
		newUrl.replace('https://mumo.ilabt.imec.be/', '')
	);

	try {
		const response = await fetch_f(newUrl, {
			method: 'GET',
			headers: new Headers(request.headers)
		});
		return response;
	} catch (error) {
		console.error(error);
	}

	return error(500, {
		message: 'Something failed'
	});
};
