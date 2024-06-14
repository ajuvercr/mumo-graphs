<script lang="ts">
	import type { PageData } from './$types';
	import LdesGraph from '$lib/components/LdesGraph.svelte';

	import { Location, Sensor } from '$lib/paths.ts';
	import { onMount } from 'svelte';
	import type { Node } from '@ajuvercr/mumo-pipeline';
	import type { Config } from '$lib/components/config/LdesConfig.svelte';
	import { Button } from 'flowbite-svelte';

	export let data: PageData;
	onMount(() => {
		console.log(Location);
		console.log(Sensor);
		console.log(Node);
	});

	let configs: Config[] = [];

	onMount(async () => {
		console.log('Page on mount');
		const response = await fetch('/api/state', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		configs = await response.json();
	});

	async function changed() {
		const response = await fetch('/api/state', {
			method: 'POST',
			body: JSON.stringify(configs),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		console.log('Succes', response.ok);
	}

	function addConfig() {
		const newConfig = {
			name: 'Graph ' + (configs.length + 1),
			// url: 'https://mumo.ilabt.imec.be/ldes/sds/root',
			url: 'http://localhost:3000/ldes/default/root',
			location: []
		};
		configs = [...configs, newConfig];
		changed();
	}

	function removeConfig(idx: number) {
		configs.splice(idx, 1);
		configs = [...configs];
		changed();
	}

	let nodes: Node[] = [];
</script>

<main>
	{#each configs as config, i}
		<LdesGraph {nodes} {config} on:delete={() => removeConfig(i)} on:change={changed} />
	{/each}

	<Button on:click={addConfig}>Add graph!</Button>
</main>

<style>
	main {
		max-width: 80%;
		margin: auto;
	}
</style>
