<script lang="ts">
	import { consumePlatforms, type Platform } from '$lib/utils';
	import { onMount } from 'svelte';
	import { defaultProperties, defaultRelations } from '$lib/constraints';
	import { Location, NodePath, TypePath } from '$lib/paths';
	import LdesGraph from '$lib/components/LdesGraph.svelte';
	import type { Config } from '$lib/utils';
	import LdesConfig from '$lib/components/config/LdesConfig.svelte';
	import { settings, type Settings } from '$lib/settings';
	import { get } from 'svelte/store';
	import { profile, save } from '$lib/profile';
	import { setLogger } from 'ldes-client';
	import { Button } from 'flowbite-svelte';

	type Value = { name: string; value: string };
	type Select = { [id: string]: Value };
	type Source = { locations: Select; nodes: Select; sensors: Select; types: Select };

	let sources: { [name: string]: Source } = {};
	let currentStreams: ReadableStreamDefaultReader[] = [];

	let allSources: { locations: Value[]; types: Value[]; sensors: Value[]; nodes: Value[] } = {
		locations: [],
		types: [],
		sensors: [],
		nodes: []
	};

	function updateSettings(settings: Settings, addGraphs = false) {
		const settingNames = new Set(settings.map((x) => x.name));

		for (const sourceName of Object.keys(sources)) {
			if (!settingNames.has(sourceName)) {
				delete sources[sourceName];
			}
		}

		for (const setting of settings) {
			if (sources[setting.name] === undefined) {
				sources[setting.name] = { locations: {}, nodes: {}, sensors: {}, types: {} };
				retrieveSensorLdes(setting, addGraphs);
			}
		}
	}

	async function retrieveSensorLdes(setting: Settings[number], updateGraphs = true) {
		while (sources[setting.name] !== undefined) {
			await new Promise<void>((res) =>
				currentStreams.push(
					consumePlatforms((p) => updateFound(p, updateGraphs, setting), setting.sensorLdes, res)
				)
			);
			updateGraphs = false;
			await new Promise((res) => setTimeout(res, 60000));
		}
	}

	let currentModal: number | undefined = undefined;
	let currentSettings = get(settings);

	let items: { config: Config; idx: number }[] = [];
	settings.subscribe((settings) => updateSettings(settings));

	profile.subscribe((p) => {
		for (const s of currentStreams) s.cancel();
		currentStreams = [];
		sources = {};
		updateSettings(get(settings));
		items = p.state.items || [];
	});

	let onServer = true;
	onMount(async () => {
		setLogger({});
		setTimeout(() => {
			updateSettings(get(settings));
		}, 100);
		onServer = false;
	});

	function reset() {
		items = [];
		for (const s of currentStreams) s.cancel();
		currentStreams = [];
		sources = {};
		updateSettings(get(settings), true);
	}

	const nameMap: { [id: string]: string } = {};

	function updateFound(plat: Platform, updateGraphs: boolean, setting: Settings[number]) {
		if (sources[setting.name] === undefined) return;
		const { locations, types, nodes, sensors } = sources[setting.name];

		if (plat.location && locations[plat.location] === undefined) {
			locations[plat.location] = {
				name: plat.locationName || plat.location,
				value: plat.location
			};

			if (updateGraphs) {
				addGraphForLocation(locations[plat.location], {
					name: setting.name,
					value: setting.dataLdes
				});
			}
		}

		// prepend the new found name
		if (
			plat.location &&
			plat.locationName &&
			locations[plat.location] !== undefined &&
			!locations[plat.location].name.startsWith(plat.locationName)
		) {
			locations[plat.location].name = plat.locationName + ' / ' + locations[plat.location].name;
		}

		if (nodes[plat.id.value] === undefined) {
			nodes[plat.id.value] = { name: plat.euid, value: plat.id.value };
		}

		if (plat.prefLabel && nodes[plat.id.value].name === plat.euid) {
			nodes[plat.id.value].name = plat.prefLabel;
		}

		if (plat.prefLabel && !nodes[plat.id.value].name.startsWith(plat.prefLabel)) {
			nodes[plat.id.value].name = plat.prefLabel + ' / ' + nodes[plat.id.value].name;
		}

		// nameMap.update((map) => {
		nameMap[plat.label] = nodes[plat.id.value].name;
		// return map;
		// });

		for (const sensor of plat.sensors) {
			// TODO: this should be isPartOf
			if (sensors[sensor.id.value] === undefined) {
				sensors[plat.id.value] = { name: sensor.label, value: sensor.id.value };
			}

			if (types[sensor.observes.id.value] === undefined) {
				types[sensor.observes.id.value] = {
					name: sensor.observes.label,
					value: sensor.observes.id.value
				};
			}
		}

		allSources = {
			locations: Object.values(sources).flatMap((x) => Object.values(x.locations)),
			types: Object.values(sources).flatMap((x) => Object.values(x.types)),
			nodes: Object.values(sources).flatMap((x) => Object.values(x.nodes)),
			sensors: Object.values(sources).flatMap((x) => Object.values(x.sensors))
		};
	}

	function addGraphForLocation(
		location: { name: string; value: string },
		url: { name: string; value: string }
	) {
		const name = location.name;

		for (const item of items) {
			if (item.config.name === name) return;
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
				urls: [url],
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
	}

	$: saveIt(items);
	$: idx = items.map((x) => x.idx + 1).reduceRight((a, b) => (a > b ? a : b), 0);

	function addGraph() {
		items = [
			...items,
			{
				config: {
					urls: currentSettings.map((setting) => ({
						name: setting.name,
						value: setting.dataLdes
					})),
					name: 'Graph ' + idx,
					constraint: {
						kind: 'and',
						children: []
					}
				},
				idx
			}
		];
	}

	const lookup = {
		types: TypePath,
		locations: Location,
		nodes: NodePath
	};
</script>

{#if currentModal !== undefined}
	<LdesConfig
		config={items[currentModal].config}
		multiOptions={allSources}
		relationParameters={{ relations: defaultRelations, properties: defaultProperties }}
		on:confirm={(c) => {
			if (currentModal !== undefined) {
				items[currentModal].config = { ...c.detail };
			}
			currentModal = undefined;
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

	<Button on:click={addGraph}>New Graph</Button>
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
