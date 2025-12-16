<script lang="ts">
	import { consumePlatforms, type Platform } from '$lib/utils';
	import { onMount } from 'svelte';

	import {
		defaultProperties,
		defaultRelations,
		isListConstraint,
		isMultiConstraint,
		isTimeIntervalConstraint
	} from '$lib/constraints';
	import { Location, NodePath, TypePath } from '$lib/paths';
	import LdesGraph from '$lib/components/LdesGraph.svelte';
	import type { Config } from '$lib/components/config/LdesConfig.svelte';
	import LdesConfig from '$lib/components/config/LdesConfig.svelte';
	import { settings, type Settings } from '$lib/settings';
	import { get, writable, type Writable } from 'svelte/store';
	import { profile } from '$lib/profile';
	import { setLogger } from 'ldes-client';
	import { Button } from 'flowbite-svelte';

	let allLocations: { [id: string]: { name: string; value: string } } = {};
	let allNodes: { [id: string]: { name: string; value: string } } = {};
	let allSensors: { [id: string]: { name: string; value: string } } = {};
	let allTypes: { [id: string]: { name: string; value: string } } = {};

	let currentModal: number | undefined = undefined;
	let currentStream: ReadableStreamDefaultReader | undefined = undefined;

	function resetPlatforms(settings: Settings) {
		if (currentStream !== undefined) {
			currentStream.cancel();
			currentStream = undefined;
		}
		allLocations = {};
		allNodes = {};
		allSensors = {};
		allTypes = {};
		currentStream = consumePlatforms(updateFound, settings.sensorLdes);
	}

	let currentSettings = get(settings);

	settings.subscribe(resetPlatforms);
	profile.subscribe(() => resetPlatforms(currentSettings));

	let items: { config: Config; idx: number }[] = [];
	let onServer = true;
	onMount(async () => {
		setLogger({});
		currentSettings = get(settings);
		setTimeout(() => resetPlatforms(currentSettings), 100);
		onServer = false;
	});

	let locations: { name: string; value: string }[] = [];
	let nodes: { name: string; value: string }[] = [];
	let types: { name: string; value: string }[] = [];

	const nameMap: { [id: string]: string } = {};

	function updateFound(plat: Platform) {
		if (plat.location && allLocations[plat.location] === undefined) {
			allLocations[plat.location] = { name: plat.location, value: plat.location };
		}

		if (allNodes[plat.id.value] === undefined) {
			allNodes[plat.id.value] = { name: plat.euid, value: plat.id.value };
		}

		if (plat.prefLabel && allNodes[plat.id.value].name === plat.euid) {
			allNodes[plat.id.value].name = plat.prefLabel;
		}

		if (plat.prefLabel && !allNodes[plat.id.value].name.startsWith(plat.prefLabel)) {
			allNodes[plat.id.value].name = plat.prefLabel + ' / ' + allNodes[plat.id.value].name;
		}

		// nameMap.update((map) => {
		nameMap[plat.label] = allNodes[plat.id.value].name;
		// return map;
		// });

		addGraphForPlatform(allNodes[plat.id.value]);

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

	function addGraphForPlatform(plat: { name: string; value: string }) {
		let nodeChild: { name: string; value: string } | undefined = undefined;
		const name = 'Graph for ' + plat.name;

		for (const item of items) {
			const cons = item.config.constraint;
			if (isListConstraint(cons)) {
				for (const child of cons.children) {
					if (isMultiConstraint(child)) {
						const option = child.values.find((value) => value.value == plat.value);
						if (option) {
							nodeChild = option;
							item.config.name = name;
							nodeChild.name = plat.name;
							return;
						}
					}
				}
			}
		}
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const constraint: Config['constraint'] = {
			kind: 'and',
			children: [
				{
					kind: 'multi',
					name: 'nodes',
					values: [plat]
				},
				{
					kind: 'rel',
					property: {
						name: 'Time',
						value: 'http://def.isotc211.org/iso19156/2011/Observation#OM_Observation.resultTime'
					},
					type: {
						name: 'Greater Than',
						value: 'https://w3id.org/tree#GreaterThanRelation'
					},
					value: oneWeekAgo.toISOString(),
					choice: 'date'
				}
			]
		};

		const config = {
			config: {
				url: currentSettings.dataLdes,
				name,
				constraint
			},
			idx
		};
		items = [...items, config];
	}

	async function save(xs: typeof items) {
		if (onServer) return;
		// await fetch('/app/api/state', {
		// 	body: JSON.stringify(xs.map((x) => x.config)),
		// 	credentials: 'include',
		// 	method: 'POST'
		// });
	}

	$: save(items);
	$: idx = items.map((x) => x.idx + 1).reduceRight((a, b) => (a > b ? a : b), 0);

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
				{nameMap}
				url={config.config.url}
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

	<Button
		on:click={() =>
			(items = [
				...items,
				{
					config: {
						url: currentSettings.dataLdes,
						name: 'Graph ' + idx,
						constraint: {
							kind: 'and',
							children: []
						}
					},
					idx
				}
			])}>New Graph</Button
	>
</div>

<style>
	.centered {
		margin: auto;
		width: 80vw;
		max-width: 1200px;
		margin-top: 1em;
		margin-bottom: 1em;
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
