<script lang="ts">
	import type { Node } from '@ajuvercr/mumo-pipeline';
	import Chart from './Chart.svelte';
  import Field from './config/Field.svelte';
	import type { ScatterData } from '$lib/components/data';
	import { replicateLDES, type Condition, parse_condition, Client, type Member } from 'ldes-client';

	import filter from '$lib/configs/filter.ttl?raw';
	import shape from '$lib/configs/shape.ttl?raw';
	import {
		Chart as ChartJS,
		type Point,
		type BubbleDataPoint,
		type ChartTypeRegistry
	} from 'chart.js';
	import { onMount } from 'svelte';
	import { NamedNode, Parser } from 'n3';
	import { extractShapes } from 'rdf-lens';

	export let nodes: Node[];
	let running = false;

	let chart: ChartJS<
		keyof ChartTypeRegistry,
		(number | Point | [number, number] | BubbleDataPoint)[],
		unknown
	>;

	const scatterData: { x: Date; y: number }[] = [];

	let graphData: ScatterData = {
		datasets: [
			{
				borderColor: 'red',
				type: 'scatter',
				label: 'Dataset 2',
				data: <Point[]>(<any>scatterData),
				borderWidth: 2
			}
		]
	};

  let client: Client;
  let stream: ReadableStream<Member>;

  let url = "https://mumo.ilabt.imec.be/ldes/sds/root";
  
	function toggle() {
		if (running) {
      stream.cancel();
		} else {
		}
	}
</script>

<div>
	{#if { running }}
		<Chart bind:chart data={graphData} />
		<button on:click={toggle}>Configure!</button>
	{:else}
		<p>Not yet running, click running.</p>
    <Field />
		<button on:click={toggle}>Run!</button>
	{/if}
</div>
