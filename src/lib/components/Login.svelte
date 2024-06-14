<script lang="ts">
	import { getDefaultSession, handleIncomingRedirect } from '@inrupt/solid-client-authn-browser';
	// import { name, setSession, isLoggedIn, login_f, logout_f } from './login';

	import { onMount } from 'svelte';
	import { Button, Span } from 'flowbite-svelte';

	// onMount(async () => {
	// 	console.log('Logie on mount');
	//
	// 	// debugger;
	// 	const session = await handleIncomingRedirect(); // no-op if not part of login redirect
	// 	if (session && session.isLoggedIn) {
	// 		window.localStorage.setItem('SESSION', JSON.stringify(session));
	// 	}
	// 	const this_session = getDefaultSession();
	//
	// 	// const url = new URL(window.location.href);
	// 	// localStorage.setItem("redirect", "");
	//
	// 	setSession(this_session);
	// 	console.log('Info', this_session.info);
	// });

	function login_f() {
		window.location.href = '/login';
	}
</script>

<!-- {#if $isLoggedIn} -->
<!-- 	<div class="flex items-center gap-4"> -->
<!-- 		<Span>{$name}</Span> -->
<!-- 		<Button on:click={logout_f}>Logout</Button> -->
<!-- 	</div> -->
<!-- {:else} -->
<Button on:click={login_f}>Login</Button>
<!-- {/if} -->
