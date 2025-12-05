<script lang="ts">
	import { login, getDefaultSession } from '@inrupt/solid-client-authn-browser';
	import { Button, Span } from 'flowbite-svelte';
	import { derived } from 'svelte/store';
	import { profile } from '$lib/profile';
	import { storage } from '$lib/storage';

	const webId = derived(profile, (p) => p.webId);

	profile.subscribe((p) => console.log('Curent profile', p));

	async function login_f() {
		// Start the Login Process if not already logged in.
		if (!getDefaultSession().info.isLoggedIn) {
			await login({
				// oidcIssuer: 'https://login.inrupt.com',
				oidcIssuer: 'http://localhost:8004/oidc/',
				redirectUrl: new URL('/app/redirect', window.location.href).toString(),
				clientName: 'MuMo Graphs'
			});
		}
	}

	async function logout() {
		const session = getDefaultSession();
		await session.logout({ logoutType: 'app' });
		storage.remove('cc');
		window.location.reload();
	}
</script>

{#if $webId !== undefined}
	<div class="flex items-center gap-6">
		<Span>{$webId}</Span>
		<Button on:click={logout}>Logout</Button>
	</div>
{:else}
	<Button on:click={login_f}>Login</Button>
{/if}
