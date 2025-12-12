import { writable } from 'svelte/store';
import { getDefaultSession, handleIncomingRedirect } from '@inrupt/solid-client-authn-browser';
import { storage } from './storage';
import { base64Encode, decodeBase64, decodeJwt } from './utils';

import * as DPoP from 'dpop';

export type Profile = {
	webId?: string;
};
export const profile = writable<Profile>({});
export const myFetch: typeof fetch = (a, b) => localFetch(a, b);

async function findDefaultSession(): Promise<boolean> {
	const session = getDefaultSession();
	const webId = session.info.webId;

	profile.set({ webId });
	localFetch = (a, b) => session.fetch(a, b);

	return session.info.isLoggedIn;
}

export async function logoutFetch() {
	localFetch = window.fetch;
}

export async function handleOidcFlow(): Promise<boolean> {
	const url = new URL(window.location.href);
	const hasAuthParams = url.searchParams.has('code') || url.searchParams.has('error');

	try {
		if (hasAuthParams) {
			await handleIncomingRedirect({
				restorePreviousSession: true
			});
		}
	} catch (e) {}

	return await findDefaultSession();
}

function scheduleRefresh(expiresIn: number) {
	const refreshAt = expiresIn * 1000 - 30_000; // 30 seconds before expiry

	setTimeout(() => {
		console.log('refreshing those tokens');
		getSessionFromCC();
	}, refreshAt);
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
		console.log(text);
		const json = JSON.parse(text);

		if (!json.access_token) return false;

		scheduleRefresh(json.expires_in);
		console.log(json);

		const info = decodeJwt(json.access_token);
		profile.set({ webId: info.webid });

		console.log(decodeJwt(json.access_token));

		const access_token = json.access_token.slice();

		localFetch = (url, options) => {
			const token = access_token;

			return fetch(url, {
				...options,
				headers: {
					...(options?.headers || {}),
					Authorization: `Bearer ${token}`
				}
			});
		};
	}
	return false;
}

let localFetch = window.fetch;
