<script lang="ts">
	import type { PageData } from './$types';
	import LdesGraph from '$lib/components/LdesGraph.svelte';

	import { Location, Sensor, Node } from '$lib/paths.ts';
	import { onMount } from 'svelte';

	export let data: PageData;
	onMount(() => {
		console.log(Location);
		console.log(Sensor);
		console.log(Node);
	});
</script>

<main>
	<LdesGraph nodes={[]} />
</main>

<style>
	main {
		max-width: 80%;
    margin: auto;
	}
</style>

