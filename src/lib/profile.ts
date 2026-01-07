import { get, writable } from 'svelte/store';
import { getDefaultSession, handleIncomingRedirect } from '@inrupt/solid-client-authn-browser';
import { storage } from './storage';
import { base64Encode, decodeBase64, decodeJwt } from './utils';
import type { Config } from '$lib/utils';

import * as DPoP from 'dpop';
import { setState } from './settings';

export type State = {
	items?: { config: Config; idx: number }[];
};

export type Profile = {
	webId?: string;
	state: State;
};

function addLdesEndpointsToSettings(endpoint: string) {
	if (endpoint.endsWith('.oidc/token')) {
		const host = new URL(endpoint).hostname;
		const st = {
			sensorLdes: endpoint.replace('.oidc/token', 'sensors/by-location/index.trig'),
			dataLdes: endpoint.replace('.oidc/token', 'data/by-location/root/index.trig'),
			name: host
		};
		setState(st);
	}
}

export const profile = writable<Profile>({
	state: {}
});
export const myFetch: typeof fetch = (a, b) => localFetch(a, b);

async function findDefaultSession(): Promise<boolean> {
	const session = getDefaultSession();
	const webId = session.info.webId;

	profile.set({
		webId,
		state: { items: itemsForWebId(webId) }
	});
	localFetch = (a, b) => session.fetch(a, b);

	return session.info.isLoggedIn;
}

export function save(items: { config: Config; idx: number }[]) {
	let p = get(profile);
	if (p.webId) {
		window.localStorage.setItem(p.webId, JSON.stringify(items));
	}
}

export async function logoutFetch() {
	localFetch = fetch;
}

export async function handleOidcFlow(): Promise<boolean> {
	const isLoggingIn = window.localStorage.getItem('oidcFlow');
	window.localStorage.setItem('oidcFlow', 'true');

	const url = new URL(window.location.href);
	const codeFlow = url.searchParams.get('code');
	if (!isLoggingIn || codeFlow) {
		console.log('Trying to recover session');
		await handleIncomingRedirect({ restorePreviousSession: true });
	} else {
		console.log('Already recovered session');
	}
	window.localStorage.removeItem('oidcFlow');

	return await findDefaultSession();
}

function scheduleRefresh(expiresIn: number) {
	const refreshAt = expiresIn * 1000 - 30_000; // 30 seconds before expiry

	setTimeout(() => {
		console.log('refreshing those tokens');
		getSessionFromCC();
	}, refreshAt);
}

function itemsForWebId(webId?: string): { config: Config; idx: number }[] | undefined {
	console.log('Getting items for', webId);
	try {
		if (webId) {
			const stored = localStorage.getItem(webId);
			console.log('Getting items for', webId, stored);
			if (stored) {
				return JSON.parse(stored);
			}
		}
	} catch (ex) {}
}

export async function getSessionFromCC(): Promise<boolean> {
	const ccV = <string>storage.get('cc');
	console.log({ ccV });

	if (ccV) {
		const decoded: { id: string; secret: string; endpoint: string } = JSON.parse(
			decodeBase64(ccV)!
		);
		const ccValue = base64Encode(`${decoded.id}:${decoded.secret}`);
		console.log(decoded, `${decoded.id}:${decoded.secret}`);
		const keypair = await DPoP.generateKeyPair('ES256');
		const proof = await DPoP.generateProof(keypair, decoded.endpoint, 'POST', undefined, undefined);

		const response = await fetch(decoded.endpoint, {
			method: 'POST',
			headers: {
				// The header needs to be in base64 encoding.
				authorization: `Basic ${ccValue}`,
				'content-type': 'application/x-www-form-urlencoded',
				dpop: proof
			},
			body: 'grant_type=client_credentials&scope=webid'
		});

		const text = await response.text();
		const json = JSON.parse(text);

		if (!json.access_token) return false;

		scheduleRefresh(json.expires_in);

		addLdesEndpointsToSettings(decoded.endpoint);
		const info = decodeJwt(json.access_token);
		profile.set({
			webId: info.webid,
			state: {
				items: itemsForWebId(info.webid)
			}
		});

		console.log(decodeJwt(json.access_token));

		const access_token = json.access_token.slice();

		const makeHeaders = async (url: string) => {
			const proof = await DPoP.generateProof(keypair, url, 'GET', undefined, undefined);
			return proof;
		};

		localFetch = async (url, options) => {
			const token = access_token;
			const dpop = await makeHeaders(url.toString());

			return await fetch(url, {
				...options,
				headers: {
					...(options?.headers || {}),
					Authorization: `DPoP ${token}`,
					DPoP: dpop
				}
			});
		};
	}
	return false;
}

let localFetch = fetch;
