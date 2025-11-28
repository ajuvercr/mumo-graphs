<script lang="ts">
	import { dragHandleZone, dragHandle } from 'svelte-dnd-action';
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
	import { type Config } from './config/LdesConfig.svelte';
	import {
		addToast,
		enhanced_fetch,
		proxy_fetch,
		type ChartLayout,
		type Measurement
	} from '$lib/utils';
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		PlayOutline,
		ArrowUpDownOutline,
		EditOutline,
		TrashBinOutline,
		FileExportOutline,
		TrashBinSolid,
		FileExportSolid,
		EditSolid,
		StopOutline,
		StopSolid
	} from 'flowbite-svelte-icons';
	import RadioType from './parts/RadioType.svelte';
	import type { Path } from '$lib/paths';
	import { constraintToCondition, type ListConstraint } from '$lib/constraints';
	import HoverIcon from './HoverIcon.svelte';
	import Delete from './Delete.svelte';
	import { fetch } from '@inrupt/solid-client-authn-browser';

	const dispatch = createEventDispatcher<{ change: Config; delete: null; edit: null }>();

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
	const nameToIdMap: { [name: string]: string } = {};

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
			nameToIdMap[measurement.nodeName] = measurement.node.value;

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

			const layout = layouts.find((x) => x.id === measurement.result.valueType);
			if (!layout) {
				layouts = [
					...layouts,
					{
						expanded: 'medium',
						id: measurement.result.valueType,
						order: layouts.length,
						type: measurement.result.valueName
					}
				];
			}
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

			el = await stream.read();
		}

		addToast('Ingestion is done!');

		updateChart();
		streaming = false;
	}

	async function changed(condition: Condition, start = false) {
		dispatch('change', config);

		const doStart = start || streaming;
		if (!doStart) return;

		if (stream) stream.cancel();

		count = 0;
		charts = [];

		const client = new Client(
			intoConfig({
				url,
				urlIsView: true,
				fetch: enhanced_fetch(fetch),
				condition
			}),
			order
		);
		// Maybe this is not working
		charts.forEach((chart) => (chart.graphData.datasets = []));

		stream = client.stream().getReader();
		readStream();
	}

	function start() {
		changed(condition, true);
	}

	function exportCSV() {
		const rows: { [id: string]: string | number }[] = [];
		for (const chart of charts) {
			for (const dataset of chart.graphData.datasets) {
				for (const d of <Point[]>dataset.data) {
					const data = <{ x: Date; y: number }>(<unknown>d);
					rows.push({
						name: dataset.label!,
						id: nameToIdMap[dataset.label!],
						type: chart.type,
						timestamp: data.x.toISOString(),
						value: data.y
					});
				}
			}
		}

		if (rows.length < 1) {
			return;
		}

		const headers = Object.keys(rows[0]);
		const csv = [
			headers.join(','), // header row
			...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))
		].join('\n'); // Create a blob and download
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'export-' + config.name;
		a.click();

		URL.revokeObjectURL(url);
	}

	onMount(() => {
		if (autoPlay) changed(condition, true);
	});

	$: changed(condition);

	// Sorting logic — updates the order after drag/drop
	function handleSort(e: any) {
		layouts = e.detail.items;
	}

	export let order: Ordered = 'ascending';
	export let url = 'http://localhost:3000/ldes/default/root';

	export let config: Config = {
		constraint: <ListConstraint>{ kind: 'and', children: [] },
		name: 'placeholder',
		url: 'http://localhost:8004/sensors/by-name/index.trig'
	};
	export let autoPlay = false;
	export let lookup: { [id: string]: Path } = {};
	export let layouts: ChartLayout[] = [];

	$: condition = constraintToCondition(config.constraint, lookup);
</script>

<section>
	<div class="flex items-center justify-between">
		<div class="w-full">
			<div class="flex items-center">
				{#if streaming}
					<ArrowUpDownOutline size="xl" class="running" />
				{:else}
					<PlayOutline withEvents on:click={start} size="xl" class="play cursor-pointer" />
				{/if}
				<span class="text-3xl font-bold text-gray-900 dark:text-white">{config.name}</span>

				<div class="ml-auto flex items-center gap-4">
					{#if charts.length > 0}
						<button on:click={() => exportCSV()}>
							<HoverIcon>
								<FileExportOutline size="lg" slot="outline" />
								<FileExportSolid size="lg" slot="solid" />
							</HoverIcon>
						</button>
					{/if}
					<button
						on:click={(e) => {
							console.log('Got on click', e);
							dispatch('edit', null);
						}}
					>
						<HoverIcon>
							<EditOutline size="lg" slot="outline" />
							<EditSolid size="lg" slot="solid" />
						</HoverIcon>
					</button>
					<Delete on:delete={() => dispatch('delete', null)} />
				</div>
			</div>
			<p class="font-light dark:text-white">{count} items</p>
		</div>
	</div>

	<div
		class="charts"
		use:dragHandleZone={{ items: layouts, flipDurationMs: 200 }}
		on:consider={handleSort}
		on:finalize={handleSort}
	>
		{#each layouts as cfg (cfg.id)}
			{#each charts.filter((c) => c.type === cfg.type) as chart}
				<div
					class="chart-container"
					class:normal={cfg.expanded === 'medium'}
					class:expanded={cfg.expanded === 'large'}
					class:small={cfg.expanded === 'small'}
				>
					<div class="mb-2 flex items-center justify-between">
						<span use:dragHandle class="drag-handle">☰</span>
						<h3 class="ml-3 flex-1">{chart.type}</h3>

						<div class="self-end">
							<div class="flex">
								<button on:click={() => (cfg.expanded = 'small')}>
									{#if cfg.expanded == 'small'}
										<StopSolid size="sm" />
									{:else}
										<StopOutline size="sm" />
									{/if}
								</button>
								<button on:click={() => (cfg.expanded = 'medium')}>
									{#if cfg.expanded == 'medium'}
										<StopSolid size="md" />
									{:else}
										<StopOutline size="md" />
									{/if}
								</button>
								<button on:click={() => (cfg.expanded = 'large')}>
									{#if cfg.expanded == 'large'}
										<StopSolid size="xl" />
									{:else}
										<StopOutline size="xl" />
									{/if}
								</button>
							</div>
						</div>
					</div>

					<Chart bind:chart={chart.node} data={chart.graphData} />
				</div>
			{/each}
		{/each}
	</div>
</section>

<style>
	.hidden {
		display: none;
	}
	.placeholder {
		width: 100px;
		height: 100px;
		background-color: red;
	}

	.small {
		width: 31%;
		margin-left: auto;
		margin-right: auto;
	}

	.expanded {
		max-width: none;
		width: 100%;
	}

	.normal {
		width: 45%;
		margin-left: auto;
		margin-right: auto;
	}

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
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
	}
</style>
