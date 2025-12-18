<script>
	import Login from '$lib/components/Login.svelte';
	import { onMount } from 'svelte';
	import '../app.css';
	import { base } from '$app/paths';
	import { Button, Navbar, NavBrand, NavHamburger } from 'flowbite-svelte';
	import { storage } from '$lib/storage';
	import { handleOidcFlow, getSessionFromCC } from '$lib/profile';
	import { goto } from '$app/navigation';

	onMount(async () => {
		const url = new URL(window.location.href);
		const cc = url.searchParams.get('cc');
		if (cc) {
			storage.set('cc', cc);
			const url = new URL(window.location.href);
			console.log('Setting cc', cc);
			url.searchParams.delete('cc');
			goto(url, {
				replaceState: true,
				noScroll: true,
				keepFocus: true
			});
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
	<NavBrand href="{base}/">
		<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
			>Mumo - Graphs</span
		>
	</NavBrand>
	<div class="flex md:order-2">
		<Login />
		<Button href="{base}/settings" color="alternative">Settings</Button>
		<NavHamburger />
	</div>
</Navbar>

<slot></slot>

<style></style>
