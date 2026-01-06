<script lang="ts">
	import { consumePlatforms, type Platform } from '$lib/utils';
	import { onMount } from 'svelte';

	import {
		defaultProperties,
		defaultRelations,
		isListConstraint,
		isMultiConstraint
	} from '$lib/constraints';
	import { Location, NodePath, TypePath } from '$lib/paths';
	import LdesGraph from '$lib/components/LdesGraph.svelte';
	import type { Config } from '$lib/utils';
	import LdesConfig from '$lib/components/config/LdesConfig.svelte';
	import { settings, type Settings } from '$lib/settings';
	import { get } from 'svelte/store';
	import { profile, save } from '$lib/profile';
	import { setLogger } from 'ldes-client';
	import { Button } from 'flowbite-svelte';

	let allLocations: { [id: string]: { name: string; value: string } } = {};
	let allNodes: { [id: string]: { name: string; value: string } } = {};
	let allSensors: { [id: string]: { name: string; value: string } } = {};
	let allTypes: { [id: string]: { name: string; value: string } } = {};

	let currentModal: number | undefined = undefined;
	let currentStream: ReadableStreamDefaultReader | undefined = undefined;

	function resetPlatforms(settings: Settings, updateGraphs: boolean) {
		if (currentStream !== undefined) {
			currentStream.cancel();
			currentStream = undefined;
		}
		allLocations = {};
		allNodes = {};
		allSensors = {};
		allTypes = {};
		currentStream = consumePlatforms((p) => updateFound(p, updateGraphs), settings.sensorLdes);
	}

	let currentSettings = get(settings);

	let items: { config: Config; idx: number }[] = [];
	settings.subscribe((settings) => resetPlatforms(settings, false));
	profile.subscribe((p) => {
		console.log('Profile', p.state);
		resetPlatforms(currentSettings, p.state.items === undefined);
		items = p.state.items || [];
	});

	let onServer = true;
	onMount(async () => {
		setLogger({});
		currentSettings = get(settings);
		setTimeout(() => {
			resetPlatforms(currentSettings, false);
		}, 100);
		onServer = false;
	});

	function reset() {
		items = [];
		resetPlatforms(get(settings), true);
	}

	let locations: { name: string; value: string }[] = [];
	let nodes: { name: string; value: string }[] = [];
	let types: { name: string; value: string }[] = [];

	const nameMap: { [id: string]: string } = {};

	function updateFound(plat: Platform, updateGraphs: boolean) {
		console.log({ updateGraphs });
		if (plat.location && allLocations[plat.location] === undefined) {
			allLocations[plat.location] = {
				name: plat.locationName || plat.location,
				value: plat.location
			};

			if (updateGraphs) {
				addGraphForLocation(allLocations[plat.location]);
			}
		}

		// prepend the new found name
		if (
			plat.location &&
			plat.locationName &&
			allLocations[plat.location] !== undefined &&
			!allLocations[plat.location].name.startsWith(plat.locationName)
		) {
			allLocations[plat.location].name =
				plat.locationName + ' / ' + allLocations[plat.location].name;
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

	function addGraphForLocation(location: { name: string; value: string }) {
		let nodeChild: { name: string; value: string } | undefined = undefined;
		const name = location.name;

		for (const item of items) {
			const cons = item.config.constraint;
			if (isListConstraint(cons)) {
				for (const child of cons.children) {
					if (isMultiConstraint(child)) {
						const option = child.values.find((value) => value.value == location.value);
						if (option) {
							nodeChild = option;
							item.config.name = name;
							nodeChild.name = location.name;
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
					name: 'locations',
					values: [location]
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

	async function saveIt(xs: typeof items) {
		if (onServer) return;
		save(xs);
		// await fetch('/app/api/state', {
		// 	body: JSON.stringify(xs.map((x) => x.config)),
		// 	credentials: 'include',
		// 	method: 'POST'
		// });
	}

	$: saveIt(items);
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
	<Button color="alternative" on:click={reset}>Reset Graphs</Button>
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
</style>
