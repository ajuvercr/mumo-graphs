<script lang="ts">
	import { goto } from '$app/navigation';
	import { handleIncomingRedirect } from '@inrupt/solid-client-authn-browser';
	import { onMount } from 'svelte';

	onMount(async () => {
		const session = await handleIncomingRedirect({
			restorePreviousSession: true
		});
		console.log(session);
		setTimeout(() => {
			goto('/app/testing');
		}, 1000);
	});
</script>

<h3>Redirecting</h3>
