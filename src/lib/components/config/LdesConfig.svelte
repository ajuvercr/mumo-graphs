<script context="module" lang="ts">
	export type Config = {
		name: string;
		url: string;

		location: { value: string; name: string }[];
		node?: string[];
		type?: string[];
	};
</script>

<script lang="ts">
	import MyMultiSelect from './MyMultiSelect.svelte';
	import { Input, Label, Button, MultiSelect } from 'flowbite-svelte';
	import type { MultiSelectEvents } from 'flowbite-svelte/MultiSelect.svelte';
	import { createEventDispatcher } from 'svelte';

	export let locations: { name: string; value: string }[];

	export let config: Config;

	const dispatch = createEventDispatcher<{ change: Config }>();

	console.log('locations', locations);
	function validate() {
		console.log('Validating', config);
		dispatch('change', config);
	}

	// let thisSelected = config.location;
	console.log('thisselected', JSON.stringify(config.location.slice(0, 2)));
	// thisSelected = locations.slice(0, 2);
	console.log('thisselected', JSON.stringify(locations.slice(0, 2)));

	let selectItems = locations.map((x) => ({ name: x.name, value: x }));
	$: selectItems = locations.map((x) => ({ name: x.name, value: x }));
	$: console.log('current', config.location);
</script>

<div class="mt-6 grid gap-6 md:grid-cols-2">
	<div>
		<Label for="name" class="mb-2">Graph Name</Label>
		<Input type="text" id="name" placeholder="EpicName" bind:value={config.name} />
	</div>
	<div>
		<Label for="url" class="mb-2">LDES Url</Label>
		<Input type="text" id="url" placeholder="Url" bind:value={config.url} />
	</div>

	<div class="my-4">
		<Label for="locations" class="mb-2">Location</Label>
		<MyMultiSelect id="locations" items={locations} bind:value={config.location} />
	</div>
</div>

<Button on:click={validate} class="w-fit">Save!</Button>
