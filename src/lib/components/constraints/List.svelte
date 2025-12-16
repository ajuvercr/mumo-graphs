<script lang="ts">
	import type {
		ListConstraint,
		Constraint,
		MultiParameters,
		RelationParameters,
		RelationConstraint
	} from '$lib/constraints';
	import { capitalize } from '$lib/utils';
	import { Button } from 'flowbite-svelte';
	import RadioType from '../parts/RadioType.svelte';
	import Base from './Base.svelte';

	export let multiOptions: { [label: string]: MultiParameters };
	export let relationParameters: RelationParameters;
	export let constraintData: ListConstraint;

	function deleteChild(i: number) {
		constraintData.children.splice(i, 1);
		constraintData = { kind: constraintData.kind, children: [...constraintData.children] };
	}

	function addConstraintToList(child: Constraint) {
		constraintData = { kind: constraintData.kind, children: [...constraintData.children, child] };
	}

	function newRelProperty(property: { name: string; value: string }): RelationConstraint {
		return {
			kind: 'rel',
			property,
			type: relationParameters.relations[0],
			value: '',
			choice: 'date'
		};
	}

	let opts = Object.keys(multiOptions);
</script>

<div class="list">
	<RadioType options={['and', 'or']} bind:value={constraintData.kind} />
	<div class="items">
		{#each constraintData.children as child, i}
			<div class="child">
				<div>
					<Base bind:constraintData={child} {multiOptions} {relationParameters} />
				</div>
				<button on:click={() => deleteChild(i)}>Delete</button>
			</div>
		{/each}
	</div>
	<footer>
		<div class="add-menu">
			<span>Add constrain on:</span>
			<Button
				color="alternative"
				class="btn"
				on:click={() => addConstraintToList({ kind: 'and', children: [] })}>AND</Button
			>
			<Button color="alternative" on:click={() => addConstraintToList({ kind: 'or', children: [] })}
				>OR</Button
			>
			{#each opts as opt}
				<Button
					color="alternative"
					on:click={() => addConstraintToList({ kind: 'multi', name: opt, values: [] })}
					>{capitalize(opt)}</Button
				>
			{/each}
			{#each relationParameters.properties as rel}
				<Button color="alternative" on:click={() => addConstraintToList(newRelProperty(rel))}>
					{capitalize(rel.name)}</Button
				>
			{/each}
		</div>
	</footer>
</div>

<style>
	.list {
		margin: 0.5em;
		padding: 0.5em;
		border-radius: 6px;
		border: 1px solid black;
	}

	.child {
		border-radius: 6px;
		padding: 0.5em;
		display: flex;
		gap: 1em;
		align-items: center;
	}
	.items {
		margin-left: 2em;
	}
	.child:has(> button:hover) {
		background-color: yellow;
	}
	.add-menu {
		display: flex;
		gap: 1em;
		margin-top: 1em;
		margin-left: 1em;
		align-items: center;
	}

	.child > div {
		flex: 1 1 auto;
		width: auto;
	}
</style>
