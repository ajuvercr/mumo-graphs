<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import { consumePlatforms, type Platform } from '$lib/utils';
	import { onMount } from 'svelte';

	import BaseConstraint from '$lib/components/constraints/Base.svelte';
	import { constraintToCondition, defaultProperties, defaultRelations } from '$lib/constraints';
	import { Location, NodePath, TypePath } from '$lib/paths';
	import LdesGraph from '$lib/components/LdesGraph.svelte';
	import type { Config } from '$lib/components/config/LdesConfig.svelte';
	import { EmptyCondition, type Condition } from 'ldes-client';
	import LdesConfig from '$lib/components/config/LdesConfig.svelte';

	const allLocations: { [id: string]: { name: string; value: string } } = {};
	const allNodes: { [id: string]: { name: string; value: string } } = {};
	const allSensors: { [id: string]: { name: string; value: string } } = {};
	const allTypes: { [id: string]: { name: string; value: string } } = {};

	let currentModal: number | undefined = undefined;
	const flipDurationMs = 300;

	let items: { config: Config; condition: Condition; idx: number }[] = [
		{
			config: {
				url: 'http://localhost:8004/sensors/by-name/index.trig',
				name: 'Hello world',
				constraint: {
					kind: 'and',
					children: [
						{
							kind: 'multi',
							name: 'nodes',
							values: [
								{
									name: 'sensor-3',
									value: 'http://mumo.be/data/sensor/70B3D57ED005E7F2'
								},
								{
									name: 'sensor-4',
									value: 'http://mumo.be/data/sensor/70B3D57ED005BE9F'
								},
								{
									name: 'sensor-5',
									value: 'http://mumo.be/data/sensor/70B3D57ED005E7DC'
								}
							]
						}
					]
				}
			},
			condition: new EmptyCondition(),
			idx: 0
		},
		{
			config: {
				url: 'http://localhost:8004/sensors/by-name/index.trig',
				name: 'Hello world',
				constraint: {
					kind: 'and',
					children: [
						{
							kind: 'multi',
							name: 'nodes',
							values: [
								{
									name: 'sensor-3',
									value: 'http://mumo.be/data/sensor/70B3D57ED005E7F2'
								}
							]
						}
					]
				}
			},
			condition: new EmptyCondition(),
			idx: 1
		}
	];

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

	onMount(() =>
		consumePlatforms(updateFound, fetch, 'http://localhost:8004/sensors/by-name/index.trig')
	);

	const lookup = {
		types: TypePath,
		locations: Location,
		nodes: NodePath
	};

	for (const c of items) {
		c.condition = constraintToCondition(c.config.constraint, lookup);
	}
</script>

{#if currentModal !== undefined}
	<LdesConfig
		config={items[currentModal].config}
		multiOptions={{ types, locations, nodes }}
		relationParameters={{ relations: defaultRelations, properties: defaultProperties }}
		on:confirm={(c) => {
			if (currentModal !== undefined) {
				items[currentModal].config = { ...c.detail };
				items[currentModal].condition = constraintToCondition(c.detail.constraint, lookup);
			}
			currentModal = undefined;
		}}
		on:cancle={() => (currentModal = undefined)}
	/>
{/if}

{#each items as config, i}
	<div class="card">
		<LdesGraph
			condition={config.condition}
			url="http://localhost:8004/data/by-sensor/index.trig"
			config={config.config}
		/>
		<button on:click={() => (currentModal = i)}>Edit</button>
	</div>
{/each}

<style>
	.card {
		padding: 1rem;
		border: 1px solid black;
		border-radius: 2rem;

		margin: auto;
		width: 80vw;
		max-width: 1200px;
	}
	.card + .card {
		margin-top: 40px;
	}

	section {
		padding: 0.3em;
		display: inline-block;
		flex-wrap: wrap;
	}
</style>
