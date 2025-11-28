<script lang="ts">
	import { consumePlatforms, type Platform } from '$lib/utils';
	import { onMount } from 'svelte';

	import { defaultProperties, defaultRelations } from '$lib/constraints';
	import { Location, NodePath, TypePath } from '$lib/paths';
	import LdesGraph from '$lib/components/LdesGraph.svelte';
	import type { Config } from '$lib/components/config/LdesConfig.svelte';
	import LdesConfig from '$lib/components/config/LdesConfig.svelte';

	const allLocations: { [id: string]: { name: string; value: string } } = {};
	const allNodes: { [id: string]: { name: string; value: string } } = {};
	const allSensors: { [id: string]: { name: string; value: string } } = {};
	const allTypes: { [id: string]: { name: string; value: string } } = {};
	let currentModal: number | undefined = undefined;

	let items: { config: Config; idx: number }[] = [];
	let onServer = true;
	onMount(async () => {
		consumePlatforms(updateFound, fetch, 'http://localhost:8004/sensors/by-name/index.trig');
		onServer = false;
		const resp = await fetch('/app/api/state');
		const xs: Config[] = await resp.json();
		items = xs.map((config, idx) => ({
			config,
			idx
		}));
		console.log({ xs });
	});

	let locations: { name: string; value: string }[] = [];
	let nodes: { name: string; value: string }[] = [];
	let types: { name: string; value: string }[] = [];

	function updateFound(plat: Platform) {
		if (plat.location && allLocations[plat.location] === undefined) {
			allLocations[plat.location] = { name: plat.location, value: plat.location };
		}
		if (allNodes[plat.id.value] === undefined) {
			allNodes[plat.id.value] = { name: plat.label, value: plat.id.value };
		}
		for (const sensor of plat.sensors) {
			// TODO: this should be isPartOf
			if (allSensors[sensor.id.value] === undefined) {
				allSensors[plat.id.value] = { name: sensor.label, value: sensor.id.value };
			}

			if (allTypes[sensor.observes.id.value] === undefined) {
				allTypes[sensor.observes.id.value] = {
					name: sensor.observes.label,
					value: sensor.observes.id.value
				};
			}
		}

		locations = Object.values(allLocations);
		types = Object.values(allTypes);
		nodes = Object.values(allNodes);
		console.log(nodes);
	}

	async function save(xs: typeof items) {
		if (onServer) return;
		await fetch('/app/api/state', {
			body: JSON.stringify(xs.map((x) => x.config)),
			credentials: 'include',
			method: 'POST'
		});
	}

	$: save(items);

	$: idx = items.map((x) => x.idx + 1).reduceRight((a, b) => (a > b ? a : b), 0);

	$: console.log(currentModal);

	const lookup = {
		types: TypePath,
		locations: Location,
		nodes: NodePath
	};
</script>

{#if currentModal !== undefined}
	<LdesConfig
		config={items[currentModal].config}
		multiOptions={{ types, locations, nodes }}
		relationParameters={{ relations: defaultRelations, properties: defaultProperties }}
		on:confirm={(c) => {
			console.log('Got confirm', !!c);
			if (currentModal !== undefined) {
				items[currentModal].config = { ...c.detail };
			}
			currentModal = undefined;
			console.log({ currentModal });
		}}
		on:cancel={() => (currentModal = undefined)}
	/>
{/if}

<div class="centered">
	{#each items as config, i (config.idx)}
		<div class="card">
			<LdesGraph
				{lookup}
				url="http://localhost:8004/data/by-sensor/index.trig"
				config={config.config}
				on:edit={() => {
					currentModal = i;
					console.log('Settin current modal');
				}}
				on:delete={() => {
					items.splice(i, 1);
					items = [...items];
				}}
			/>
		</div>
	{/each}

	<button
		on:click={() =>
			(items = [
				...items,
				{
					config: {
						url: 'http://localhost:8004/sensors/by-name/index.trig',
						name: 'Graph ' + idx,
						constraint: {
							kind: 'and',
							children: []
						}
					},
					idx
				}
			])}>New Graph</button
	>
</div>

<style>
	.centered {
		margin: auto;
		width: 80vw;
		max-width: 1200px;
	}
	.card {
		padding: 1rem;
		border: 1px solid black;
		border-radius: 2rem;
		width: 100%;
		margin-bottom: 40px;
	}

	section {
		padding: 0.3em;
		display: inline-block;
		flex-wrap: wrap;
	}
</style>
