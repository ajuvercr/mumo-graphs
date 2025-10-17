<script lang="ts">
	import { page } from '$app/stores';
	import LdesGraph from '$lib/components/LdesGraph.svelte';
	import NodeInfo from '$lib/components/NodeInfo.svelte';
	import type { NodeInstance, Sensor } from '$lib/configs';
	import { FoundNodes, dataFactory } from '$lib/ldes';
	import { onMount } from 'svelte';
	let nodeName: string = $page.params.slug;
	let node: NodeInstance | undefined;

	let sensors: { [id: string]: Sensor } = {};
	onMount(() => {
		FoundNodes.subscribe(async (x) => {
			await dataFactory.init();
			const f = x.find((y) => y.instance.title === nodeName);
			if (f && (!node || f.id !== node.id)) {
				if (node && node.time > f.time) {
					return;
				}
				node = f;

				const newSensors: typeof sensors = {};
				node.instance.hosts.forEach((s) => (newSensors[s.id] = s));
				sensors = newSensors;
			}
		});
	});
</script>

<div class="flex flex-col flex-wrap items-center justify-center gap-6">
	{#if node}
		<NodeInfo linked={false} node={node.instance} />

		<LdesGraph
			{sensors}
			factory={dataFactory}
			order="descending"
			config={{
				name: node.instance.title,
				url: 'https://mumo.ilabt.imec.be/ldes/nodes/root',
				location: [],
				nodes: [
					{
						value: node.instance.id,
						name: node.instance.title
					}
				],
				types: []
			}}
		/>
	{:else}
		Node not yet found.
	{/if}
</div>
