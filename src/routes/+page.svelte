<script lang="ts">
	import type { PageData } from './$types';
	import { NodeInstanceLens, type Node as N, type Sensor } from '$lib/configs/index';
	import { fetch_f, toasts } from '$lib/utils';
	import { Location, SensorPath } from '$lib/paths.ts';
	import { onMount } from 'svelte';
	import type { Config } from '$lib/components/config/LdesConfig.svelte';
	import { base } from '$app/paths';
	import { Factory } from 'ldes-client';
	import MumoInfo from '$lib/components/MumoInfo.svelte';

	export let data: PageData;
	onMount(() => {
		console.log(Location);
		console.log(SensorPath);
		console.log(Node);
	});

	let configs: Config[] = [];

	let foundNodes: N[] = [];
	let foundNodeIdx = new Set<string>();

	let observes: string[] = [];
	let data_factory: Factory = new Factory({
		url: 'https://mumo.ilabt.imec.be/ldes/default',
		fetch: fetch_f()
	});
	const sensors: { [label: string]: Sensor } = {};

	onMount(async () => {
		console.log('Page on mount');
		const response = await fetch(base + '/api/state', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		configs = await response.json();

		const client = new Factory({
			url: 'https://mumo.ilabt.imec.be/nodes/default',
			fetch: fetch_f()
		});
		await data_factory.init();

		const reader = client.stream({}, 'none').getReader();
		let mem = await reader.read();
		let members = 0;
		while (mem) {
			if (mem.done) break;
			console.log(mem);

			const node = NodeInstanceLens.execute(mem.value);
			console.log(node);
			if (node.instance.title == 'test') {
				mem = await reader.read();
				continue;
			}
			for (const sensor of node.instance.hosts) {
				sensors[sensor.id] = sensor;
			}

			if (!foundNodeIdx.has(node.instance.id)) {
				foundNodeIdx.add(node.instance.id);
				foundNodes = [...foundNodes, node.instance];
				for (const host of node.instance.hosts) {
					const ob = host.observes;
					if (observes.indexOf(ob) === -1) {
						observes = [...observes, ob];
					}
				}
			}
			members += 1;
			mem = await reader.read();
		}

		console.log('Total', members);
	});

	$: console.log('toats', toasts);
</script>

<main class="relative">
	<div>
		<table>
			<thead>
				<tr>
					<th scope="col">Name</th>
					<th scope="col">Id</th>
					{#each observes as observe}
						<th scope="col">{observe.substring(observe.lastIndexOf('#'))}</th>
					{/each}
					<th scope="col">Done</th>
				</tr>
			</thead>
			<tbody>
				{#each foundNodes as node}
					<MumoInfo factory={data_factory} {node} {sensors} {observes} />
				{/each}
			</tbody>
		</table>

		{#each foundNodes as node}
			<p>
				{node.id}
				{node.title}
			</p>
		{/each}
	</div>
	<div id="portals">
		<!-- modals will be appended here -->
	</div>
</main>

<style>
	.relative {
		display: flex;
		width: 100%;
		justify-content: space-between;
	}
	.values {
		display: flex;
		justify-content: space-evenly;
	}
	.portals {
		width: 25%;
	}
	:global(.prim) {
		color: theme('colors.primary.600');
	}
	main {
		max-width: 80%;
		margin: 40px auto;
		display: relative;
	}

	table {
		border-collapse: collapse;
		border: 2px solid rgb(140 140 140);
		font-family: sans-serif;
		font-size: 0.8rem;
		letter-spacing: 1px;
		width: 70%;
	}
	thead,
	tfoot {
		background-color: rgb(228 240 245);
	}
	th,
	td {
		border: 1px solid rgb(160 160 160);
		padding: 8px 10px;
		text-align: center;
	}

	:global(tbody > tr:nth-of-type(even)) {
		background-color: rgb(237 238 242);
	}
</style>
