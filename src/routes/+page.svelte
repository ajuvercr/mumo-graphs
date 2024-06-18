<script lang="ts">
	import type { PageData } from './$types';
	import LdesGraph from '$lib/components/LdesGraph.svelte';

	import { toasts } from '$lib/utils';
	import { Location, Sensor } from '$lib/paths.ts';
	import { onMount } from 'svelte';
	import type { Config } from '$lib/components/config/LdesConfig.svelte';
	import { Button, Toast } from 'flowbite-svelte';
	import { CheckCircleSolid, CirclePlusOutline } from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';
    import { base } from '$app/paths';

	export let data: PageData;
	onMount(() => {
		console.log(Location);
		console.log(Sensor);
		console.log(Node);
	});

	let configs: Config[] = [];

	let openIdx = -1;

	onMount(async () => {
		console.log('Page on mount');
		const response = await fetch(base + '/api/state', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		configs = await response.json();
	});

	async function changed() {
		const response = await fetch(base+'/api/state', {
			method: 'POST',
			body: JSON.stringify(configs),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		console.log('Succes', response.ok);
	}

	function addConfig() {
		openIdx = configs.length;
		const newConfig = {
			name: 'Graph ' + (configs.length + 1),
			// url: 'https://mumo.ilabt.imec.be/ldes/sds/root',
			url: 'http://localhost:3000/ldes/default/root',
			location: [],
			types: [],
			nodes: []
		};
		configs = [...configs, newConfig];
		changed();
	}

	function removeConfig(idx: number) {
		configs.splice(idx, 1);
		configs = [...configs];
		changed();
	}

  $:console.log("toats", toasts);

	// let nodes: Node[] = [];
</script>

<main class="relative">
	<div class="flex flex-wrap justify-center">
		{#each configs as config, i}
			<LdesGraph
				autoPlay={openIdx != i}
				open={openIdx == i}
				{config}
				on:delete={() => removeConfig(i)}
				on:change={changed}
			/>
		{/each}
	</div>

	<div class="flex justify-center">
		<CirclePlusOutline withEvents on:click={addConfig} class="prim h-12 w-12 cursor-pointer" />
	</div>

	<div class="toasts flex absolute bottom-0 right-0 flex-col-reverse">
		{#each $toasts as toast}
			<Toast dismissable={false} transition={slide} bind:open={toast.open}>
				<CheckCircleSolid slot="icon" class="h-5 w-5" />
				{toast.text}
			</Toast>
		{/each}
	</div>
</main>

<style>
	:global(.prim) {
		color: theme('colors.primary.600');
	}
	main {
		max-width: 80%;
		margin: auto;
    display: relative;
	}
</style>
