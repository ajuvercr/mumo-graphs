<script lang="ts">
	import { Writer } from 'n3';
	import { PlatformsFromPage } from '$lib/consts';
	import type { PageData } from './$types';
	import type { Quad } from '@rdfjs/types';
	import Node from '$lib/components/Node.svelte';
	import JsonObject from '$lib/components/JsonObject.svelte';

	export let data: PageData;
	let title = 'Testing title';

	let nodes = PlatformsFromPage.execute(data.quads);

	async function writeQuads(quads: Quad[]): Promise<string> {
		const writer = new Writer({ format: 'text/turtle' });
		const ctx: { [label: string]: string } = data.context['@context'];

		for (let key of Object.keys(ctx)) {
			await new Promise((res) => writer.addPrefix(key, ctx[key], () => res({})));
		}
		writer.addQuads(quads);

		return await new Promise((res) => {
			writer.end((_, result) => {
				res(result);
			});
		});
	}

	let quad_str = '';
	let sensors = data.sensors;
	let platforms = data.platforms;

	console.log(JSON.stringify(sensors, undefined, 2));
	writeQuads(data.quads).then((x) => (quad_str = x));
</script>

<h1>{title}</h1>
<section>
	<header><h3>Sensors</h3></header>

	<div class="objects">
		{#each sensors as sensor}
			<JsonObject object={sensor} />
		{/each}
	</div>
</section>
<section>
	<header><h3>Platforms</h3></header>

	<div class="objects">
		{#each platforms as platform}
			<JsonObject object={platform} />
		{/each}
	</div>
</section>

<section class="nodes">
	{#each nodes as node}
		<Node {...node} />
	{/each}
</section>

<p>{JSON.stringify(nodes)}</p>
<p>{data.quads.length}</p>

<pre>{quad_str}</pre>

<style>
	.nodes {
		margin: 0 5%;
		display: grid;
		gap: 40px;
		grid-template-columns: repeat(3, 1fr [col-start]);
	}
	.objects {
		display: flex;
		flex-wrap: wrap;
		gap: 40px;
	}
</style>
