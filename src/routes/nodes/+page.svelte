<script lang="ts">
	import NodeInfo from '$lib/components/NodeInfo.svelte';
	import { FoundNodes } from '$lib/ldes';
	FoundNodes.subscribe(console.log);
</script>

<div class="flex flex-wrap justify-center gap-6">
	{#each $FoundNodes as node}
			<NodeInfo node={node.instance} />
	{/each}
</div>
