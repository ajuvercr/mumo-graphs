<script lang="ts">
	import { onMount } from 'svelte';
	import {
		login,
		getDefaultSession,
		handleIncomingRedirect
	} from '@inrupt/solid-client-authn-browser';
	import { Button, Span } from 'flowbite-svelte';
	import { derived } from 'svelte/store';
	import { profile } from '$lib/profile';
	profile.subscribe(console.log);
	const loggedIn = derived(profile, (x) => x.isLoggedIn);

	onMount(async () => {
		const url = new URL(window.location.href);
		const hasAuthParams = url.searchParams.has('code') || url.searchParams.has('error');

		if (hasAuthParams) {
			try {
				const session = await handleIncomingRedirect({
					restorePreviousSession: true
				});

				if (session) {
					profile.set(session);
				}
			} catch (err) {
				console.error('OIDC redirect failed', err);
				// Do NOT auto-login again here
			}
		} else {
			// No OIDC redirect happening — restore session silently
			try {
				const session = getDefaultSession();
				if (session?.info?.isLoggedIn) {
					profile.set(session.info);
				}
			} catch (err) {
				console.error('Session restore failed', err);
			}
		}
	});

	async function login_f() {
		// Start the Login Process if not already logged in.
		if (!getDefaultSession().info.isLoggedIn) {
			await login({
				oidcIssuer: 'https://login.inrupt.com',
				redirectUrl: new URL('/app/redirect', window.location.href).toString(),
				clientName: 'MuMo Graphs'
			});
		}
	}

	async function logout() {
		const session = getDefaultSession();
		await session.logout({ logoutType: 'app' });
		window.location.reload();
	}
</script>

{#if $loggedIn}
	<div class="flex items-center gap-6">
		<Span>{$profile.webId}</Span>
		<Button on:click={logout}>Logout</Button>
	</div>
{:else}
	<Button on:click={login_f}>Login</Button>
{/if}
