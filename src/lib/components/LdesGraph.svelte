<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ScatterData } from '$lib/components/data';
	import { empty_condition, replicateLDES, type Member } from 'ldes-client';
	import {
		Chart as ChartJS,
		type Point,
		type BubbleDataPoint,
		type ChartTypeRegistry
	} from 'chart.js';
	import { Accordion, AccordionItem, Card } from 'flowbite-svelte';
	import shape from '$lib/configs/shape.ttl?raw';
	import LdesConfig, { type Config } from './config/LdesConfig.svelte';
	import {
		AndCondition,
		LeafCondition,
		OrCondition,
		type Condition
	} from 'ldes-client/dist/lib/condition';
	import { Location, Node, Sensor } from '$lib/paths';
	import { fetch_f, addToast, type Measurement } from '$lib/utils';
	import { TREE } from '@treecg/types';
	import { extractShapes } from 'rdf-lens';
	import { NamedNode, Parser } from 'n3';
	import { createEventDispatcher, onMount } from 'svelte';
	import { PlayOutline, TrashBinOutline } from 'flowbite-svelte-icons';

	const dispatch = createEventDispatcher<{ change: Config; delete: Config }>();

	export let config: Config = {
		name: '',
		url: 'http://localhost:3000/ldes/default/root',
		location: [],
		nodes: [],
		types: []
	};

	const shape_quads = new Parser().parse(shape);
	const lensCache = extractShapes(shape_quads);

	let charts: {
		type: string;
		graphData: ScatterData;
		node: ChartJS<
			keyof ChartTypeRegistry,
			(number | Point | [number, number] | BubbleDataPoint)[],
			unknown
		>;
	}[] = [];

	const colors = [
		'#ea5545',
		'#ef9b20',
		'#87bc45',
		'#edbf33',
		'#f46a9b',
		'#bdcf32',
		'#ede15b',
		'#27aeef',
		'#b33dc6'
	];

	const colorNames: string[] = [];
	function sensorColor(sensor: string): string {
		let idx = colorNames.indexOf(sensor);
		if (idx == -1) {
			idx = colorNames.length;
			colorNames.push(sensor);
		}

		return colors[idx % colors.length];
	}

	function getCondition(): Condition {
		console.log('Config', config);
		const conditions: Condition[] = [];
		if (config.location.length > 0) {
			const leafs: Condition[] = config.location.map(
				(loc) =>
					new LeafCondition({
						path: Location.lens,
						pathQuads: Location.quads,
						value: loc.value,
						relationType: TREE.terms.EqualToRelation
					})
			);

			console.log(leafs.map((x) => x.toString()));

			if (leafs.length > 1) {
				conditions.push(leafs.reduce((alpha, beta) => new OrCondition({ alpha, beta })));
			} else if (leafs.length === 1) {
				conditions.push(leafs[0]);
			}
		}

		if (config.nodes.length > 0) {
			const leafs: Condition[] = config.nodes.map(
				(loc) =>
					new LeafCondition({
						path: Node.lens,
						pathQuads: Node.quads,
						value: loc.value,
						relationType: TREE.terms.EqualToRelation
					})
			);

			if (leafs.length > 1) {
				conditions.push(leafs.reduce((alpha, beta) => new OrCondition({ alpha, beta })));
			} else if (leafs.length === 1) {
				conditions.push(leafs[0]);
			}
		}

		if (config.types.length > 0) {
			const leafs: Condition[] = config.types.map(
				(loc) =>
					new LeafCondition({
						path: Sensor.lens,
						pathQuads: Sensor.quads,
						value: loc.value,
						relationType: TREE.terms.EqualToRelation
					})
			);

			if (leafs.length > 1) {
				conditions.push(leafs.reduce((alpha, beta) => new OrCondition({ alpha, beta })));
			} else if (leafs.length === 1) {
				conditions.push(leafs[0]);
			}
		}

		console.log('here', conditions);

		if (conditions.length === 0) return empty_condition();
		if (conditions.length === 1) return conditions[0];
		return conditions.reduce((alpha, beta) => new AndCondition({ alpha, beta }));
	}

	function addMeasurement(measurement: Measurement) {
		console.log('adding measurement', measurement.result.valueType, measurement.sensor.name);
		let chart = charts.find((x) => x.type === measurement.result.valueType);
		if (!chart) {
			chart = {
				type: measurement.result.valueType,
				graphData: {
					datasets: []
				},
				node: <
					ChartJS<
						keyof ChartTypeRegistry,
						(number | Point | [number, number] | BubbleDataPoint)[],
						unknown
					>
				>(<any>undefined)
			};
			charts = [...charts, chart];
		}

		let dataset = chart.graphData.datasets.find((x) => x.label === measurement.sensor.name);
		if (!dataset) {
			dataset = {
				borderColor: sensorColor(measurement.node.name),
				type: 'scatter',
				label: measurement.sensor.name,
				data: <Point[]>[],
				borderWidth: 2,
				pointStyle: false
			};
			chart.graphData.datasets.push(dataset);
		}

		dataset.data.push(<Point>(<any>{ x: measurement.date, y: measurement.result.numericValue }));
	}

	let stream: ReadableStreamDefaultReader<Member>;
	let count = 0;

	function updateChart() {
		charts.forEach((chart) => {
			chart.graphData.datasets.forEach((x) => {
				(<Point[]>x.data).sort((a, b) => a.x - b.x);
			});
			if (chart.node) chart.node.update();
		});
	}

	async function readStream() {
		let el = await stream.read();
		console.log('first member!');
		while (el) {
			if (el.value) {
				count += 1;

				const output: Measurement = lensCache.lenses['http://example.org/Measurement'].execute(
					el.value
				);
				// console.log(output);
				addMeasurement(output);
			}

			if (el.done) {
				break;
			}

			// await new Promise((res) => setTimeout(res, 20));
			el = await stream.read();
		}

		addToast('Ingestion is done!');

		updateChart();
	}

	let timeout: NodeJS.Timeout;

	function deleteIt() {
		dispatch('delete', config);
	}

	async function changed() {
		dispatch('change', config);

		if (stream) stream.cancel();
		if (timeout) clearTimeout(timeout);

		count = 0;
		charts = [];
		const condition = getCondition();
		console.log('condition', condition.toString());
		const client = replicateLDES({
			url: config.url,
			condition,
			shape: {
				quads: shape_quads,
				shapeId: new NamedNode('http://example.org/Measurement')
			},
			fetch: fetch_f
		});
		// Maybe this is not working
		charts.forEach((chart) => (chart.graphData.datasets = []));
		console.log('Created client');

		timeout = setInterval(updateChart, 1000);
		stream = client.stream().getReader();
		readStream();
	}

	const locations = [
		{ name: '1 - Atelier White box', value: 'https://heron.libis.be/momu/api/items/222333' },
		{ name: '4 - Fotostudio', value: 'https://heron.libis.be/momu/api/items/222291' },
		{ name: '0 - Vaste opstelling', value: 'https://heron.libis.be/momu/api/items/222321' },
		{ name: '1 - Quarantaineruimte', value: 'https://heron.libis.be/momu/api/items/222309' },
		{ name: '2 - Leeszaal Bibliotheek', value: 'https://heron.libis.be/momu/api/items/16686' },
		{ name: '2 - Depot Bibliotheek', value: 'https://heron.libis.be/momu/api/items/222303' },
		{ name: 'MoMu', value: 'https://heron.libis.be/momu/api/items/16685' }
	];

	const types = [
		{ name: 'Temperatuur', value: 'http://qudt.org/1.1/vocab/unit#DegreeCelsius' },
		{ name: 'Relatieve Vochtigheid', value: 'http://qudt.org/1.1/vocab/unit#RelHumidity' }
	];
	const nodes = [
		{
			name: 'UNCONFIGURED - Unconfigured node',
			value: 'http://mumo.be/data/unknown/node'
		},
		{
			name: 'MOMU-001 - MuMo-v2-030',
			value: 'https://heron.libis.be/momu/api/items/336462'
		},
		{
			name: 'MOMU-002 - MuMo-v2-031',
			value: 'https://heron.libis.be/momu/api/items/336465'
		},
		{
			name: 'MOMU-003 - MuMo-v2-032',
			value: 'https://heron.libis.be/momu/api/items/336468'
		},
		{
			name: 'MOMU-004 - MuMo-v2-033',
			value: 'https://heron.libis.be/momu/api/items/336471'
		},
		{
			name: 'MOMU-005 - MuMo-v2-034',
			value: 'https://heron.libis.be/momu/api/items/336474'
		},
		{
			name: 'MOMU-006 - MuMo-v2-035',
			value: 'https://heron.libis.be/momu/api/items/336477'
		},
		{
			name: 'MOMU-007 - MuMo-v2-036',
			value: 'https://heron.libis.be/momu/api/items/336480'
		},
		{
			name: 'MOMU-unnamed - mumo-v2-011',
			value: 'https://heron.libis.be/momu/api/items/336483'
		}
	];
	onMount(() => {
		if (autoPlay) changed();
	});
	export let open = false;
	export let autoPlay = false;
</script>

<Card class="relative m-5" size="lg">
	<div class="flex items-center justify-between">
		<div>
			<div class="flex items-center">
				<PlayOutline withEvents on:click={changed} size="xl" class="play cursor-pointer" />
				{#if open}
					<span
						contenteditable="true"
						bind:textContent={config.name}
						class="text-3xl font-bold text-gray-900 dark:text-white">{config.name}</span
					>
				{:else}
					<span class="text-3xl font-bold text-gray-900 dark:text-white">{config.name}</span>
				{/if}
			</div>
			<p class="font-light dark:text-white">{count} items</p>
		</div>

		<TrashBinOutline withEvents on:click={deleteIt} size="lg" />
	</div>

	<div class="charts">
		{#each charts as chart}
			<div class="my-4">
				<h3>{chart.type}</h3>
				<Chart bind:chart={chart.node} data={chart.graphData} />
			</div>
		{/each}
	</div>
	<Accordion flush>
		<AccordionItem bind:open>
			<span slot="header">Configure graph</span>
			<LdesConfig bind:config on:change={() => changed()} {locations} {types} {nodes} />
		</AccordionItem>
	</Accordion>
</Card>

<style>
	:global(.play) {
		color: green;
	}
	.charts {
		max-height: 440px;
		overflow-y: auto;
	}
</style>
