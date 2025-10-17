<script lang="ts">
	import { ConditionFactory } from '$lib/conditions';
	import { MeasurementLens, type Node, type Sensor } from '$lib/configs';
	import { Node as NodePath, TypePath } from '$lib/paths';
	import { fetch_f, type Measurement } from '$lib/utils';
	import { LDESThrottler } from '$lib/storage';
	import { enhanced_fetch, Factory } from 'ldes-client';
	import { ClockOutline, ArrowUpDownOutline, CheckCircleOutline } from 'flowbite-svelte-icons';

	import { onMount } from 'svelte';
	import LdesGraph from './LdesGraph.svelte';
	import Portal from './Portal.svelte';
	import { DataFactory } from 'n3';

	export let node: Node;
	export let observes: string[] = [];
	export let sensors: { [id: string]: Sensor };
	export let factory: Factory;

	const values: { [id: string]: { value: number; time: string } } = {};
	const { namedNode } = DataFactory;

	let state: 'waiting' | 'running' | 'done' = 'waiting';
	let open = false;

	onMount(async () => {
		const typeFactory = ConditionFactory.Or();

		for (const observe of observes) {
			const fs = typeFactory.and();
			fs.leaf(NodePath, namedNode(node.id));
			fs.leaf(TypePath, namedNode(observe));
			fs.limit(1);
		}

		LDESThrottler.callFunction(async () => {
			state = 'running';
			const client = factory.build(
				{
					condition: typeFactory.intoCondition(),
					fetch: enhanced_fetch({ concurrent: 2 }, fetch_f())
				},
				'descending'
			);

			const stream = client.stream().getReader();

			console.log('Starting mumo info!');
			let chunk = await stream.read();
			while (chunk && !chunk.done) {
				const output = <Measurement>MeasurementLens.execute(chunk.value);
				values[output.result.valueType] = {
					value: output.result.numericValue,
					time: output.date.toLocaleString()
				};

				chunk = await stream.read();
			}

			state = 'done';
		});
	});

	let id = '';
	$: {
		const segs = node.location?.id.value.split('/');
		if (segs) {
			id = segs[segs.length - 1];
		}
		console.log('node', node);
	}
</script>

<tr class:active={open}>
	<th scope="row" on:click={() => (open = !open)}>{node.title}</th>
	<td><a href={'https://heron.libis.be/momu-test/admin/item/' + id} target="_blank">{id}</a></td>

	{#each observes as key}
		<td>
			{#if values[key]}
				<div class="tooltip">
					{values[key].value.toFixed(2)}
					<span class="tooltiptext">
						{values[key].time}
					</span>
				</div>
			{/if}
		</td>
	{/each}
	<td>
		<div class="icon">
			{#if state == 'waiting'}
				<ClockOutline class="waiting" />
			{:else if state == 'running'}
				<ArrowUpDownOutline class="play" />
			{:else}
				<CheckCircleOutline class="done" />
			{/if}
		</div>
	</td>

	{#if open}
		<Portal target="#portals" bodyClass="modal-active">
			<LdesGraph
				{factory}
				{sensors}
				config={{
					name: node.title,
					url: 'https://mumo.ilabt.imec.be/ldes/nodes/root',
					nodes: [{ value: node.id, name: node.title }],
					types: [],
					location: []
				}}
				order="descending"
				autoPlay={true}
			/>
		</Portal>
	{/if}
</tr>

<style>
	.active {
		background-color: pink;
	}
	.values {
		display: flex;
		justify-content: space-evenly;
	}
	:global(.prim) {
		color: theme('colors.primary.600');
	}
	main {
		max-width: 80%;
		margin: auto;
		display: relative;
	}

	th {
		cursor: pointer;
	}

	th,
	td {
		border: 1px solid rgb(160 160 160);
		padding: 8px 10px;
		text-align: center;
	}
	.icon {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: space-around;
	}
	/* Tooltip container */
	.tooltip {
		position: relative;
		display: inline-block;
		border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
	}

	/* Tooltip text */
	.tooltip .tooltiptext {
		visibility: hidden;
		width: 120px;
		background-color: #555;
		color: #fff;
		text-align: center;
		padding: 5px 0;
		border-radius: 6px;

		/* Position the tooltip text */
		position: absolute;
		z-index: 1;
		bottom: 125%;
		left: 50%;
		margin-left: -60px;

		/* Fade in tooltip */
		opacity: 0;
		transition: opacity 0.3s;
	}

	/* Tooltip arrow */
	.tooltip .tooltiptext::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: #555 transparent transparent transparent;
	}

	/* Show the tooltip text when you mouse over the tooltip container */
	.tooltip:hover .tooltiptext {
		visibility: visible;
		opacity: 1;
	}
</style>
