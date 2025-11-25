<script context="module" lang="ts">
	import type { Constraint, MultiParameters, RelationParameters } from '$lib/constraints';

	export type Config = {
		name: string;
		url: string;
		constraint: Constraint;
	};
</script>

<script lang="ts">
	import BaseConstraint from '$lib/components/constraints/Base.svelte';
	import { Input, Label, Button } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';

	export let config: Config;

	export let multiOptions: { [label: string]: MultiParameters };
	export let relationParameters: RelationParameters;

	const dispatch = createEventDispatcher<{ confirm: Config; cancle: {} }>();

	function validate() {
		console.log('Validating', config);
		dispatch('confirm', config);
	}

	let modal: HTMLDivElement;
	function clicked(e: Event) {
		if (e.target == modal) {
			console.log('Shoulld close');
			dispatch('cancle', {});
		}
	}
</script>

<div class="modal" bind:this={modal} on:click={clicked}>
	<div class="wrapper">
		<div>
			<Label for="name" class="mb-2">Graph name</Label>
			<Input type="text" id="name" placeholder="Namme" bind:value={config.name} />
		</div>
		<div>
			<Label for="url" class="mb-2">LDES Url</Label>
			<Input type="text" id="url" placeholder="Url" bind:value={config.url} />
		</div>

		<BaseConstraint bind:constraintData={config.constraint} {multiOptions} {relationParameters} />
		<Button on:click={validate} class="mtop-4 w-fit">Save!</Button>
		<pre>{JSON.stringify(config.constraint, undefined, 2)}</pre>
	</div>
</div>

<style>
	.modal {
		z-index: 999;
		position: fixed;
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;
		padding: 4rem;
		background-color: rgba(0, 0, 0, 0.2);
	}
	.wrapper {
		background-color: white;
		border: 1px solid black;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-height: 80vh;
		overflow: auto;
	}
</style>
