<script lang="ts">
	import Chart from './Chart.svelte';
	import type { ScatterData } from '$lib/components/data';
	import { MeasurementLens, type Sensor } from '$lib/configs/index';
	import { Client, intoConfig, type Condition, type Member, type Ordered } from 'ldes-client';
	import {
		Chart as ChartJS,
		type Point,
		type BubbleDataPoint,
		type ChartTypeRegistry
	} from 'chart.js';
	import { Card } from 'flowbite-svelte';
	import { type Config } from './config/LdesConfig.svelte';
	import { addToast, proxy_fetch, type Measurement } from '$lib/utils';
	import { createEventDispatcher, onMount } from 'svelte';
	import { PlayOutline, ArrowUpDownOutline } from 'flowbite-svelte-icons';
	import { Writer } from 'n3';

	const dispatch = createEventDispatcher<{ change: Config; delete: Config }>();

	export let order: Ordered = 'ascending';

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

	let types: string[] = [];

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

	function addMeasurement(measurement: Measurement) {
		const sensorName = measurement.nodeName;
		let chart = charts.find((x) => x.type === measurement.result.valueName);
		if (!chart) {
			console.log('Creating new chart for ', measurement.result.valueType);
			types = [...types, measurement.result.valueType];
			chart = {
				type: measurement.result.valueName,
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
			if (chart.node) chart.node.update();
		});
	}

	let streaming = false;
	async function readStream() {
		streaming = true;
		let el = await stream.read();
		console.log('first member!');
		while (el) {
			if (el.value) {
				count += 1;

				if (count % 100 === 0) {
					updateChart();
					await new Promise((res) => setTimeout(res, 10));
				}

				const output = <Measurement>MeasurementLens.execute(el.value);
				addMeasurement(output);
			}

			if (el.done) {
				break;
			}

			await new Promise((res) => setTimeout(res, 20));
			el = await stream.read();
		}

		addToast('Ingestion is done!');

		updateChart();
		streaming = false;
	}

	let timeout: NodeJS.Timeout | undefined = undefined;

	async function changed(condition: Condition, start = false) {
		dispatch('change', config);

		const doStart = start || streaming;
		if (!doStart) return;

		if (stream) stream.cancel();
		if (timeout) clearTimeout(timeout);

		console.log('changed!');

		count = 0;
		charts = [];
		types = [];

		const client = new Client(
			intoConfig({
				url: 'http://localhost:8001/by-sensor/index.trig',
				urlIsView: true,
				fetch: proxy_fetch(fetch),
				condition
			}),
			order
		);
		// Maybe this is not working
		charts.forEach((chart) => (chart.graphData.datasets = []));

		// timeout = setInterval(updateChart, 1000);
		stream = client.stream().getReader();
		readStream();
	}

	function start() {
		changed(condition, true);
	}

	onMount(() => {
		if (autoPlay) changed(condition, true);
	});

	$: changed(condition);

	export let condition: Condition;
	export let autoPlay = false;
</script>

<Card class="relative m-5" size="lg">
	<div class="flex items-center justify-between">
		<div>
			<div class="flex items-center">
				{#if streaming}
					<ArrowUpDownOutline size="xl" class="running" />
				{:else}
					<PlayOutline withEvents on:click={start} size="xl" class="play cursor-pointer" />
				{/if}
				<span class="text-3xl font-bold text-gray-900 dark:text-white">{config.name}</span>
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
	:root {
		--date-input-width: 200px;
	}
	.header {
		display: flex;
		justify-content: space-between;
	}
	.footer {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	:global(.date-time-picker) {
		width: 16rem;
	}
	.element {
		flex-grow: 1;
		padding: 5px 0;
		cursor: pointer;
		text-align: center;
		position: relative;
	}
	.element:hover {
		text-shadow: 0px 0px 1px black;
	}

	.element + .element:before {
		content: '';
		position: absolute;
		left: 0;
		top: 25%;
		height: 50%;
		width: 1px;
		background: grey;
	}

	.selected {
		color: orange;
	}
	.selected:hover {
		text-shadow: 0px 0px 1px orange;
	}
	:global(.play) {
		color: green;
	}

	:global(.running) {
		color: orange;
	}

	:global(.waiting) {
		color: grey;
	}
	.charts {
		max-height: 440px;
		overflow-y: auto;
	}
</style>
