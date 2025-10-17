<script context="module" lang="ts">
	export type Config = {
		name: string;
		url: string;

		location: { value: string; name: string }[];
		nodes: { value: string; name: string }[];
		types: { value: string; name: string }[];
	};
</script>

<script lang="ts">
	import MyMultiSelect from './MyMultiSelect.svelte';
	import { Input, Label, Button } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';

	export let locations: { name: string; value: string }[];
	export let nodes: { name: string; value: string }[];
	export let types: { name: string; value: string }[];

	export let config: Config;

	const dispatch = createEventDispatcher<{ change: Config }>();

	console.log('locations', locations);
	function validate() {
		console.log('Validating', config);
		dispatch('change', config);
	}
</script>

<div class="mt-6 grid gap-6 md:grid-cols-2">
	<!-- <div class="my-1"> -->
	<div>
		<Label for="url" class="mb-2">LDES Url</Label>
		<Input type="text" id="url" placeholder="Url" bind:value={config.url} />
	</div>

	<!-- <div class="my-1"> -->
	<div>
		<Label for="locations" class="mb-2">Location</Label>
		<MyMultiSelect id="locations" items={locations} bind:value={config.location} />
	</div>
	<!-- <div class="my-1"> -->
	<div>
		<Label for="nodes" class="mb-2">Nodes</Label>
		<MyMultiSelect id="nodes" items={nodes} bind:value={config.nodes} />
	</div>
	<!-- <div class="my-1"> -->
	<div>
		<Label for="nodes" class="mb-2">Types</Label>
		<MyMultiSelect id="nodes" items={types} bind:value={config.types} />
	</div>
</div>

<Button on:click={validate} class="mtop-4 w-fit">Save!</Button>
