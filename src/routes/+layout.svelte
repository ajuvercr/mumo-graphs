<script>
	import Login from '$lib/components/Login.svelte';
	import '../app.css';
	import { Navbar, NavBrand, NavHamburger } from 'flowbite-svelte';
</script>

<Navbar class="top-0 z-20 border-b  px-2 py-2.5  sm:px-4">
	<NavBrand href="/">
		<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
			>Mumo - Graphs</span
		>
	</NavBrand>
	<div class="flex md:order-2">
		<Login />
		<NavHamburger />
	</div>
</Navbar>

<slot></slot>

<style></style>
