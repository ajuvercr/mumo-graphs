<script lang="ts">
	import type { MultiValueConstraint, MultiParameters } from '$lib/constraints';
	import MyMultiSelect from '../config/MyMultiSelect.svelte';

	export let parameters: MultiParameters;
	export let constraintData: MultiValueConstraint;
</script>

<div class="constraint">
	<span><strong>{constraintData.name}</strong>: </span>
	<div class="multi-select">
		<MyMultiSelect items={parameters} bind:value={constraintData.values} />
	</div>
</div>

<style>
	.constraint {
		align-items: center;
		display: flex;
		gap: 1em;
	}
	.constraint div {
		flex: 1 1 auto;
		width: auto;
	}
</style>
