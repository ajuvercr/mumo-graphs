<script lang="ts">
	import type {
		ListConstraint,
		Constraint,
		MultiParameters,
		RelationParameters,
		RelationConstraint
	} from '$lib/constraints';
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

	function newRelProperty(): RelationConstraint {
		return {
			kind: 'rel',
			property: relationParameters.properties[0],
			type: relationParameters.relations[0],
			value: '',
			choice: 'text'
		};
	}

	let opts = Object.keys(multiOptions);
	let selectedKind = opts[0];
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
			<button on:click={() => addConstraintToList({ kind: 'and', children: [] })}>+ AND</button>
			<button on:click={() => addConstraintToList({ kind: 'or', children: [] })}>+ OR</button>
			<div class="others">
				<button
					on:click={() =>
						addConstraintToList({
							kind: 'multi',
							name: selectedKind,
							values: []
						})}
					>+ Add
				</button>
				<select bind:value={selectedKind}>
					{#each opts as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>
			<button on:click={() => addConstraintToList(newRelProperty())}>+ Relation</button>
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
		gap: 2em;
	}

	.child > div {
		flex: 1 1 auto;
		width: auto;
	}
</style>
