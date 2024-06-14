<script lang="ts">
	import type { Node } from '@ajuvercr/mumo-pipeline';
	import Chart from './Chart.svelte';
	import type { ScatterData } from '$lib/components/data';
	import { empty_condition, replicateLDES, type Member } from 'ldes-client';
	import {
		Chart as ChartJS,
		type Point,
		type BubbleDataPoint,
		type ChartTypeRegistry
	} from 'chart.js';
	import { Button, ButtonGroup, Card } from 'flowbite-svelte';
	import shape from '$lib/configs/shape.ttl?raw';
	import LdesConfig, { type Config } from './config/LdesConfig.svelte';
	import { LeafCondition, OrCondition, type Condition } from 'ldes-client/dist/lib/condition';
	import { Location } from '$lib/paths';
	import { fetch_f, type Measurement } from '$lib/utils';
	import { TREE } from '@treecg/types';
	import { extractShapes } from 'rdf-lens';
	import { NamedNode, Parser } from 'n3';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ change: Config; delete: Config }>();

	export let nodes: Node[];

	export let config: Config = {
		name: '',
		// url: 'https://mumo.ilabt.imec.be/ldes/sds/root',
		url: 'http://localhost:3000/ldes/default/root',
		location: []
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
		let out = empty_condition();
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
				out = leafs.reduce((alpha, beta) => new OrCondition({ alpha, beta }));
			} else {
				out = leafs[0];
			}
		}
		console.log('condition', out.toString());
		return out;
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

		updateChart();
	}

	let timeout: NodeJS.Timeout;

	function toggle() {
		open = !open;
	}

	function deleteIt() {
		dispatch('delete', config);
	}

	async function changed(x: Config) {
		dispatch('change', x);

		if (stream) stream.cancel();
		if (timeout) clearTimeout(timeout);

		count = 0;
		charts = [];
		const client = replicateLDES({
			url: config.url,
			condition: getCondition(),
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

	let open = true;
</script>

<Card class="relative m-5" size="lg">
	<div class="flex items-center justify-between">
		<div>
			<span class="text-3xl font-bold text-gray-900 dark:text-white">{config.name}</span>
			<p class="font-light dark:text-white">{count} items</p>
		</div>
		<ButtonGroup>
			<Button on:click={deleteIt}>Delete</Button>
			<Button on:click={toggle}>Configure!</Button>
		</ButtonGroup>
	</div>

	{#each charts as chart}
		<div class="my-4">
			<h3>{chart.type}</h3>
			<Chart bind:chart={chart.node} data={chart.graphData} />
		</div>
	{/each}

	{#if open}
		<hr />
		<LdesConfig bind:config on:change={(x) => changed(x.detail)} {locations} />
	{/if}
</Card>

<style>
</style>
