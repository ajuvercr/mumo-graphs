<script>
	import Login from '$lib/components/Login.svelte';
	import { onMount } from 'svelte';
	import '../app.css';
	import { Button, Navbar, NavBrand, NavHamburger } from 'flowbite-svelte';
	import { storage } from '$lib/storage';
	import { handleOidcFlow, getSessionFromCC } from '$lib/profile';

	onMount(() => {
		const url = new URL(window.location.href);
		const cc = url.searchParams.get('cc');
		if (cc) {
			storage.set('cc', cc);
			const url = new URL(window.location.href);
			console.log('Setting cc');
			url.searchParams.delete('cc');
			window.history.replaceState({}, '', url);
		}

		handleOidcFlow()
			.then((worked) => {
				if (!worked) {
					getSessionFromCC();
				}
			})
			.catch(getSessionFromCC);
	});
</script>

<Navbar class="top-0 z-20 border-b  px-2 py-2.5  sm:px-4">
	<NavBrand href="/">
		<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
			>Mumo - Graphs</span
		>
	</NavBrand>
	<div class="flex md:order-2">
		<Login />
		<Button href="/app/settings" color="alternative">Settings</Button>
		<NavHamburger />
	</div>
</Navbar>

<slot></slot>

<style></style>
