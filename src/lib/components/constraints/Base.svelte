<script lang="ts">
	import type { Constraint, MultiParameters, RelationParameters } from '$lib/constraints';
	import {
		isListConstraint,
		isMultiConstraint,
		isTimeIntervalConstraint as isRelationConstraint
	} from '$lib/constraints';
	import List from '$lib/components/constraints/List.svelte';
	import MultiValue from './MultiValue.svelte';
	import RelValue from './RelValue.svelte';

	export let constraintData: Constraint = { kind: 'and', children: [] };
	export let multiOptions: { [label: string]: MultiParameters };
	export let relationParameters: RelationParameters;
</script>

{#if isListConstraint(constraintData)}
	<List bind:constraintData {multiOptions} {relationParameters} />
{/if}

{#if isMultiConstraint(constraintData)}
	<MultiValue parameters={multiOptions[constraintData.name]} bind:constraintData />
{/if}

{#if isRelationConstraint(constraintData)}
	<RelValue rel={relationParameters} bind:constraintData />
{/if}
