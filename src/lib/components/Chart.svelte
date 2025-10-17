<script lang="ts">
	import { Chart } from 'svelte-chartjs';
	import { options } from './data';
	import type { ScatterData } from './data';
	import 'chartjs-adapter-date-fns';
	// import zoomPlugin from 'chartjs-plugin-zoom';

	import {
		Chart as ChartJS,
		Tooltip,
		Legend,
		BarElement,
		PointElement,
		LineElement,
		CategoryScale,
		LinearScale,
		LineController,
		BarController,
		ScatterController,
		type Point,
		type BubbleDataPoint,
		type ChartTypeRegistry,
		TimeScale,
		TimeSeriesScale,
		Decimation
	} from 'chart.js';

	// import zoomPlugin from 'chartjs-plugin-zoom';

	ChartJS.register(
		Decimation,
		LinearScale,
		CategoryScale,
		BarElement,
		PointElement,
		LineElement,
		TimeScale,
		TimeSeriesScale,
		Legend,
		Tooltip,
		LineController,
		BarController,
		ScatterController
		// zoomPlugin
	);
	// function triggerTooltip(chart: ChartJS) {
	// 	const tooltip = chart && chart.tooltip;
	//
	// 	if (!tooltip) {
	// 		return;
	// 	}
	//
	// 	console.log('tooltip', tooltip);
	// 	console.log('Active elements', tooltip.getActiveElements());
	//
	// 	chart.update();
	// }
	//
	// function updateData(chart: ChartJS) {
	// 	for (let ds of data.datasets) {
	// 		ds.data = ds.data.map((x, i) => x + 10 * i * i);
	// 	}
	//
	// 	chart.update();
	// }

	export let chart: ChartJS<
		keyof ChartTypeRegistry,
		(number | Point | [number, number] | BubbleDataPoint)[],
		unknown
	>;
	export let data: ScatterData;
</script>

<div class="wrapper">
	<Chart bind:chart type="bar" {data} {options} height="300px" width="800px" />
</div>

<style>
	.wrapper {
		/* max-height: 220px; */
		width: 100%;
	}
</style>
