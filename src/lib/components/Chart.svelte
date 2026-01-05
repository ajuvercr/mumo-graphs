<script lang="ts">
	import { Chart } from 'svelte-chartjs';
	import { options } from './data';
	import type { ScatterData } from './data';
	import 'chartjs-adapter-date-fns';
	import zoomPlugin from 'chartjs-plugin-zoom';

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
		ScatterController,
		zoomPlugin
	);

	export let chart: ChartJS<
		keyof ChartTypeRegistry,
		(number | Point | [number, number] | BubbleDataPoint)[],
		unknown
	>;
	export let data: ScatterData;
</script>

<Chart bind:chart type="bar" {data} {options} />
