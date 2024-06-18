<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Span } from 'flowbite-svelte';
	import { derived, writable } from 'svelte/store';
    import { base } from '$app/paths';
	const profile = writable<{ isLoggedIn: boolean; webId?: string }>({ isLoggedIn: false });
	profile.subscribe(console.log);
	const loggedIn = derived(profile, (x) => x.isLoggedIn);

	onMount(async () => {
		const respo = await fetch(base + '/api/profile');
		profile.set(await respo.json());
	});

	function login_f() {
		window.location.href = base + '/login';
	}

	function logout() {
		window.location.href = base+ '/logout';
	}
</script>

{#if $loggedIn}
	<div class="gap-6 items-center flex">
		<Span>{$profile.webId}</Span>
		<Button on:click={logout}>Logout</Button>
	</div>
{:else}
	<Button on:click={login_f}>Login</Button>
{/if}

