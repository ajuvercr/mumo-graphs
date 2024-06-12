<script lang="ts">
	import type { Node } from '@ajuvercr/mumo-pipeline';
	import Chart from './Chart.svelte';
	import type { ScatterData } from '$lib/components/data';
	import { Client, empty_condition, replicateLDES, type Member } from 'ldes-client';
	import {
		Chart as ChartJS,
		type Point,
		type BubbleDataPoint,
		type ChartTypeRegistry
	} from 'chart.js';
	import { Input, Label, Helper, Button, Card } from 'flowbite-svelte';
	import shape from '$lib/configs/shape.ttl?raw';
	import LdesConfig, { type Config } from './config/LdesConfig.svelte';
	import { LeafCondition, OrCondition } from 'ldes-client/dist/lib/condition';
	import { Location } from '$lib/paths';
	import { myFetch, type Measurement } from '$lib/utils';
	import { TREE } from '@treecg/types';
	import { extractShapes } from 'rdf-lens';
	import { NamedNode, Parser } from 'n3';

	export let nodes: Node[];

	const shape_quads = new Parser().parse(shape);
	const lensCache = extractShapes(shape_quads);

	let running = false;

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
		'#f46a9b',
		'#ef9b20',
		'#edbf33',
		'#ede15b',
		'#bdcf32',
		'#87bc45',
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
				borderColor: sensorColor(measurement.sensor.name),
				type: 'scatter',
				label: measurement.sensor.name,
				data: <Point[]>[],
				borderWidth: 2
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

			el = await stream.read();
		}

		updateChart();
	}

	let url = 'https://mumo.ilabt.imec.be/ldes/sds/root';
	let timeout: NodeJS.Timeout;

	let condition = empty_condition();

	function toggle() {
		if (running) {
			if (stream) stream.cancel();
			if (timeout) clearTimeout(timeout);
		} else {
			count = 0;
			charts = [];
			const client = replicateLDES({
				url,
				condition,
				shape: {
					quads: shape_quads,
					shapeId: new NamedNode('http://example.org/Measurement')
				},
				fetch: myFetch
			});
			// Maybe this is not working
			charts.forEach((chart) => (chart.graphData.datasets = []));
			console.log('Created client');

			timeout = setInterval(updateChart, 1000);
			stream = client.stream().getReader();
			readStream();
		}
		running = !running;
	}

	function changed(x: Config) {
		url = x.url;
		console.log(x, x.location);
		if (x.location.length > 0) {
			const leafs = x.location.map(
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
				condition = leafs.reduce((alpha, beta) => new OrCondition({ alpha, beta }));
			} else {
				condition = leafs[0];
			}
		}

		console.log(condition.toString());
		toggle();
	}
</script>

<main>
	{#if running}
		<p>Running {running} {count} items</p>
		{#each charts as chart}
			<h3>{chart.type}</h3>
			<Chart bind:chart={chart.node} data={chart.graphData} />
		{/each}
		<!-- <Chart bind:chart data={graphData} /> -->
		<Button on:click={toggle}>Configure!</Button>
	{:else}
		<LdesConfig on:change={(x) => changed(x.detail)} />
	{/if}
</main>
