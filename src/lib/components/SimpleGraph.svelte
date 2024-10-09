<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ScatterData } from '$lib/components/data';
	import { MeasurementLens, type Sensor } from '$lib/configs/index';
	import { ConditionFactory } from '$lib/conditions';
	import { Factory, type Condition, type Member, type Ordered } from 'ldes-client';
	import {
		Chart as ChartJS,
		type Point,
		type BubbleDataPoint,
		type ChartTypeRegistry
	} from 'chart.js';
	import { Card } from 'flowbite-svelte';
	import { type Config } from './config/LdesConfig.svelte';
	import { Location, Node, SensorPath } from '$lib/paths';
	import { fetch_f, addToast, type Measurement } from '$lib/utils';
	import { createEventDispatcher, onMount } from 'svelte';
	import { PlayOutline } from 'flowbite-svelte-icons';
	import { DataFactory } from 'n3';
	const { literal } = DataFactory;

	const dispatch = createEventDispatcher<{ change: Config; delete: Config }>();

	export let sensors: { [id: string]: Sensor };
	export let order: Ordered = 'ascending';
	export let factory: Factory;

	export let config: Config = {
		name: '',
		url: 'http://localhost:3000/ldes/default/root',
		location: [],
		nodes: [],
		types: []
	};

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
		const factory = ConditionFactory.And();
		console.log('Config', config);

		if (config.location.length > 0) {
			const smallF = factory.or();
			for (const location of config.location) {
				smallF.leaf(Location, literal(location.value));
			}
		}

		if (config.nodes.length > 0) {
			const smallF = factory.or();
			for (const node of config.nodes) {
				smallF.leaf(Node, literal(node.value));
			}
		}

		if (config.types.length > 0) {
			const smallF = factory.or();
			for (const ty of config.types) {
				smallF.leaf(SensorPath, literal(ty.value));
			}
		}

		return factory.intoCondition();
	}

	function addMeasurement(measurement: Measurement) {
		const sensorName = sensors[measurement.sensor.value].title;
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

		let dataset = chart.graphData.datasets.find((x) => x.label === sensorName);
		if (!dataset) {
			dataset = {
				borderColor: sensorColor(sensorName),
				type: 'scatter',
				label: sensorName,
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
			// chart.graphData.datasets.forEach((x) => {
			// 	(<Point[]>x.data).sort((a, b) => a.x - b.x);
			// });
			if (chart.node) chart.node.update();
		});
	}

	async function readStream() {
		let el = await stream.read();
		console.log('first member!');
		while (el) {
			if (el.value) {
				count += 1;

				if (count % 100 === 0) {
					console.log('updating chart');
					updateChart();
					await new Promise((res) => setTimeout(res, 10));
				}

				const output = <Measurement>MeasurementLens.execute(el.value);
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

	async function changed() {
		dispatch('change', config);

		if (stream) stream.cancel();
		if (timeout) clearTimeout(timeout);

		count = 0;
		charts = [];
		const condition = getCondition();
		console.log('condition', condition.toString());
		const client = factory.build(
			{
				condition,
				// shape: {
				// 	quads: shape_quads,
				// 	shapeId: new NamedNode('http://example.org/Measurement')
				// },
				fetch: fetch_f
			},
			order
		);
		// Maybe this is not working
		charts.forEach((chart) => (chart.graphData.datasets = []));
		console.log('Created client');

		// timeout = setInterval(updateChart, 1000);
		stream = client.stream().getReader();
		readStream();
	}

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
	</div>

	<div class="charts">
		{#each charts as chart}
			<div class="my-4">
				<h3>{chart.type}</h3>
				<Chart bind:chart={chart.node} data={chart.graphData} />
			</div>
		{/each}
	</div>
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
